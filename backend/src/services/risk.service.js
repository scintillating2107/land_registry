const { query } = require('../db');

// Risk scoring rules:
// Active mortgage: +30
// Active litigation: +40
// Multiple transfers in last 365 days: +15
// Frequent ownership changes (>3 total): +10

async function computeRiskScore(propertyId) {
  const { rows: propRows } = await query(
    'SELECT mortgage_status, litigation_status FROM properties WHERE property_id = $1',
    [propertyId]
  );
  const prop = propRows[0];
  if (!prop) return 0;

  let score = 0;
  if (prop.mortgage_status === 'ACTIVE') score += 30;
  if (prop.litigation_status === 'ACTIVE') score += 40;

  const { rows: transfersLastYear } = await query(
    `SELECT COUNT(*)::int AS cnt
     FROM transfers
     WHERE property_id = $1
       AND created_at >= NOW() - INTERVAL '365 days'`,
    [propertyId]
  );
  if (transfersLastYear[0].cnt > 1) score += 15;

  const { rows: totalTransfers } = await query(
    `SELECT COUNT(*)::int AS cnt
     FROM transfers
     WHERE property_id = $1`,
    [propertyId]
  );
  if (totalTransfers[0].cnt > 3) score += 10;

  await query('UPDATE properties SET risk_score = $1, updated_at = NOW() WHERE property_id = $2', [
    score,
    propertyId,
  ]);

  return score;
}

module.exports = {
  computeRiskScore,
};

