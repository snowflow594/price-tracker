const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function openBrowser() {
  return puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1280,800',
    ],
  });
}

async function warmup(page) {
  await page.setUserAgent(USER_AGENT);
  await page.setViewport({ width: 1280, height: 800 });
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });
  await page.goto('https://www.mercadolibre.com.pe', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000 + Math.random() * 1000));
}

async function searchProducts(query, limit = 10) {
  const browser = await openBrowser();
  try {
    const page = await browser.newPage();
    await warmup(page);

    // ML uses hyphens in search URLs
    const slug = query.trim().replace(/\s+/g, '-');
    await page.goto(`https://listado.mercadolibre.com.pe/${encodeURIComponent(slug)}`, {
      waitUntil: 'networkidle2',
      timeout: 40000,
    });

    // Wait for whichever card selector appears first
    await Promise.race([
      page.waitForSelector('.poly-card', { timeout: 15000 }).catch(() => null),
      page.waitForSelector('.ui-search-results__item', { timeout: 15000 }).catch(() => null),
    ]);

    const results = await page.evaluate((limit) => {
      const PRICE_SELECTORS = ['.andes-money-amount__fraction'];
      const TITLE_SELECTORS = ['.poly-component__title', '.ui-search-item__title'];
      const CARD_SELECTORS = ['.poly-card', '.ui-search-results__item', '.andes-card'];

      let cards = [];
      for (const sel of CARD_SELECTORS) {
        cards = Array.from(document.querySelectorAll(sel));
        if (cards.length > 0) break;
      }

      return cards.slice(0, limit).map((card) => {
        let titleEl = null;
        for (const sel of TITLE_SELECTORS) {
          titleEl = card.querySelector(sel);
          if (titleEl) break;
        }

        const priceInt = card.querySelector('.andes-money-amount__fraction');
        const priceCents = card.querySelector('.andes-money-amount__cents');
        const linkEl = card.querySelector('a.poly-component__title') || card.querySelector('a[href*="mercadolibre"]') || card.querySelector('a');

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
      }).filter(item => item.name && item.price);
    }, limit);

    return results;
  } finally {
    await browser.close();
  }
}

async function getProductPrice(productUrl) {
  const browser = await openBrowser();
  try {
    const page = await browser.newPage();
    await warmup(page);

    await page.goto(productUrl, { waitUntil: 'networkidle2', timeout: 40000 });
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
