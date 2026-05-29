const cron = require('node-cron');
const pool = require('../db/pool');
const { searchProducts: searchFalabella } = require('../scrapers/falabella');
const { getProductPrice: getAmazonPrice } = require('../scrapers/amazon');
const { sendPriceAlert } = require('../services/mailer');

async function fetchCurrentPrice(product) {
  if (product.source === 'amazon') {
    return getAmazonPrice(product.url);
  }
  // Falabella y otros: re-busca por nombre y toma el primer resultado
  const results = await searchFalabella(product.name, 1);
  if (!results.length) throw new Error('Sin resultados en búsqueda');
  return results[0];
}

async function checkAndSendAlert(product, newPrice, currency) {
  const target = parseFloat(product.target_price);
  if (!target || newPrice > target) return;

  // Solo enviar si no se envió alerta en las últimas 24 horas
  const sentAt = product.alert_sent_at ? new Date(product.alert_sent_at) : null;
  const hoursSinceLast = sentAt ? (Date.now() - sentAt.getTime()) / 36e5 : Infinity;
  if (hoursSinceLast < 24) return;

  const alertEmail = process.env.ALERT_EMAIL;
  if (!alertEmail) return;

  try {
    await sendPriceAlert({
      to: alertEmail,
      productName: product.name,
      currentPrice: newPrice,
      targetPrice: target,
      currency,
      url: product.url,
      source: product.source,
    });
    await pool.query('UPDATE products SET alert_sent_at = NOW() WHERE id = $1', [product.id]);
    console.log(`  📧 Alerta enviada para "${product.name.slice(0, 40)}"`);
  } catch (err) {
    console.error(`  ✗ Error enviando alerta: ${err.message}`);
  }
}

async function updateAllPrices() {
  console.log(`[${new Date().toISOString()}] Iniciando actualización de precios...`);

  const { rows: products } = await pool.query(
    'SELECT id, name, url, source, target_price, alert_sent_at FROM products'
  );

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

      await checkAndSendAlert(product, price, currency);

      console.log(`  ✓ [${product.source}] ${product.name.slice(0, 40)} → ${currency} ${price}`);
      updated++;
    } catch (err) {
      console.error(`  ✗ [${product.source}] ${product.name.slice(0, 40)} → ${err.message}`);
      failed++;
    }

    await new Promise((r) => setTimeout(r, 3000));
  }

  console.log(`[${new Date().toISOString()}] Completado: ${updated} actualizados, ${failed} fallidos.`);
}

function startPriceUpdaterJob() {
  cron.schedule('0 */6 * * *', updateAllPrices);
  console.log('Cron job de precios iniciado (cada 6 horas).');
}

module.exports = { startPriceUpdaterJob, updateAllPrices };
