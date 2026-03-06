const express = require('express');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const { query } = require('../db');
const { generateToken } = require('../middleware/auth');

const authRouter = express.Router();

const emailSchema = Joi.string()
  .trim()
  .lowercase()
  // Allow non-IANA / reserved TLDs (e.g. ".test") for demos.
  .email({ tlds: { allow: false } });

const loginSchema = Joi.object({
  email: emailSchema.required(),
  password: Joi.string().min(4).required(),
});

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: emailSchema.required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('CITIZEN', 'REGISTRAR', 'BANK', 'COURT').default('CITIZEN'),
});

authRouter.post('/register', async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: true, message: error.message });
  }

  const { name, email, password, role } = value;
  const { rows: existing } = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.length > 0) {
    return res.status(409).json({ error: true, message: 'Email already registered' });
  }

  const id = uuidv4();
  const passwordHash = await bcrypt.hash(password, 10);
  await query(
    'INSERT INTO users(id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
    [id, name, email, passwordHash, role]
  );

  const { rows: userRows } = await query('SELECT * FROM users WHERE id = $1', [id]);
  const user = userRows[0];
  const token = generateToken(user);
  res.status(201).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

authRouter.post('/login', async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: true, message: error.message });
  }

  const { email, password } = value;
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];
  if (!user) {
    return res.status(401).json({ error: true, message: 'Invalid credentials' });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: true, message: 'Invalid credentials' });
  }

  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// Simple endpoint to create demo users if they don't exist (hackathon helper)
authRouter.post('/seed-demo-users', async (_req, res) => {
  const demoUsers = [
    { name: 'Alice Citizen', email: 'alice@citizen.test', role: 'CITIZEN' },
    { name: 'Charlie Citizen', email: 'charlie@citizen.test', role: 'CITIZEN' },
    { name: 'Bob Registrar', email: 'bob@registrar.test', role: 'REGISTRAR' },
    { name: 'BankOne', email: 'bank@bank.test', role: 'BANK' },
    { name: 'CourtOne', email: 'court@court.test', role: 'COURT' },
  ];

  const created = [];
  for (const u of demoUsers) {
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [u.email]);
    if (rows.length === 0) {
      const id = uuidv4();
      const password = 'password'; // demo password
      const passwordHash = await bcrypt.hash(password, 10);
      await query(
        'INSERT INTO users(id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
        [id, u.name, u.email, passwordHash, u.role]
      );
      created.push({ ...u, id, password });
    } else if (rows[0].role !== u.role) {
      // Fix pre-existing demo accounts that have the wrong role.
      await query('UPDATE users SET role = $1 WHERE email = $2', [u.role, u.email]);
    }
  }

  res.json({ created });
});

module.exports = { authRouter };

