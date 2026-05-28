const cron = require('node-cron');
const pool = require('../db/pool');
const { searchProducts: searchML } = require('../scrapers/mercadolibre');
const { getProductPrice: getAmazonPrice } = require('../scrapers/amazon');

async function fetchCurrentPrice(product) {
  if (product.source === 'amazon') {
    return getAmazonPrice(product.url);
  }
  // Para ML: re-busca por nombre y toma el primer resultado
  const results = await searchML(product.name, 1);
  if (!results.length) throw new Error('Sin resultados en búsqueda');
  return results[0];
}

async function updateAllPrices() {
  console.log(`[${new Date().toISOString()}] Iniciando actualización de precios...`);

  const { rows: products } = await pool.query('SELECT id, name, url, source FROM products');

  if (products.length === 0) {
    console.log('No hay productos registrados.');
    return;
  }

  let updated = 0;
  let failed = 0;

  for (const product of products) {
    try {
      const { price, currency } = await fetchCurrentPrice(product);
      if (!price) throw new Error('Precio no encontrado');

      await pool.query(
        'INSERT INTO price_history (product_id, price, currency) VALUES ($1, $2, $3)',
        [product.id, price, currency]
      );

      console.log(`  ✓ [${product.source}] ${product.name.slice(0, 40)} → ${currency} ${price}`);
      updated++;
    } catch (err) {
      console.error(`  ✗ [${product.source}] ${product.name.slice(0, 40)} → ${err.message}`);
      failed++;
    }

    // Pausa entre requests para no saturar los sitios
    await new Promise((r) => setTimeout(r, 3000));
  }

  console.log(`[${new Date().toISOString()}] Completado: ${updated} actualizados, ${failed} fallidos.`);
}

function startPriceUpdaterJob() {
  // Corre cada 6 horas: 0:00, 6:00, 12:00, 18:00
  cron.schedule('0 */6 * * *', updateAllPrices);
  console.log('Cron job de precios iniciado (cada 6 horas).');
}

module.exports = { startPriceUpdaterJob, updateAllPrices };
