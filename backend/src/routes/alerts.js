const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const verifyToken = require('../middleware/auth');

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, product_id, product_name, price, currency, target_price, sent_at
       FROM alerts
       WHERE user_id = $1
       ORDER BY sent_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('[alerts]', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
