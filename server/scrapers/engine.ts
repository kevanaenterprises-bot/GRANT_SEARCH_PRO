import { chromium, type Browser, type BrowserContext } from 'playwright';

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
      ],
    });
  }
  return browser;
}

// Each scrape gets a fresh incognito context — no cookies, no fingerprint carry-over
export async function withIncognitoPage<T>(
  fn: (page: import('playwright').Page) => Promise<T>,
  timeoutMs = 30000
): Promise<T> {
  const b = await getBrowser();
  const ctx: BrowserContext = await b.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
    timezoneId: 'America/Chicago',
    // Mask automation signals
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    },
  });

  // Block images, fonts, and media to speed things up
  await ctx.route('**/*', (route) => {
    const type = route.request().resourceType();
    if (['image', 'font', 'media', 'stylesheet'].includes(type)) {
      route.abort();
    } else {
      route.continue();
    }
  });

  const page = await ctx.newPage();

  // Remove webdriver property that sites use for bot detection
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
  });

  try {
    const result = await Promise.race([
      fn(page),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Scrape timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
    return result;
  } finally {
    await ctx.close().catch(() => {});
  }
}

// Graceful shutdown
export async function closeBrowser() {
  if (browser) {
    await browser.close().catch(() => {});
    browser = null;
  }
}

process.on('exit', () => { browser?.close().catch(() => {}); });
process.on('SIGINT', () => { browser?.close().catch(() => {}); process.exit(0); });
