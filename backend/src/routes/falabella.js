const express = require('express');
const router = express.Router();
const { searchProducts } = require('../scrapers/falabella');
const verifyToken = require('../middleware/auth');

router.use(verifyToken);

router.get('/search', async (req, res) => {
  const { q, limit } = req.query;
  if (!q) return res.status(400).json({ error: 'Falta el parámetro q' });
  const safeLimit = Math.min(limit ? parseInt(limit) : 10, 50);
  try {
    const results = await searchProducts(q, safeLimit);
    res.json(results);
  } catch (err) {
    console.error('[falabella/search]', err.message);
    res.status(500).json({ error: 'Error al buscar en Falabella' });
  }
});

module.exports = router;
