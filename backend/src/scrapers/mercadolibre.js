const puppeteer = require('puppeteer');

async function searchProducts(query, limit = 10) {
  const url = `https://listado.mercadolibre.com.pe/${encodeURIComponent(query)}`;
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    );
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('.poly-card', { timeout: 15000 });

    const results = await page.evaluate((limit) => {
      const cards = Array.from(document.querySelectorAll('.poly-card')).slice(0, limit);
      return cards.map((card) => {
        const titleEl = card.querySelector('.poly-component__title');
        const priceInt = card.querySelector('.andes-money-amount__fraction');
        const priceCents = card.querySelector('.andes-money-amount__cents');
        const linkEl = card.querySelector('a.poly-component__title');

        const priceStr = priceInt
          ? priceInt.textContent.replace(/\D/g, '') + (priceCents ? '.' + priceCents.textContent.trim() : '')
          : null;

        return {
          name: titleEl?.textContent?.trim() || null,
          price: priceStr ? parseFloat(priceStr) : null,
          currency: 'PEN',
          url: linkEl?.href || null,
          source: 'mercadolibre',
        };
      }).filter((item) => item.name && item.price);
    }, limit);

    return results;
  } finally {
    await browser.close();
  }
}

async function getProductPrice(productUrl) {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    );
    await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('.andes-money-amount__fraction', { timeout: 15000 });

    return await page.evaluate(() => {
      const priceInt = document.querySelector('.andes-money-amount__fraction');
      const priceCents = document.querySelector('.andes-money-amount__cents');
      const title = document.querySelector('h1.ui-pdp-title');

      const priceStr = priceInt
        ? priceInt.textContent.replace(/\D/g, '') + (priceCents ? '.' + priceCents.textContent.trim() : '')
        : null;

      return {
        name: title?.textContent?.trim() || null,
        price: priceStr ? parseFloat(priceStr) : null,
        currency: 'PEN',
        url: window.location.href,
      };
    });
  } finally {
    await browser.close();
  }
}

module.exports = { searchProducts, getProductPrice };
