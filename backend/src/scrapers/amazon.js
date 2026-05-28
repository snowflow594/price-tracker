const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
];

function randomAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function openPage(browser) {
  const page = await browser.newPage();
  await page.setUserAgent(randomAgent());
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'es-PE,es;q=0.9,en-US;q=0.8' });
  // Calentar cookies con la homepage
  await page.goto('https://www.amazon.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1500));
  return page;
}

async function searchProducts(query, limit = 10) {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  try {
    const page = await openPage(browser);
    await page.goto(`https://www.amazon.com/s?k=${encodeURIComponent(query)}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    const isCaptcha = await page.$('form[action="/errors/validateCaptcha"]');
    if (isCaptcha) throw new Error('Amazon bloqueó la solicitud con CAPTCHA');

    await page.waitForSelector('[data-component-type="s-search-result"]', { timeout: 15000 });

    const results = await page.evaluate((limit) => {
      const cards = Array.from(
        document.querySelectorAll('[data-component-type="s-search-result"]')
      ).slice(0, limit);

      return cards.map((card) => {
        const titleEl = card.querySelector('.a-size-medium.a-color-base.a-text-normal')
          || card.querySelector('h2');
        const asin = card.getAttribute('data-asin');
        const priceWhole = card.querySelector('.a-price-whole');
        const priceFraction = card.querySelector('.a-price-fraction');

        const priceStr = priceWhole
          ? priceWhole.textContent.replace(/[^0-9]/g, '') + '.' + (priceFraction?.textContent?.trim() || '00')
          : null;

        return {
          name: titleEl?.textContent?.trim() || null,
          price: priceStr ? parseFloat(priceStr) : null,
          currency: 'USD',
          url: asin ? `https://www.amazon.com/dp/${asin}` : null,
          source: 'amazon',
        };
      }).filter((item) => item.name && item.price && item.url);
    }, limit);

    return results;
  } finally {
    await browser.close();
  }
}

async function getProductPrice(productUrl) {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  try {
    const page = await openPage(browser);
    await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const isCaptcha = await page.$('form[action="/errors/validateCaptcha"]');
    if (isCaptcha) throw new Error('Amazon bloqueó la solicitud con CAPTCHA');

    await page.waitForSelector('.a-price-whole', { timeout: 15000 });

    return await page.evaluate(() => {
      const priceWhole = document.querySelector('.a-price-whole');
      const priceFraction = document.querySelector('.a-price-fraction');
      const title = document.querySelector('#productTitle');

      const priceStr = priceWhole
        ? priceWhole.textContent.replace(/[^0-9]/g, '') + '.' + (priceFraction?.textContent?.trim() || '00')
        : null;

      return {
        name: title?.textContent?.trim() || null,
        price: priceStr ? parseFloat(priceStr) : null,
        currency: 'USD',
        url: window.location.href,
      };
    });
  } finally {
    await browser.close();
  }
}

module.exports = { searchProducts, getProductPrice };
