const express = require('express');
const { query } = require('../db');

const certificatesRouter = express.Router();

certificatesRouter.get('/my', async (req, res) => {
  const userId = req.user.sub;
  const { rows } = await query(
    `SELECT *
     FROM certificates
     WHERE issued_to_user_id = $1
     ORDER BY issued_at DESC
     LIMIT 100`,
    [userId]
  );
  res.json({ certificates: rows });
});

certificatesRouter.get('/:id', async (req, res) => {
  const userId = req.user.sub;
  const { id } = req.params;
  const { rows } = await query('SELECT * FROM certificates WHERE id = $1', [id]);
  const cert = rows[0];
  if (!cert) return res.status(404).json({ error: true, message: 'Certificate not found' });

  // Only issued-to user or registrar can view.
  if (cert.issued_to_user_id !== userId && req.user.role !== 'REGISTRAR') {
    return res.status(403).json({ error: true, message: 'Forbidden' });
  }

  res.json({ certificate: cert });
});

module.exports = { certificatesRouter };

