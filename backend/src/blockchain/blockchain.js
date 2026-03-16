const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db');

function computeHash(prevHash, txType, propertyId, payload) {
  const data = JSON.stringify({
    prevHash: prevHash || '',
    txType,
    propertyId: propertyId || '',
    payload,
  });
  return crypto.createHash('sha256').update(data).digest('hex');
}

async function getLatestBlock() {
  const { rows } = await query('SELECT * FROM blocks ORDER BY height DESC LIMIT 1');
  return rows[0] || null;
}

async function appendBlock({ txType, propertyId, payload, createdByUserId }) {
  const latest = await getLatestBlock();
  const prevHash = latest ? latest.hash : null;
  const hash = computeHash(prevHash, txType, propertyId, payload);
  const id = uuidv4();

  const insertSql = `
    INSERT INTO blocks(id, prev_hash, hash, tx_type, property_id, payload, created_by_user_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`;

  const { rows } = await query(insertSql, [
    id,
    prevHash,
    hash,
    txType,
    propertyId || null,
    payload,
    createdByUserId || null,
  ]);

  return rows[0];
}

async function getBlocksByProperty(propertyId) {
  const { rows } = await query(
    'SELECT * FROM blocks WHERE property_id = $1 ORDER BY height ASC',
    [propertyId]
  );
  return rows;
}

async function getAllBlocks(limit = 50, offset = 0) {
  const { rows } = await query(
    'SELECT * FROM blocks ORDER BY height DESC LIMIT $1 OFFSET $2',
    [Math.min(limit, 100), offset]
  );
  return rows;
}

async function verifyChainIntegrity() {
  const { rows } = await query('SELECT * FROM blocks ORDER BY height ASC');
  let prevHash = null;
  for (const b of rows) {
    const expectedHash = computeHash(prevHash, b.tx_type, b.property_id, b.payload);
    if (expectedHash !== b.hash || b.prev_hash !== prevHash) {
      return false;
    }
    prevHash = b.hash;
  }
  return true;
}

module.exports = {
  appendBlock,
  getBlocksByProperty,
  getAllBlocks,
  getLatestBlock,
  verifyChainIntegrity,
};

