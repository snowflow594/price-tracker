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
  const { name, url, source, initial_price, currency } = req.body;
  if (!name || !url || !source) {
    return res.status(400).json({ error: 'Faltan campos: name, url, source' });
  }

  try {
    const { rows } = await pool.query(
      'INSERT INTO products (name, url, source) VALUES ($1, $2, $3) RETURNING *',
      [name, url, source]
    );
    const product = rows[0];

    if (initial_price && currency) {
      await pool.query(
        'INSERT INTO price_history (product_id, price, currency) VALUES ($1, $2, $3)',
        [product.id, initial_price, currency]
      );
    } else {
      try {
        const scraped = await getProductPrice(url);
        if (scraped?.price) {
          await pool.query(
            'INSERT INTO price_history (product_id, price, currency) VALUES ($1, $2, $3)',
            [product.id, scraped.price, scraped.currency]
          );
        }
      } catch (scrapeErr) {
        console.warn(`Precio inicial no obtenido para "${name}": ${scrapeErr.message}`);
      }
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
      SELECT p.id, p.name, p.url, p.source, p.created_at, p.target_price,
             ph.price, ph.currency, ph.scraped_at
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

// Guardar precio objetivo
router.patch('/:id/target', async (req, res) => {
  const { target_price } = req.body;
  if (target_price == null) return res.status(400).json({ error: 'Falta target_price' });
  try {
    const { rows } = await pool.query(
      'UPDATE products SET target_price = $1, alert_sent_at = NULL WHERE id = $2 RETURNING id, target_price',
      [target_price, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar un producto y su historial
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM price_history WHERE product_id = $1', [req.params.id]);
    await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.status(204).end();
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
