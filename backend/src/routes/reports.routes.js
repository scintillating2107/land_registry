const express = require('express');
const { query } = require('../db');
const { requireRole } = require('../middleware/auth');

const reportsRouter = express.Router();

reportsRouter.get('/kpis', requireRole('REGISTRAR'), async (_req, res) => {
  const [{ rows: users }, { rows: props }, { rows: apps }, { rows: grv }] = await Promise.all([
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
  ]);

  res.json({
    users: users[0]?.cnt ?? 0,
    properties: props[0]?.cnt ?? 0,
    applicationsByStatus: apps,
    grievancesByStatus: grv,
  });
});

module.exports = { reportsRouter };

