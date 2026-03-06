const express = require('express');
const { query } = require('../db');
const { getBlocksByProperty, verifyChainIntegrity } = require('../blockchain/blockchain');

const publicRouter = express.Router();

// Lookup by propertyId
publicRouter.get('/property/:propertyId', async (req, res) => {
  const { propertyId } = req.params;

  const { rows: propRows } = await query('SELECT * FROM properties WHERE property_id = $1', [
    propertyId,
  ]);
  const prop = propRows[0];
  if (!prop) return res.status(404).json({ error: true, message: 'Property not found' });

  const blocks = await getBlocksByProperty(propertyId);

  res.json({
    property: prop,
    blocks,
    mortgageStatus: prop.mortgage_status,
    litigationStatus: prop.litigation_status,
    riskScore: prop.risk_score,
    chainValid: await verifyChainIntegrity(),
  });
});

// Lookup by block/transaction id
publicRouter.get('/tx/:blockId', async (req, res) => {
  const { blockId } = req.params;
  const { rows } = await query('SELECT * FROM blocks WHERE id = $1', [blockId]);
  const block = rows[0];
  if (!block) return res.status(404).json({ error: true, message: 'Transaction not found' });

  res.json({
    block,
    chainValid: await verifyChainIntegrity(),
  });
});

module.exports = { publicRouter };

