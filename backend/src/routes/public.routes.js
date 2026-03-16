const express = require('express');
const { query } = require('../db');
const { getBlocksByProperty, getAllBlocks, getLatestBlock, verifyChainIntegrity } = require('../blockchain/blockchain');
const { analyzePropertyFraud } = require('../services/fraud.service');

const publicRouter = express.Router();

// Blockchain explorer: list recent blocks (public)
publicRouter.get('/blocks', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
  const offset = parseInt(req.query.offset, 10) || 0;
  const blocks = await getAllBlocks(limit, offset);
  res.json({ blocks });
});

// Explorer: network stats (public)
publicRouter.get('/blockchain/stats', async (req, res) => {
  const latest = await getLatestBlock();
  const { rows: countRows } = await query('SELECT COUNT(*)::int AS cnt FROM blocks');
  const chainValid = await verifyChainIntegrity();
  res.json({
    latestBlockNumber: latest ? latest.height : 0,
    totalTransactions: countRows[0]?.cnt ?? 0,
    activeSmartContracts: 4,
    networkStatus: 'Online',
    chainValid,
  });
});

// Explorer: blocks with creator name for tables (public)
publicRouter.get('/blockchain/blocks', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
  const offset = parseInt(req.query.offset, 10) || 0;
  const txType = typeof req.query.txType === 'string' ? req.query.txType.trim() : null;
  const propertyId = typeof req.query.propertyId === 'string' ? req.query.propertyId.trim() : null;
  const dateFrom = req.query.dateFrom;
  const dateTo = req.query.dateTo;

  let sql = `
    SELECT b.*, u.name AS created_by_name
    FROM blocks b
    LEFT JOIN users u ON u.id = b.created_by_user_id
    WHERE 1=1`;
  const params = [];
  let idx = 1;
  if (txType) { sql += ` AND b.tx_type = $${idx}`; params.push(txType); idx++; }
  if (propertyId) { sql += ` AND b.property_id = $${idx}`; params.push(propertyId); idx++; }
  if (dateFrom) { sql += ` AND b.created_at >= $${idx}::timestamptz`; params.push(dateFrom); idx++; }
  if (dateTo) { sql += ` AND b.created_at <= $${idx}::timestamptz`; params.push(dateTo); idx++; }
  sql += ` ORDER BY b.height DESC LIMIT $${idx} OFFSET $${idx + 1}`;
  params.push(limit, offset);

  const { rows } = await query(sql, params);
  res.json({ blocks: rows });
});

// Explorer: search (public) - by block number, tx hash/id, or property ID
publicRouter.get('/blockchain/search', async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  if (!q) return res.status(400).json({ error: true, message: 'Search query required' });

  const isNumeric = /^\d+$/.test(q);
  const isUuid = /^[0-9a-f-]{36}$/i.test(q);

  if (isNumeric) {
    const { rows } = await query('SELECT b.*, u.name AS created_by_name FROM blocks b LEFT JOIN users u ON u.id = b.created_by_user_id WHERE b.height = $1', [parseInt(q, 10)]);
    return res.json({ blocks: rows, searchType: 'blockNumber' });
  }
  if (isUuid) {
    const { rows } = await query('SELECT b.*, u.name AS created_by_name FROM blocks b LEFT JOIN users u ON u.id = b.created_by_user_id WHERE b.id = $1', [q]);
    return res.json({ blocks: rows, searchType: 'txId' });
  }
  const { rows } = await query(
    'SELECT b.*, u.name AS created_by_name FROM blocks b LEFT JOIN users u ON u.id = b.created_by_user_id WHERE b.property_id = $1 ORDER BY b.height DESC',
    [q]
  );
  return res.json({ blocks: rows, searchType: 'propertyId' });
});

publicRouter.get('/properties/search', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const limitRaw = Number.parseInt(req.query.limit, 10);
  const limit = Number.isNaN(limitRaw) ? 8 : Math.min(Math.max(limitRaw, 1), 12);

  let rows;
  if (q) {
    const { rows: searchRows } = await query(
      `SELECT
         p.*,
         u.name AS owner_name,
         u.role AS owner_role
       FROM properties p
       LEFT JOIN users u ON u.id = p.owner_user_id
       WHERE p.property_id ILIKE $1
          OR COALESCE(u.name, '') ILIKE $1
       ORDER BY p.updated_at DESC
       LIMIT $2`,
      [`%${q}%`, limit]
    );
    rows = searchRows;
  } else {
    const { rows: latestRows } = await query(
      `SELECT
         p.*,
         u.name AS owner_name,
         u.role AS owner_role
       FROM properties p
       LEFT JOIN users u ON u.id = p.owner_user_id
       ORDER BY p.updated_at DESC
       LIMIT $1`,
      [limit]
    );
    rows = latestRows;
  }

  res.json({
    query: q,
    properties: rows.map((row) => ({
      ...row,
      owner: row.owner_name
        ? {
            id: row.owner_user_id,
            name: row.owner_name,
            role: row.owner_role,
          }
        : null,
    })),
  });
});

// Lookup by propertyId
publicRouter.get('/property/:propertyId', async (req, res) => {
  const { propertyId } = req.params;

  const { rows: propRows } = await query(
    `SELECT
       p.*,
       u.name AS owner_name,
       u.role AS owner_role
     FROM properties p
     LEFT JOIN users u ON u.id = p.owner_user_id
     WHERE p.property_id = $1`,
    [propertyId]
  );
  const prop = propRows[0];
  if (!prop) return res.status(404).json({ error: true, message: 'Property not found' });

  const blocks = await getBlocksByProperty(propertyId);
  const fraudAnalysis = await analyzePropertyFraud({
    propertyId,
    expectedOwnerUserId: prop.owner_user_id,
  });

  res.json({
    property: {
      ...prop,
      owner: prop.owner_name
        ? {
            id: prop.owner_user_id,
            name: prop.owner_name,
            role: prop.owner_role,
          }
        : null,
    },
    blocks,
    mortgageStatus: prop.mortgage_status,
    litigationStatus: prop.litigation_status,
    riskScore: prop.risk_score,
    fraudAnalysis,
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

