const { query } = require('../db');

// Simple rule-based fraud detection.
// Flags:
// - Same property transferred multiple times in short window
// - Same seller transferring many properties rapidly
// - Many flips on same property recently

async function evaluateFraudForTransfer({ propertyId, fromUserId }) {
  let suspicious = false;

  // Same property transferred more than once in last 1 hour
  const { rows: propTransfersWindow } = await query(
    `SELECT COUNT(*)::int AS cnt
     FROM transfers
     WHERE property_id = $1
       AND created_at >= NOW() - INTERVAL '1 hour'`,
    [propertyId]
  );
  if (propTransfersWindow[0].cnt > 1) {
    suspicious = true;
  }

  // Same seller transferring many properties in last 1 hour
  const { rows: sellerRapid } = await query(
    `SELECT COUNT(DISTINCT property_id)::int AS cnt
     FROM transfers
     WHERE from_user_id = $1
       AND created_at >= NOW() - INTERVAL '1 hour'`,
    [fromUserId]
  );
  if (sellerRapid[0].cnt > 3) {
    suspicious = true;
  }

  // Many flips on same property in last 30 days
  const { rows: flips } = await query(
    `SELECT COUNT(*)::int AS cnt
     FROM transfers
     WHERE property_id = $1
       AND created_at >= NOW() - INTERVAL '30 days'`,
    [propertyId]
  );
  if (flips[0].cnt > 3) {
    suspicious = true;
  }

  if (suspicious) {
    await query('UPDATE properties SET disputed = TRUE, updated_at = NOW() WHERE property_id = $1', [
      propertyId,
    ]);
  }

  return suspicious;
}

module.exports = {
  evaluateFraudForTransfer,
};

