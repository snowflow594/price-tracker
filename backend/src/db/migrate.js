const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
  try {
    await pool.query(sql);
    console.log('Tablas creadas correctamente.');
  } catch (err) {
    console.error('Error al crear tablas:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
