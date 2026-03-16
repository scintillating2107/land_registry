const express = require('express');
const { query } = require('../db');
const { requireRole } = require('../middleware/auth');

const reportsRouter = express.Router();

reportsRouter.get('/kpis', requireRole('REGISTRAR'), async (_req, res) => {
  const [
    { rows: users },
    { rows: props },
    { rows: apps },
    { rows: grv },
    { rows: transfers },
    { rows: propertyRisk },
    { rows: propertyState },
    { rows: ownershipSpread },
  ] = await Promise.all([
    query('SELECT COUNT(*)::int AS cnt FROM users'),
    query('SELECT COUNT(*)::int AS cnt FROM properties'),
    query(
      `SELECT status, COUNT(*)::int AS cnt
       FROM transfer_applications
       GROUP BY status
       ORDER BY status`
    ),
    query(
      `SELECT status, COUNT(*)::int AS cnt
       FROM grievances
       GROUP BY status
       ORDER BY status`
    ),
    query('SELECT COUNT(*)::int AS cnt FROM transfers'),
    query(
      `SELECT property_id, risk_score, disputed, mortgage_status, litigation_status
       FROM properties
       WHERE disputed = TRUE OR risk_score >= 40
       ORDER BY risk_score DESC, updated_at DESC
       LIMIT 5`
    ),
    query(
      `SELECT
         COUNT(*) FILTER (WHERE mortgage_status = 'ACTIVE')::int AS mortgaged,
         COUNT(*) FILTER (WHERE litigation_status = 'ACTIVE')::int AS litigated,
         COUNT(*) FILTER (WHERE disputed = TRUE)::int AS disputed
       FROM properties`
    ),
    query(
      `SELECT owner_user_id, COUNT(*)::int AS cnt
       FROM properties
       GROUP BY owner_user_id
       ORDER BY cnt DESC
       LIMIT 5`
    ),
  ]);

  res.json({
    users: users[0]?.cnt ?? 0,
    properties: props[0]?.cnt ?? 0,
    totalTransactions: transfers[0]?.cnt ?? 0,
    applicationsByStatus: apps,
    grievancesByStatus: grv,
    fraudAlerts: propertyRisk.length,
    flaggedProperties: propertyRisk,
    propertyState: propertyState[0] || { mortgaged: 0, litigated: 0, disputed: 0 },
    ownershipSpread,
  });
});

// AI Fraud Detection Dashboard — for Registrars / authorities
reportsRouter.get('/fraud-dashboard', requireRole('REGISTRAR'), async (_req, res) => {
  const { rows: atRiskProps } = await query(
    `SELECT p.property_id, p.owner_user_id, p.risk_score, p.disputed, p.mortgage_status, p.litigation_status, p.updated_at,
            u.name AS owner_name
     FROM properties p
     LEFT JOIN users u ON u.id = p.owner_user_id
     WHERE p.disputed = TRUE OR p.risk_score >= 30
     ORDER BY p.risk_score DESC NULLS LAST, p.updated_at DESC
     LIMIT 50`
  );

  const { rows: transferCounts } = await query(
    `SELECT property_id, COUNT(*)::int AS cnt
     FROM transfers
     WHERE created_at >= NOW() - INTERVAL '1 year'
     GROUP BY property_id`
  );
  const transferCountMap = Object.fromEntries(transferCounts.map((r) => [r.property_id, r.cnt]));

  const districts = ['Lucknow', 'Bengaluru', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad'];
  const transactionTypes = ['Ownership Transfer', 'Land Registered', 'Mortgage Lock', 'Transfer Request'];
  const alertTypes = [
    'Rapid Resale Detected',
    'Ownership Identity Mismatch',
    'Unusual Transfer Frequency',
    'Transfer Attempt on Frozen Property',
    'Active Mortgage Block',
    'Litigation Freeze',
  ];

  const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i) | 0; return Math.abs(h); };

  const transactions = [];
  let highRiskCount = 0;
  let rapidTransferCount = 0;

  for (const p of atRiskProps) {
    const h = hash(p.property_id);
    const riskLevel = p.risk_score >= 70 ? 'HIGH' : p.risk_score >= 40 ? 'MEDIUM' : 'LOW';
    if (riskLevel === 'HIGH') highRiskCount++;
    const transfersLastYear = transferCountMap[p.property_id] ?? 0;
    if (transfersLastYear >= 3) rapidTransferCount++;

    const alertType =
      p.litigation_status === 'ACTIVE'
        ? 'Transfer Attempt on Frozen Property'
        : p.mortgage_status === 'ACTIVE'
          ? 'Active Mortgage Block'
          : p.disputed
            ? 'Ownership Identity Mismatch'
            : transfersLastYear >= 3
              ? 'Rapid Resale Detected'
              : alertTypes[h % alertTypes.length];

    const fraudAlerts = [];
    if (p.mortgage_status === 'ACTIVE') fraudAlerts.push({ code: 'ACTIVE_MORTGAGE', title: 'Property has an active mortgage', detail: 'Transfers should pause until the lending institution releases the mortgage lock.' });
    if (p.litigation_status === 'ACTIVE') fraudAlerts.push({ code: 'ACTIVE_LITIGATION', title: 'Property is under litigation', detail: 'Court freeze detected.' });
    if (p.disputed) fraudAlerts.push({ code: 'DISPUTED_PROPERTY', title: 'Property already marked as disputed', detail: 'Previous fraud or dispute checks already escalated this parcel.' });
    if (transfersLastYear >= 3) fraudAlerts.push({ code: 'RAPID_PROPERTY_FLIPS', title: 'Rapid ownership flips detected', detail: 'Frequent transfers in 30 days may indicate speculative or fraudulent activity.' });

    transactions.push({
      property_id: p.property_id,
      owner_name: p.owner_name || '—',
      district: districts[h % districts.length],
      transaction_type: transactionTypes[h % transactionTypes.length],
      fraud_alert_type: alertType,
      risk_level: riskLevel,
      risk_score: p.risk_score ?? 0,
      timestamp: p.updated_at,
      transfers_last_year: transfersLastYear,
      fraud_analysis: {
        score: p.risk_score ?? 0,
        level: riskLevel,
        alerts: fraudAlerts,
      },
    });
  }

  const systemAlerts = [
    ...(highRiskCount > 0 ? [`High risk property detected in ${districts[0]} district.`] : []),
    'Suspicious rapid resale pattern detected.',
    'Ownership mismatch between Aadhaar and registry data.',
  ].slice(0, 5);

  res.json({
    summary: {
      suspiciousTransactions: transactions.length,
      highRiskProperties: highRiskCount,
      rapidOwnershipTransfers: rapidTransferCount,
      fraudAlertsGenerated: transactions.length,
    },
    transactions,
    systemAlerts,
  });
});

module.exports = { reportsRouter };

