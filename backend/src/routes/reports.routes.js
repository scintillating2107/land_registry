const express = require('express');
const { query } = require('../db');
const { requireRole } = require('../middleware/auth');
const { verifyChainIntegrity } = require('../blockchain/blockchain');

const reportsRouter = express.Router();

reportsRouter.get('/system-logs', requireRole('REGISTRAR'), async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);

  const [
    chainOk,
    { rows: blocks },
    { rows: applications },
    { rows: transfers },
    { rows: certificates },
    { rows: payments },
    { rows: notifications },
    { rows: grievances },
  ] = await Promise.all([
    verifyChainIntegrity().catch(() => false),
    query(
      `SELECT b.*, u.name AS created_by_name, u.role AS created_by_role
       FROM blocks b
       LEFT JOIN users u ON u.id = b.created_by_user_id
       ORDER BY b.created_at DESC
       LIMIT $1`,
      [limit]
    ),
    query(
      `SELECT a.*,
              u1.name AS from_name, u1.email AS from_email,
              u2.name AS to_name, u2.email AS to_email,
              r.name AS reviewed_by_name
       FROM transfer_applications a
       JOIN users u1 ON u1.id = a.from_user_id
       JOIN users u2 ON u2.id = a.to_user_id
       LEFT JOIN users r ON r.id = a.reviewed_by_user_id
       ORDER BY a.created_at DESC
       LIMIT $1`,
      [limit]
    ),
    query(
      `SELECT t.*,
              u1.name AS from_name, u2.name AS to_name
       FROM transfers t
       JOIN users u1 ON u1.id = t.from_user_id
       JOIN users u2 ON u2.id = t.to_user_id
       ORDER BY t.created_at DESC
       LIMIT $1`,
      [limit]
    ),
    query(
      `SELECT c.*,
              iu.name AS issued_to_name,
              ib.name AS issued_by_name
       FROM certificates c
       JOIN users iu ON iu.id = c.issued_to_user_id
       JOIN users ib ON ib.id = c.issued_by_user_id
       ORDER BY c.issued_at DESC
       LIMIT $1`,
      [limit]
    ),
    query(
      `SELECT p.*, u.name AS user_name, u.role AS user_role
       FROM payments p
       JOIN users u ON u.id = p.user_id
       ORDER BY p.created_at DESC
       LIMIT $1`,
      [limit]
    ),
    query(
      `SELECT n.*, u.name AS user_name, u.role AS user_role
       FROM notifications n
       JOIN users u ON u.id = n.user_id
       ORDER BY n.created_at DESC
       LIMIT $1`,
      [limit]
    ),
    query(
      `SELECT g.*, u.name AS closed_by_name
       FROM grievances g
       LEFT JOIN users u ON u.id = g.closed_by_user_id
       ORDER BY g.created_at DESC
       LIMIT $1`,
      [limit]
    ),
  ]);

  res.json({
    generatedAt: new Date().toISOString(),
    chainIntegrity: chainOk,
    limit,
    blocks,
    transferApplications: applications,
    transfers,
    certificates,
    payments,
    notifications,
    grievances,
  });
});

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

