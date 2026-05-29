const express = require('express');
const router = express.Router();
const { searchProducts } = require('../scrapers/amazon');

router.get('/search', async (req, res) => {
  const { q, limit } = req.query;
  if (!q) return res.status(400).json({ error: 'Falta el parámetro q' });

  try {
    const results = await searchProducts(q, limit ? parseInt(limit) : 10);
    res.json(results);
  } catch (err) {
    const blocked = err.message === 'AMAZON_BLOCKED';
    res.status(blocked ? 503 : 500).json({
      error: err.message,
      blocked,
    });
  }
});

module.exports = router;
