import { withIncognitoPage } from './engine.js';
import type { ScrapedGrant } from './floridaDEO.js';

// Scrapes open grant listings from foundation and nonprofit grant databases
// Targets sources that are public/free (no login wall)

export async function scrapeUSAGovGrants(keyword: string): Promise<ScrapedGrant[]> {
  return withIncognitoPage(async (page) => {
    const grants: ScrapedGrant[] = [];

    // USA.gov grants page — aggregates state + federal programs
    const url = `https://www.usa.gov/grants${keyword ? `?q=${encodeURIComponent(keyword)}` : ''}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

    const items = await page.evaluate(() => {
      const results: any[] = [];
      document.querySelectorAll('article, .result-item, .grant-item, li').forEach(el => {
        const titleEl = el.querySelector('h2, h3, h4, .title, strong');
        const descEl = el.querySelector('p, .description');
        const linkEl = el.querySelector('a');
        const title = titleEl?.textContent?.trim() || '';
        if (title.length > 10 && title.length < 200) {
          results.push({
            title,
            description: descEl?.textContent?.trim().slice(0, 300) || '',
            link: (linkEl as HTMLAnchorElement)?.href || '',
          });
        }
      });
      return results;
    });

    const seen = new Set<string>();
    for (const item of items.slice(0, 15)) {
      const id = `usa-gov-${item.title.slice(0, 30).replace(/\s+/g, '-').toLowerCase()}`;
      if (seen.has(id) || !item.title) continue;
      seen.add(id);
      grants.push({
        opportunityId: id,
        title: item.title,
        agency: 'USA.gov / Federal',
        description: item.description || item.title,
        awardCeiling: null,
        awardFloor: null,
        closeDate: null,
        link: item.link || 'https://www.usa.gov/grants',
        source: 'USA.gov (Live)',
        category: 'Federal / State Program',
      });
    }

    return grants;
  }, 25000);
}

export async function scrapeSBAGrants(): Promise<ScrapedGrant[]> {
  return withIncognitoPage(async (page) => {
    const grants: ScrapedGrant[] = [];

    await page.goto('https://www.sba.gov/funding-programs/grants', {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });

    const items = await page.evaluate(() => {
      const results: any[] = [];
      document.querySelectorAll('.card, .program-card, article, .usa-card').forEach(card => {
        const titleEl = card.querySelector('h2, h3, h4, .usa-card__heading');
        const descEl = card.querySelector('p, .usa-card__body');
        const linkEl = card.querySelector('a');
        const title = titleEl?.textContent?.trim() || '';
        if (title.length > 5) {
          results.push({
            title,
            description: descEl?.textContent?.trim().slice(0, 300) || '',
            link: (linkEl as HTMLAnchorElement)?.href || '',
          });
        }
      });
      // Also grab definition lists used in SBA pages
      document.querySelectorAll('dt').forEach(dt => {
        const dd = dt.nextElementSibling;
        const link = dt.querySelector('a') || dd?.querySelector('a');
        const title = dt.textContent?.trim() || '';
        if (title.length > 5 && title.length < 150) {
          results.push({
            title,
            description: dd?.textContent?.trim().slice(0, 300) || '',
            link: (link as HTMLAnchorElement)?.href || '',
          });
        }
      });
      return results;
    });

    const seen = new Set<string>();
    for (const item of items.slice(0, 15)) {
      const id = `sba-live-${item.title.slice(0, 30).replace(/\s+/g, '-').toLowerCase()}`;
      if (seen.has(id) || !item.title) continue;
      seen.add(id);
      grants.push({
        opportunityId: id,
        title: item.title,
        agency: 'U.S. Small Business Administration',
        description: item.description || item.title,
        awardCeiling: null,
        awardFloor: null,
        closeDate: null,
        link: item.link || 'https://www.sba.gov/funding-programs/grants',
        source: 'SBA.gov (Live)',
        category: 'SBA Program',
      });
    }

    return grants;
  }, 25000);
}

export async function scrapeGrantWatch(keyword: string, state?: string): Promise<ScrapedGrant[]> {
  // GrantWatch.com has free public listings for small business grants
  return withIncognitoPage(async (page) => {
    const grants: ScrapedGrant[] = [];

    const query = [keyword, state, 'small business'].filter(Boolean).join(' ');
    await page.goto(`https://www.grantwatch.com/cat/43/small-business-grants.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 25000,
    });

    // Wait for grant listings to load
    await page.waitForSelector('.grant-listing, .grant-item, article, .listing', { timeout: 8000 }).catch(() => {});

    const items = await page.evaluate((kw) => {
      const results: any[] = [];
      const cards = document.querySelectorAll('.grant-listing, .grant-item, .grant-card, article.grant');

      cards.forEach(card => {
        const titleEl = card.querySelector('h2, h3, h4, .grant-title, .listing-title');
        const descEl = card.querySelector('p, .description, .grant-description');
        const linkEl = card.querySelector('a');
        const deadlineEl = card.querySelector('.deadline, .close-date, time');
        const amountEl = card.querySelector('.amount, .award, .grant-amount');

        const title = titleEl?.textContent?.trim() || '';
        if (title.length > 10) {
          results.push({
            title,
            description: descEl?.textContent?.trim().slice(0, 300) || '',
            link: (linkEl as HTMLAnchorElement)?.href || '',
            deadline: deadlineEl?.textContent?.trim() || null,
            amount: amountEl?.textContent?.trim() || null,
          });
        }
      });
      return results;
    }, keyword);

    const seen = new Set<string>();
    for (const item of items.slice(0, 10)) {
      const id = `grantwatch-${item.title.slice(0, 30).replace(/\s+/g, '-').toLowerCase()}`;
      if (seen.has(id) || !item.title) continue;
      seen.add(id);

      // Parse amount if present (e.g. "Up to $50,000")
      let awardCeiling: number | null = null;
      if (item.amount) {
        const match = item.amount.match(/\$?([\d,]+)/);
        if (match) awardCeiling = parseInt(match[1].replace(/,/g, ''));
      }

      grants.push({
        opportunityId: id,
        title: item.title,
        agency: 'GrantWatch.com Listing',
        description: item.description || item.title,
        awardCeiling,
        awardFloor: null,
        closeDate: item.deadline || null,
        link: item.link || 'https://www.grantwatch.com',
        source: 'GrantWatch (Live)',
        category: 'Small Business Grant',
      });
    }

    return grants;
  }, 30000);
}
