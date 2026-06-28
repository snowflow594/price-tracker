const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./db/pool');
const fs = require('fs');
const path = require('path');
const productsRouter = require('./routes/products');
const amazonRouter = require('./routes/amazon');
const falabellaRouter = require('./routes/falabella');
const authRouter = require('./routes/auth');
const { updateAllPrices } = require('./jobs/priceUpdater');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/amazon', amazonRouter);
app.use('/api/falabella', falabellaRouter);

// Disparo manual del cron (para testing)
app.post('/api/jobs/update-prices', async (req, res) => {
  res.json({ message: 'Actualización iniciada en background.' });
  updateAllPrices().catch(console.error);
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: err.message });
  }
});

async function runMigration() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'db', 'init.sql'), 'utf8');
    await pool.query(sql);
    // Add columns added after initial migration (idempotent)
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS target_price NUMERIC');
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS alert_sent_at TIMESTAMP');
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE');
    console.log('Base de datos lista.');
  } catch (err) {
    console.error('Error en migración:', err.message);
  }
}

const PORT = process.env.PORT || 3001;
runMigration().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
});
