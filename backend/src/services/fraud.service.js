const { query } = require('../db');

function makeAlert(code, severity, title, detail) {
  return { code, severity, title, detail };
}

function summarizeFraud(alerts) {
  const score = alerts.reduce((total, alert) => total + alert.severity, 0);
  const suspicious = score >= 60 || alerts.some((alert) => alert.severity >= 35);

  let level = 'LOW';
  if (score >= 80) level = 'HIGH';
  else if (score >= 40) level = 'MEDIUM';

  return {
    suspicious,
    score,
    level,
    alerts,
  };
}

async function analyzePropertyFraud({ propertyId, expectedOwnerUserId = null }) {
  const alerts = [];

  const { rows: propRows } = await query(
    `SELECT property_id, owner_user_id, mortgage_status, litigation_status, disputed, risk_score, state, district, boundary_geojson
     FROM properties
     WHERE property_id = $1`,
    [propertyId]
  );
  const property = propRows[0];

  if (!property) {
    return summarizeFraud([
      makeAlert('PROPERTY_NOT_FOUND', 100, 'Property record missing', 'No registered property was found.'),
    ]);
  }

  if (expectedOwnerUserId && property.owner_user_id !== expectedOwnerUserId) {
    alerts.push(
      makeAlert(
        'OWNER_MISMATCH',
        45,
        'Seller does not match current owner',
        'The requested seller identity does not match the latest ownership record.'
      )
    );
  }

  if (property.mortgage_status === 'ACTIVE') {
    alerts.push(
      makeAlert(
        'ACTIVE_MORTGAGE',
        30,
        'Property has an active mortgage',
        'Transfers should pause until the lending institution releases the mortgage lock.'
      )
    );
  }

  if (property.litigation_status === 'ACTIVE') {
    alerts.push(
      makeAlert(
        'ACTIVE_LITIGATION',
        35,
        'Property is under litigation',
        'Court freeze detected. Ownership change should be blocked until the dispute is closed.'
      )
    );
  }

  if (property.disputed) {
    alerts.push(
      makeAlert(
        'DISPUTED_PROPERTY',
        40,
        'Property already marked as disputed',
        'Previous fraud or dispute checks already escalated this parcel.'
      )
    );
  }

  // Simple boundary overlap check (same district/state only)
  if (property.boundary_geojson && property.district && property.state) {
    const { rows: overlapCandidates } = await query(
      `SELECT property_id, boundary_geojson
       FROM properties
       WHERE property_id <> $1
         AND district = $2
         AND state = $3
         AND boundary_geojson IS NOT NULL`,
      [propertyId, property.district, property.state]
    );

    // Naive bounding-box intersection to flag potential duplicates
    const getBBox = (geojson) => {
      try {
        const coords = geojson.coordinates?.[0] || [];
        if (!coords.length) return null;
        let minLat = Number.POSITIVE_INFINITY;
        let maxLat = Number.NEGATIVE_INFINITY;
        let minLng = Number.POSITIVE_INFINITY;
        let maxLng = Number.NEGATIVE_INFINITY;
        coords.forEach(([lng, lat]) => {
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
        });
        return { minLat, maxLat, minLng, maxLng };
      } catch {
        return null;
      }
    };

    const bboxA = getBBox(property.boundary_geojson);
    if (bboxA) {
      overlapCandidates.forEach((other) => {
        const bboxB = getBBox(other.boundary_geojson);
        if (!bboxB) return;
        const intersects =
          bboxA.minLat <= bboxB.maxLat &&
          bboxA.maxLat >= bboxB.minLat &&
          bboxA.minLng <= bboxB.maxLng &&
          bboxA.maxLng >= bboxB.minLng;
        if (intersects) {
          alerts.push(
            makeAlert(
              'BOUNDARY_OVERLAP',
              35,
              'Potential duplicate land parcel',
              `Land boundary overlaps with another registered property (${other.property_id}) in the same district.`
            )
          );
        }
      });
    }
  }

  const { rows: sameHourRows } = await query(
    `SELECT COUNT(*)::int AS cnt
     FROM transfers
     WHERE property_id = $1
       AND created_at >= NOW() - INTERVAL '1 hour'`,
    [propertyId]
  );
  if (sameHourRows[0].cnt > 1) {
    alerts.push(
      makeAlert(
        'DUPLICATE_SALE_WINDOW',
        30,
        'Multiple sale attempts in a short window',
        'This parcel has been transferred more than once in the last hour.'
      )
    );
  }

  const { rows: flipsRows } = await query(
    `SELECT COUNT(*)::int AS cnt
     FROM transfers
     WHERE property_id = $1
       AND created_at >= NOW() - INTERVAL '30 days'`,
    [propertyId]
  );
  if (flipsRows[0].cnt > 3) {
    alerts.push(
      makeAlert(
        'RAPID_PROPERTY_FLIPS',
        20,
        'Rapid ownership flips detected',
        'Frequent transfers in 30 days may indicate speculative or fraudulent activity.'
      )
    );
  }

  return summarizeFraud(alerts);
}

async function evaluateFraudForTransfer({ propertyId, fromUserId }) {
  const fraudAnalysis = await analyzePropertyFraud({
    propertyId,
    expectedOwnerUserId: fromUserId,
  });

  const { rows: sellerRapid } = await query(
    `SELECT COUNT(DISTINCT property_id)::int AS cnt
     FROM transfers
     WHERE from_user_id = $1
       AND created_at >= NOW() - INTERVAL '1 hour'`,
    [fromUserId]
  );

  if (sellerRapid[0].cnt > 3) {
    fraudAnalysis.alerts.push(
      makeAlert(
        'SELLER_RAPID_ACTIVITY',
        25,
        'Seller is moving many properties rapidly',
        'The same seller has initiated transfers across multiple properties in the last hour.'
      )
    );
  }

  const finalFraud = summarizeFraud(fraudAnalysis.alerts);

  if (finalFraud.suspicious) {
    await query('UPDATE properties SET disputed = TRUE, updated_at = NOW() WHERE property_id = $1', [
      propertyId,
    ]);
  }

  return finalFraud;
}

module.exports = {
  analyzePropertyFraud,
  evaluateFraudForTransfer,
};

