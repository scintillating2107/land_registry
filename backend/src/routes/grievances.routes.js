const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

const { query } = require('../db');
const { requireRole } = require('../middleware/auth');

const grievancesRouter = express.Router();

function nowIsoCompact() {
  return new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
}

function makeGrievanceNo() {
  return `GRV-${nowIsoCompact()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

const publicCreateSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  subject: Joi.string().min(4).max(160).required(),
  message: Joi.string().min(10).max(4000).required(),
});

// Public submit (mounted under /api/public)
grievancesRouter.post('/', async (req, res) => {
  const { error, value } = publicCreateSchema.validate(req.body);
  if (error) return res.status(400).json({ error: true, message: error.message });

  const id = uuidv4();
  const grievanceNo = makeGrievanceNo();
  await query(
    `INSERT INTO grievances(id, grievance_no, name, email, subject, message, status)
     VALUES ($1,$2,$3,$4,$5,$6,'OPEN')`,
    [id, grievanceNo, value.name.trim(), value.email.trim().toLowerCase(), value.subject.trim(), value.message.trim()]
  );
  res.status(201).json({ grievance: { id, grievanceNo, status: 'OPEN' } });
});

// Protected: list grievances (Registrar)
grievancesRouter.get('/', requireRole('REGISTRAR'), async (req, res) => {
  const { status } = req.query;
  const params = [];
  let sql = 'SELECT * FROM grievances';
  if (status) {
    sql += ' WHERE status = $1';
    params.push(status);
  }
  sql += ' ORDER BY created_at DESC LIMIT 200';
  const { rows } = await query(sql, params);
  res.json({ grievances: rows });
});

const closeSchema = Joi.object({
  resolutionNote: Joi.string().allow('', null).max(2000),
});

grievancesRouter.post('/:id/close', requireRole('REGISTRAR'), async (req, res) => {
  const { error, value } = closeSchema.validate(req.body || {});
  if (error) return res.status(400).json({ error: true, message: error.message });

  const { id } = req.params;
  const { rows } = await query('SELECT * FROM grievances WHERE id = $1', [id]);
  const g = rows[0];
  if (!g) return res.status(404).json({ error: true, message: 'Grievance not found' });
  if (g.status === 'CLOSED') return res.json({ grievance: g });

  await query(
    `UPDATE grievances
       SET status='CLOSED',
           closed_at = NOW(),
           closed_by_user_id = $2,
           resolution_note = $3
     WHERE id = $1`,
    [id, req.user.sub, value.resolutionNote || null]
  );

  const { rows: updated } = await query('SELECT * FROM grievances WHERE id = $1', [id]);
  res.json({ grievance: updated[0] });
});

module.exports = { grievancesRouter };

