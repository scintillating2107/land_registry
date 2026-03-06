const express = require('express');
const { query } = require('../db');

const notificationsRouter = express.Router();

notificationsRouter.get('/my', async (req, res) => {
  const userId = req.user.sub;
  const { rows } = await query(
    `SELECT *
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [userId]
  );
  res.json({ notifications: rows });
});

notificationsRouter.post('/:id/read', async (req, res) => {
  const userId = req.user.sub;
  const { id } = req.params;
  await query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2', [id, userId]);
  res.json({ ok: true });
});

notificationsRouter.post('/read-all', async (req, res) => {
  const userId = req.user.sub;
  await query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [userId]);
  res.json({ ok: true });
});

module.exports = { notificationsRouter };

