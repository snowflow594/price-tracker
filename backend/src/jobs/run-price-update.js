require('dotenv').config();
const { updateAllPrices } = require('./priceUpdater');

const MAX_REINTENTOS = 5;
const ESPERA_MS = 10000; // 10s entre reintentos (Railway cold start)

async function ejecutarConReintentos() {
  for (let intento = 1; intento <= MAX_REINTENTOS; intento++) {
    try {
      await updateAllPrices();
      return;
    } catch (err) {
      const esDbArranque = err.code === '57P03' || /starting up/i.test(err.message || '');

      if (esDbArranque && intento < MAX_REINTENTOS) {
        console.log(`[Intento ${intento}/${MAX_REINTENTOS}] DB aún arrancando, reintentando en ${ESPERA_MS / 1000}s...`);
        await new Promise((r) => setTimeout(r, ESPERA_MS));
      } else {
        console.error('Error fatal en actualización de precios:', err);
        process.exit(1);
      }
    }
  }
}

ejecutarConReintentos().then(() => process.exit(0));
