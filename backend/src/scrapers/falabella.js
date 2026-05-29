const { launchBrowser } = require('./browserHelper');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function parsePricePEN(priceText) {
  if (!priceText) return null;
  const lines = priceText.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    // Skip lines that are labels without numbers (e.g. "CMR", "Internet", "Antes:")
    const digits = line.replace(/[^0-9]/g, '');
    if (digits.length < 2) continue;
    // Remove thousands commas, keep decimal dot
    const cleaned = line.replace(/[^0-9.]/g, '');
    const val = parseFloat(cleaned);
    if (val > 1) return val;
  }
  return null;
}

async function searchProducts(query, limit = 10) {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setUserAgent(UA);
    await page.setViewport({ width: 1280, height: 800 });

    const url = `https://www.falabella.com.pe/falabella-pe/search?Ntt=${encodeURIComponent(query)}`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 40000 });
    await new Promise(r => setTimeout(r, 2000));

    await page.waitForSelector('a.pod-link, .grid-pod', { timeout: 15000 });

    const results = await page.evaluate((limit) => {
      const cards = Array.from(document.querySelectorAll('a.pod-link')).slice(0, limit);
      return cards.map(card => {
        const brand = card.querySelector('.pod-title')?.innerText?.trim() || '';
        const subtitle = card.querySelector('.pod-subTitle')?.innerText?.trim() || '';
        const name = [brand, subtitle].filter(Boolean).join(' ');
        const priceText = card.querySelector('.pod-prices')?.innerText || '';
        const url = card.href.split('?')[0];
        return { name, priceText, url };
      }).filter(r => r.name && r.url);
    }, limit);

    return results.map(r => ({
      name: r.name,
      price: parsePricePEN(r.priceText),
      currency: 'PEN',
      url: r.url,
      source: 'falabella',
    })).filter(r => r.price);
  } finally {
    await browser.close();
  }
}

async function getProductPrice(productUrl) {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setUserAgent(UA);
    await page.setViewport({ width: 1280, height: 800 });

    await page.goto(productUrl, { waitUntil: 'networkidle2', timeout: 40000 });
    await page.waitForSelector('[class*="Price"], .fb-price, [data-testid*="price"], .jsx-price', { timeout: 15000 }).catch(() => null);

    const raw = await page.evaluate((url) => {
      const selectors = [
        '[data-testid="price-offering"]',
        '.fb-money-price',
        '[class*="jsx-price"]',
        '[class*="Price_selling"]',
        '[class*="Price__price"]',
      ];
      let priceText = null;
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) { priceText = el.innerText; break; }
      }
      if (!priceText) {
        const all = Array.from(document.querySelectorAll('*')).find(e =>
          e.children.length === 0 && e.innerText && e.innerText.trim().startsWith('S/')
        );
        priceText = all?.innerText || null;
      }
      const title = document.querySelector('h1')?.innerText?.trim() || null;
      return { priceText, name: title, url };
    }, productUrl);
    const price = parsePricePEN(raw.priceText || '');
    return { price, currency: 'PEN', name: raw.name, url: raw.url };
  } finally {
    await browser.close();
  }
}

module.exports = { searchProducts, getProductPrice };
