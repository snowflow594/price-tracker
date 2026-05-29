const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function getChromePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  if (process.platform === 'win32') return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  try {
    const { execSync } = require('child_process');
    return execSync('which chromium || which chromium-browser || which google-chrome', { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim().split('\n')[0];
  } catch { return undefined; }
}

async function openBrowser() {
  const executablePath = getChromePath();
  return puppeteer.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1280,800'],
  });
}

function parsePricePEN(priceText) {
  // "S/ 6,399" → 6399 | "S/ 1,749.90" → 1749.90
  const first = priceText.split('\n')[0];
  const cleaned = first.replace(/[^0-9,.]/g, '').replace(',', '');
  return parseFloat(cleaned) || null;
}

async function searchProducts(query, limit = 10) {
  const browser = await openBrowser();
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
  const browser = await openBrowser();
  try {
    const page = await browser.newPage();
    await page.setUserAgent(UA);
    await page.setViewport({ width: 1280, height: 800 });

    await page.goto(productUrl, { waitUntil: 'networkidle2', timeout: 40000 });
    await page.waitForSelector('[class*="Price"], .fb-price, [data-testid*="price"], .jsx-price', { timeout: 15000 }).catch(() => null);

    return await page.evaluate((url) => {
      // Try multiple price selectors for the product page
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
        // Fallback: find any element with "S/" that looks like a price
        const all = Array.from(document.querySelectorAll('*')).find(e =>
          e.children.length === 0 && e.innerText && e.innerText.trim().startsWith('S/')
        );
        priceText = all?.innerText || null;
      }
      const title = document.querySelector('h1')?.innerText?.trim() || null;
      return { priceText, name: title, url };
    }, productUrl);
  } finally {
    await browser.close();
  }
}

module.exports = { searchProducts, getProductPrice };
