const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

function getChromePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  if (process.platform === 'win32') return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  try {
    const { execSync } = require('child_process');
    const result = execSync(
      'which chromium || which chromium-browser || which google-chrome-stable || which google-chrome',
      { stdio: ['pipe', 'pipe', 'ignore'] }
    ).toString().trim().split('\n')[0];
    return result || undefined;
  } catch { return undefined; }
}

async function launchBrowser() {
  const executablePath = getChromePath();
  return puppeteer.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1280,800',
    ],
  });
}

module.exports = { launchBrowser };
