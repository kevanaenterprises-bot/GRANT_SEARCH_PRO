/* eslint-disable @typescript-eslint/no-explicit-any */
// page.evaluate() callbacks run in browser context — document/window are available there
import { withIncognitoPage } from './engine.js';

export interface ScrapedGrant {
  opportunityId: string;
  title: string;
  agency: string;
  description: string;
  awardCeiling: number | null;
  awardFloor: number | null;
  closeDate: string | null;
  link: string;
  source: string;
  category: string | null;
}

export async function scrapeFloridaGrants(keyword?: string): Promise<ScrapedGrant[]> {
  return withIncognitoPage(async (page) => {
    const grants: ScrapedGrant[] = [];

    // Florida DEO business grants and funding
    await page.goto('https://floridajobs.org/business-growth-and-partnerships/business-finance/grants-and-incentives', {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });

    // Collect all grant/incentive links and descriptions from the page
    const items = await page.evaluate(() => {
      const results: any[] = [];
      // Look for list items or sections that describe programs
      const links = document.querySelectorAll('a[href]');
      links.forEach(link => {
        const text = (link as HTMLAnchorElement).textContent?.trim() || '';
        const href = (link as HTMLAnchorElement).href;
        if (text.length > 15 && text.length < 200 &&
            (href.includes('floridajobs') || href.includes('enterpriseflorida') || href.includes('florida')) &&
            !href.includes('#') && !href.includes('login') && !href.includes('mailto')) {
          // Get surrounding paragraph text as description
          const parent = link.closest('li, p, div.field, div.content');
          const desc = parent?.textContent?.trim().slice(0, 300) || '';
          results.push({ title: text, link: href, description: desc });
        }
      });
      return results;
    });

    // Also scrape Enterprise Florida
    await page.goto('https://www.enterpriseflorida.com/find-funding/', {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    }).catch(() => {});

    const efItems = await page.evaluate(() => {
      const results: any[] = [];
      const cards = document.querySelectorAll('.funding-card, .card, article, .program-item');
      cards.forEach(card => {
        const titleEl = card.querySelector('h2, h3, h4, .title, .card-title');
        const descEl = card.querySelector('p, .description, .card-body');
        const linkEl = card.querySelector('a');
        if (titleEl) {
          results.push({
            title: titleEl.textContent?.trim() || '',
            description: descEl?.textContent?.trim().slice(0, 300) || '',
            link: (linkEl as HTMLAnchorElement)?.href || '',
          });
        }
      });
      return results;
    });

    const allItems = [...items, ...efItems].filter(i => i.title && i.title.length > 5);
    const seen = new Set<string>();

    for (const item of allItems.slice(0, 20)) {
      const id = `fl-scraped-${item.title.slice(0, 30).replace(/\s+/g, '-').toLowerCase()}`;
      if (seen.has(id)) continue;
      seen.add(id);

      const title = item.title.trim();
      if (!title || title.toLowerCase().includes('cookie') || title.toLowerCase().includes('privacy')) continue;

      grants.push({
        opportunityId: id,
        title,
        agency: 'Florida DEO / Enterprise Florida',
        description: item.description || `Florida grant/incentive program: ${title}`,
        awardCeiling: null,
        awardFloor: null,
        closeDate: null,
        link: item.link || 'https://floridajobs.org/business-growth-and-partnerships/business-finance',
        source: 'Florida DEO (Live)',
        category: 'State Grant / Incentive',
      });
    }

    return grants;
  }, 35000);
}
