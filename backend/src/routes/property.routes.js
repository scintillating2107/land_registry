const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

const { query } = require('../db');
const { requireRole } = require('../middleware/auth');
const { appendBlock, getBlocksByProperty } = require('../blockchain/blockchain');
const { computeRiskScore } = require('../services/risk.service');
const { evaluateFraudForTransfer } = require('../services/fraud.service');
const { validateIpfsHash } = require('../services/ipfs.service');
const {
  onChainRegister,
  onChainTransfer,
  onChainMortgageLock,
  onChainMortgageRelease,
  onChainLitigationFreeze,
  onChainLitigationUnfreeze,
} = require('../blockchain/evmAdapter');

const propertyRouter = express.Router();

const registerSchema = Joi.object({
  propertyId: Joi.string().required(),
  ownerUserId: Joi.string().guid({ version: 'uuidv4' }).required(),
  geoCoordinates: Joi.string().required(), // "lat,lng"
  ipfsHash: Joi.string().allow('', null),
});

propertyRouter.post('/register', requireRole('REGISTRAR'), async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ error: true, message: error.message });

  const { propertyId, ownerUserId, geoCoordinates, ipfsHash } = value;
  const ipfsValidation = validateIpfsHash(ipfsHash);
  if (!ipfsValidation.ok) {
    return res.status(400).json({ error: true, message: ipfsValidation.message });
  }

  const { rows: existing } = await query('SELECT * FROM properties WHERE property_id = $1', [
    propertyId,
  ]);
  if (existing.length > 0) {
    return res.status(400).json({ error: true, message: 'Property already registered' });
  }

  const { rows: ownerRows } = await query('SELECT id FROM users WHERE id = $1', [ownerUserId]);
  if (ownerRows.length === 0) {
    return res.status(400).json({ error: true, message: 'Owner user does not exist' });
  }

  const id = uuidv4();
  await query(
    `INSERT INTO properties(id, property_id, owner_user_id, geo_coordinates, ipfs_hash)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, propertyId, ownerUserId, geoCoordinates, ipfsHash || null]
  );

  const block = await appendBlock({
    txType: 'LAND_REGISTER',
    propertyId,
    payload: { propertyId, ownerUserId, geoCoordinates, ipfsHash },
    createdByUserId: req.user.sub,
  });

  await computeRiskScore(propertyId);

  // Optional on-chain mirror
  if (process.env.USE_EVM_BLOCKCHAIN === 'true') {
    const ownerAddress = process.env.EVM_DEFAULT_OWNER_ADDRESS || '0x0000000000000000000000000000000000000000';
    onChainRegister({ propertyId, ownerAddress, ipfsHash }).catch((err) =>
      console.error('On-chain register failed', err)
    );
  }

  const { rows: propRows } = await query('SELECT * FROM properties WHERE property_id = $1', [
    propertyId,
  ]);

  res.status(201).json({ property: propRows[0], block });
});

const transferSchema = Joi.object({
  propertyId: Joi.string().required(),
  fromUserId: Joi.string().guid({ version: 'uuidv4' }).required(),
  toUserId: Joi.string().guid({ version: 'uuidv4' }).required(),
});

// For MVP, registrar executes validated transfer (citizen "request" is simulated in UI)
propertyRouter.post('/transfer', requireRole('REGISTRAR'), async (req, res) => {
  const { error, value } = transferSchema.validate(req.body);
  if (error) return res.status(400).json({ error: true, message: error.message });

  const { propertyId, fromUserId, toUserId } = value;

  const { rows: propRows } = await query('SELECT * FROM properties WHERE property_id = $1', [
    propertyId,
  ]);
  const prop = propRows[0];
  if (!prop) return res.status(404).json({ error: true, message: 'Property not found' });

  if (prop.owner_user_id !== fromUserId) {
    return res.status(400).json({ error: true, message: 'Seller is not current owner' });
  }
  if (prop.mortgage_status === 'ACTIVE') {
    return res.status(400).json({ error: true, message: 'Transfer blocked: active mortgage' });
  }
  if (prop.litigation_status === 'ACTIVE') {
    return res.status(400).json({ error: true, message: 'Transfer blocked: active litigation' });
  }
  if (prop.disputed) {
    return res.status(400).json({ error: true, message: 'Transfer blocked: property disputed' });
  }

  const { rows: toUserRows } = await query('SELECT id FROM users WHERE id = $1', [toUserId]);
  if (toUserRows.length === 0) {
    return res.status(400).json({ error: true, message: 'Buyer user does not exist' });
  }

  await query(
    'UPDATE properties SET owner_user_id = $1, updated_at = NOW() WHERE property_id = $2',
    [toUserId, propertyId]
  );

  const transferId = uuidv4();
  const block = await appendBlock({
    txType: 'TRANSFER',
    propertyId,
    payload: { propertyId, fromUserId, toUserId },
    createdByUserId: req.user.sub,
  });

  await query(
    `INSERT INTO transfers(id, property_id, from_user_id, to_user_id, tx_block_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [transferId, propertyId, fromUserId, toUserId, block.id]
  );

  await computeRiskScore(propertyId);
  const suspicious = await evaluateFraudForTransfer({ propertyId, fromUserId });

  if (process.env.USE_EVM_BLOCKCHAIN === 'true') {
    const fromAddress = process.env.EVM_DEFAULT_OWNER_ADDRESS || '0x0000000000000000000000000000000000000000';
    const toAddress = process.env.EVM_DEFAULT_BUYER_ADDRESS || fromAddress;
    onChainTransfer({ propertyId, fromAddress, toAddress }).catch((err) =>
      console.error('On-chain transfer failed', err)
    );
  }

  const { rows: updatedPropRows } = await query('SELECT * FROM properties WHERE property_id = $1', [
    propertyId,
  ]);

  res.json({
    property: updatedPropRows[0],
    block,
    suspicious,
  });
});

// Mortgage lock/unlock (BANK)
propertyRouter.post('/:propertyId/mortgage/lock', requireRole('BANK'), async (req, res) => {
  const { propertyId } = req.params;
  const { rows: propRows } = await query('SELECT * FROM properties WHERE property_id = $1', [
    propertyId,
  ]);
  const prop = propRows[0];
  if (!prop) return res.status(404).json({ error: true, message: 'Property not found' });
  if (prop.mortgage_status === 'ACTIVE') {
    return res.status(400).json({ error: true, message: 'Mortgage already active' });
  }

  await query(
    'UPDATE properties SET mortgage_status = $1, updated_at = NOW() WHERE property_id = $2',
    ['ACTIVE', propertyId]
  );

  const mortgageId = uuidv4();
  const block = await appendBlock({
    txType: 'MORTGAGE_LOCK',
    propertyId,
    payload: { propertyId, bankUserId: req.user.sub },
    createdByUserId: req.user.sub,
  });

  await query(
    `INSERT INTO mortgages(id, property_id, bank_user_id, status, tx_block_id)
     VALUES ($1, $2, $3, 'ACTIVE', $4)`,
    [mortgageId, propertyId, req.user.sub, block.id]
  );

  await computeRiskScore(propertyId);

  if (process.env.USE_EVM_BLOCKCHAIN === 'true') {
    onChainMortgageLock({ propertyId }).catch((err) =>
      console.error('On-chain mortgage lock failed', err)
    );
  }

  const { rows: updatedPropRows } = await query('SELECT * FROM properties WHERE property_id = $1', [
    propertyId,
  ]);
  res.json({ property: updatedPropRows[0], block });
});

propertyRouter.post('/:propertyId/mortgage/release', requireRole('BANK'), async (req, res) => {
  const { propertyId } = req.params;
  const { rows: propRows } = await query('SELECT * FROM properties WHERE property_id = $1', [
    propertyId,
  ]);
  const prop = propRows[0];
  if (!prop) return res.status(404).json({ error: true, message: 'Property not found' });
  if (prop.mortgage_status !== 'ACTIVE') {
    return res.status(400).json({ error: true, message: 'No active mortgage' });
  }

  await query(
    'UPDATE properties SET mortgage_status = $1, updated_at = NOW() WHERE property_id = $2',
    ['NONE', propertyId]
  );

  const block = await appendBlock({
    txType: 'MORTGAGE_RELEASE',
    propertyId,
    payload: { propertyId, bankUserId: req.user.sub },
    createdByUserId: req.user.sub,
  });

  await query(
    `UPDATE mortgages
       SET status = 'RELEASED', released_at = NOW()
     WHERE property_id = $1 AND status = 'ACTIVE'`,
    [propertyId]
  );

  await computeRiskScore(propertyId);

  if (process.env.USE_EVM_BLOCKCHAIN === 'true') {
    onChainMortgageRelease({ propertyId }).catch((err) =>
      console.error('On-chain mortgage release failed', err)
    );
  }

  const { rows: updatedPropRows } = await query('SELECT * FROM properties WHERE property_id = $1', [
    propertyId,
  ]);
  res.json({ property: updatedPropRows[0], block });
});

// Litigation freeze/unfreeze (COURT)
const litigationFreezeSchema = Joi.object({
  caseReference: Joi.string().required(),
});

propertyRouter.post(
  '/:propertyId/litigation/freeze',
  requireRole('COURT'),
  async (req, res) => {
    const { error, value } = litigationFreezeSchema.validate(req.body);
    if (error) return res.status(400).json({ error: true, message: error.message });

    const { propertyId } = req.params;
    const { caseReference } = value;

    const { rows: propRows } = await query('SELECT * FROM properties WHERE property_id = $1', [
      propertyId,
    ]);
    const prop = propRows[0];
    if (!prop) return res.status(404).json({ error: true, message: 'Property not found' });
    if (prop.litigation_status === 'ACTIVE') {
      return res.status(400).json({ error: true, message: 'Litigation already active' });
    }

    await query(
      'UPDATE properties SET litigation_status = $1, updated_at = NOW() WHERE property_id = $2',
      ['ACTIVE', propertyId]
    );

    const litigationId = uuidv4();
    const block = await appendBlock({
      txType: 'LITIGATION_FREEZE',
      propertyId,
      payload: { propertyId, courtUserId: req.user.sub, caseReference },
      createdByUserId: req.user.sub,
    });

    await query(
      `INSERT INTO litigations(id, property_id, court_user_id, status, case_reference, tx_block_id)
       VALUES ($1, $2, $3, 'ACTIVE', $4, $5)`,
      [litigationId, propertyId, req.user.sub, caseReference, block.id]
    );

    await computeRiskScore(propertyId);

    if (process.env.USE_EVM_BLOCKCHAIN === 'true') {
      onChainLitigationFreeze({ propertyId, caseReference }).catch((err) =>
        console.error('On-chain litigation freeze failed', err)
      );
    }

    const { rows: updatedPropRows } = await query(
      'SELECT * FROM properties WHERE property_id = $1',
      [propertyId]
    );
    res.json({ property: updatedPropRows[0], block });
  }
);

propertyRouter.post(
  '/:propertyId/litigation/unfreeze',
  requireRole('COURT'),
  async (req, res) => {
    const { propertyId } = req.params;
    const { rows: propRows } = await query('SELECT * FROM properties WHERE property_id = $1', [
      propertyId,
    ]);
    const prop = propRows[0];
    if (!prop) return res.status(404).json({ error: true, message: 'Property not found' });
    if (prop.litigation_status !== 'ACTIVE') {
      return res.status(400).json({ error: true, message: 'No active litigation' });
    }

    await query(
      'UPDATE properties SET litigation_status = $1, updated_at = NOW() WHERE property_id = $2',
      ['NONE', propertyId]
    );

    const block = await appendBlock({
      txType: 'LITIGATION_UNFREEZE',
      propertyId,
      payload: { propertyId, courtUserId: req.user.sub },
      createdByUserId: req.user.sub,
    });

    await query(
      `UPDATE litigations
         SET status = 'CLOSED', closed_at = NOW()
       WHERE property_id = $1 AND status = 'ACTIVE'`,
      [propertyId]
    );

    await computeRiskScore(propertyId);

    if (process.env.USE_EVM_BLOCKCHAIN === 'true') {
      onChainLitigationUnfreeze({ propertyId }).catch((err) =>
        console.error('On-chain litigation unfreeze failed', err)
      );
    }

    const { rows: updatedPropRows } = await query(
      'SELECT * FROM properties WHERE property_id = $1',
      [propertyId]
    );
    res.json({ property: updatedPropRows[0], block });
  }
);

// Authenticated views
propertyRouter.get('/my', async (req, res) => {
  const userId = req.user.sub;
  const { rows } = await query('SELECT * FROM properties WHERE owner_user_id = $1', [userId]);
  res.json({ properties: rows });
});

propertyRouter.get('/:propertyId/audit', async (req, res) => {
  const { propertyId } = req.params;

  const { rows: propRows } = await query('SELECT * FROM properties WHERE property_id = $1', [
    propertyId,
  ]);
  const prop = propRows[0];
  if (!prop) return res.status(404).json({ error: true, message: 'Property not found' });

  const blocks = await getBlocksByProperty(propertyId);
  const { rows: transfers } = await query(
    'SELECT * FROM transfers WHERE property_id = $1 ORDER BY created_at ASC',
    [propertyId]
  );
  const { rows: mortgages } = await query(
    'SELECT * FROM mortgages WHERE property_id = $1 ORDER BY created_at ASC',
    [propertyId]
  );
  const { rows: litigations } = await query(
    'SELECT * FROM litigations WHERE property_id = $1 ORDER BY created_at ASC',
    [propertyId]
  );

  res.json({
    property: prop,
    blocks,
    transfers,
    mortgages,
    litigations,
  });
});

module.exports = { propertyRouter };

