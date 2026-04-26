/* eslint-disable @typescript-eslint/no-explicit-any */
// page.evaluate() callbacks run in browser context — document/window are available there
import { withIncognitoPage } from './engine.js';
import type { ScrapedGrant } from './floridaDEO.js';

export async function scrapeTexasGrants(keyword?: string): Promise<ScrapedGrant[]> {
  return withIncognitoPage(async (page) => {
    const grants: ScrapedGrant[] = [];

    // Texas Governor's Office economic development programs
    await page.goto('https://gov.texas.gov/business/page/incentives', {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });

    const govItems = await page.evaluate(() => {
      const results: any[] = [];
      const sections = document.querySelectorAll('section, .program, article, .content-block');
      sections.forEach(section => {
        const titleEl = section.querySelector('h2, h3, h4');
        const descEl = section.querySelector('p');
        const linkEl = section.querySelector('a');
        if (titleEl?.textContent?.trim()) {
          results.push({
            title: titleEl.textContent.trim(),
            description: descEl?.textContent?.trim().slice(0, 300) || '',
            link: (linkEl as HTMLAnchorElement)?.href || '',
          });
        }
      });
      // Also grab all header+link pairs
      document.querySelectorAll('h2 a, h3 a, h4 a').forEach(a => {
        results.push({
          title: a.textContent?.trim() || '',
          link: (a as HTMLAnchorElement).href,
          description: a.closest('section, div')?.querySelector('p')?.textContent?.trim().slice(0, 300) || '',
        });
      });
      return results;
    });

    // Texas Department of Agriculture rural grants
    await page.goto('https://www.texasagriculture.gov/grants/', {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    }).catch(() => {});

    const agItems = await page.evaluate(() => {
      const results: any[] = [];
      document.querySelectorAll('.grant-item, article, .program-card, li a').forEach(el => {
        const title = el.textContent?.trim() || '';
        const link = el.tagName === 'A' ? (el as HTMLAnchorElement).href : (el.querySelector('a') as HTMLAnchorElement)?.href;
        if (title.length > 10 && title.length < 150 && link) {
          results.push({ title, link, description: '' });
        }
      });
      return results;
    });

    const allItems = [...govItems, ...agItems].filter(i => i.title && i.title.length > 5);
    const seen = new Set<string>();

    for (const item of allItems.slice(0, 20)) {
      const id = `tx-scraped-${item.title.slice(0, 30).replace(/\s+/g, '-').toLowerCase()}`;
      if (seen.has(id)) continue;
      seen.add(id);

      const title = item.title.trim();
      if (!title || title.toLowerCase().includes('sign in') || title.toLowerCase().includes('contact us')) continue;

      grants.push({
        opportunityId: id,
        title,
        agency: 'Texas Governor\'s Office / Texas Dept of Agriculture',
        description: item.description || `Texas business incentive/grant program: ${title}`,
        awardCeiling: null,
        awardFloor: null,
        closeDate: null,
        link: item.link || 'https://gov.texas.gov/business',
        source: 'Texas Grants Portal (Live)',
        category: 'State Incentive / Grant',
      });
    }

    return grants;
  }, 35000);
}
