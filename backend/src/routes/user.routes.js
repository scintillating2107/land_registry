const express = require('express');
const { query } = require('../db');

const userRouter = express.Router();

userRouter.get('/me', async (req, res) => {
  const userId = req.user.sub;
  const { rows } = await query(
    'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
    [userId]
  );
  const user = rows[0];
  if (!user) {
    return res.status(404).json({ error: true, message: 'User not found' });
  }
  res.json({ user });
});

userRouter.get('/users', async (req, res) => {
  const { role } = req.query;
  const params = [];
  let sql = 'SELECT id, name, email, role FROM users';
  if (role) {
    sql += ' WHERE role = $1';
    params.push(role);
  }
  sql += ' ORDER BY role, name';
  const { rows } = await query(sql, params);
  res.json({ users: rows });
});

module.exports = { userRouter };

