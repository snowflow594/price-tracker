require('dotenv').config();
const { updateAllPrices } = require('./priceUpdater');

updateAllPrices()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error fatal en actualización de precios:', err);
    process.exit(1);
  });
