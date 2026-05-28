const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { searchProducts, getProductPrice } = require('../scrapers/mercadolibre');

// Buscar productos en Mercado Libre
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Falta el parámetro q' });

  try {
    const results = await searchProducts(q);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Guardar un producto y registrar su precio actual
router.post('/', async (req, res) => {
  const { name, url, source } = req.body;
  if (!name || !url || !source) {
    return res.status(400).json({ error: 'Faltan campos: name, url, source' });
  }

  try {
    const { rows } = await pool.query(
      'INSERT INTO products (name, url, source) VALUES ($1, $2, $3) RETURNING *',
      [name, url, source]
    );
    const product = rows[0];

    const scraped = await getProductPrice(url);
    if (scraped?.price) {
      await pool.query(
        'INSERT INTO price_history (product_id, price, currency) VALUES ($1, $2, $3)',
        [product.id, scraped.price, scraped.currency]
      );
    }

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar todos los productos con su último precio
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, ph.price, ph.currency, ph.scraped_at
      FROM products p
      LEFT JOIN price_history ph ON ph.id = (
        SELECT id FROM price_history
        WHERE product_id = p.id
        ORDER BY scraped_at DESC
        LIMIT 1
      )
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Historial de precios de un producto
router.get('/:id/history', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT price, currency, scraped_at FROM price_history WHERE product_id = $1 ORDER BY scraped_at ASC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
