import { Router } from 'express';
import { db } from '../db.js';
import { businessProfiles } from '../schema.js';
import { eq } from 'drizzle-orm';
import { scrapeFloridaGrants } from '../scrapers/floridaDEO.js';
import { scrapeTexasGrants } from '../scrapers/texasGrants.js';
import { scrapeUSAGovGrants, scrapeSBAGrants, scrapeGrantWatch } from '../scrapers/foundations.js';

export const scrapeRouter = Router();

// Track in-progress scrapes so the client can poll status
const activeJobs = new Map<string, { status: string; progress: string[]; results: any[]; error?: string }>();

function jobId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Start a deep search job — returns jobId immediately, runs in background
scrapeRouter.post('/deep-search', async (req, res) => {
  const { profileId, keyword } = req.body;

  const [profile] = profileId
    ? await db.select().from(businessProfiles).where(eq(businessProfiles.id, profileId))
    : [null];

  const state = profile?.state;
  const searchKeyword = keyword || 'small business grant';
  const id = jobId();

  const job = { status: 'running', progress: [] as string[], results: [] as any[] };
  activeJobs.set(id, job);

  // Run scrapers asynchronously
  (async () => {
    const scrapers: Array<{ name: string; fn: () => Promise<any[]> }> = [
      { name: 'SBA.gov', fn: () => scrapeSBAGrants() },
      { name: 'USA.gov', fn: () => scrapeUSAGovGrants(searchKeyword) },
      { name: 'GrantWatch', fn: () => scrapeGrantWatch(searchKeyword, state) },
    ];

    // Add state-specific scrapers
    if (state === 'FL') scrapers.push({ name: 'Florida DEO', fn: () => scrapeFloridaGrants(searchKeyword) });
    if (state === 'TX') scrapers.push({ name: 'Texas Grants', fn: () => scrapeTexasGrants(searchKeyword) });

    const seen = new Set<string>();

    for (const scraper of scrapers) {
      if (job.status === 'cancelled') break;
      job.progress.push(`🔍 Scraping ${scraper.name}...`);
      try {
        const results = await scraper.fn();
        const fresh = results.filter(r => !seen.has(r.opportunityId));
        fresh.forEach(r => seen.add(r.opportunityId));
        job.results.push(...fresh);
        job.progress.push(`✅ ${scraper.name}: found ${fresh.length} grants`);
      } catch (err: any) {
        const msg = err.message?.slice(0, 120) || 'Unknown error';
        job.progress.push(`⚠️ ${scraper.name}: ${msg}`);
        console.error(`Scraper error [${scraper.name}]:`, err.message);
      }
    }

    job.status = 'done';
    job.progress.push(`🎉 Deep search complete — ${job.results.length} total grants found`);

    // Clean up after 10 minutes
    setTimeout(() => activeJobs.delete(id), 10 * 60 * 1000);
  })();

  res.json({ jobId: id });
});

// Poll job status + results
scrapeRouter.get('/job/:id', (req, res) => {
  const job = activeJobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found or expired' });
  res.json(job);
});

// Cancel a running job
scrapeRouter.delete('/job/:id', (req, res) => {
  const job = activeJobs.get(req.params.id);
  if (job) job.status = 'cancelled';
  res.json({ ok: true });
});

// SAM.gov contract opportunities search (set-asides for small business)
scrapeRouter.post('/sam-contracts', async (req, res) => {
  const API_KEY = process.env.SAM_GOV_API_KEY;
  if (!API_KEY) return res.status(503).json({ error: 'SAM_GOV_API_KEY not configured' });

  const { profileId, keyword, limit = 25 } = req.body;

  let naicsCodes: string[] = [];
  let state: string | undefined;

  if (profileId) {
    const [profile] = await db.select().from(businessProfiles).where(eq(businessProfiles.id, profileId));
    if (profile) {
      naicsCodes = JSON.parse(profile.naicsCodes || '[]');
      state = profile.state;
    }
  }

  try {
    const params = new URLSearchParams({
      api_key: API_KEY,
      limit: String(limit),
      offset: '0',
      typeOfSetAside: 'SBA',  // Small Business set-asides
    });

    if (keyword) params.set('keyword', keyword);
    if (naicsCodes.length) params.set('naicsCode', naicsCodes.join(','));
    if (state) params.set('placeOfPerformanceState', state);

    // Also get a second page with all set-aside types combined
    const [sbaRes, allRes] = await Promise.allSettled([
      fetch(`https://api.sam.gov/opportunities/v2/search?${params}`, {
        headers: { Accept: 'application/json', 'X-Api-Key': API_KEY },
      }),
      fetch(`https://api.sam.gov/opportunities/v2/search?${new URLSearchParams({
        api_key: API_KEY, limit: String(limit), offset: '0',
        ...(keyword ? { keyword } : {}),
        ...(naicsCodes.length ? { naicsCode: naicsCodes.join(',') } : {}),
        ...(state ? { placeOfPerformanceState: state } : {}),
      })}`, {
        headers: { Accept: 'application/json', 'X-Api-Key': API_KEY },
      }),
    ]);

    const seen = new Set<string>();
    const opps: any[] = [];

    for (const result of [sbaRes, allRes]) {
      if (result.status !== 'fulfilled' || !result.value.ok) continue;
      const data = await result.value.json() as any;
      for (const o of data.opportunitiesData || []) {
        if (seen.has(o.noticeId)) continue;
        seen.add(o.noticeId);
        opps.push({
          opportunityId: `sam-opp-${o.noticeId}`,
          noticeId: o.noticeId,
          title: o.title,
          agency: o.fullParentPathName || o.organizationHierarchy?.[0]?.name || 'Federal Agency',
          description: o.description?.slice(0, 500) || '',
          naicsCode: o.naicsCode,
          type: o.type,
          setAside: o.typeOfSetAsideDescription || o.typeOfSetAside,
          postedDate: o.postedDate,
          closeDate: o.responseDeadLine,
          awardCeiling: o.award?.amount ? parseFloat(o.award.amount) : null,
          awardFloor: null,
          link: o.uiLink || `https://sam.gov/opp/${o.noticeId}`,
          source: 'SAM.gov Contracts',
          category: o.type,
        });
      }
    }

    // Sort: set-asides first, then by close date
    opps.sort((a, b) => {
      if (a.setAside && !b.setAside) return -1;
      if (!a.setAside && b.setAside) return 1;
      if (a.closeDate && b.closeDate) return new Date(a.closeDate).getTime() - new Date(b.closeDate).getTime();
      return 0;
    });

    res.json({ opportunities: opps, total: opps.length });
  } catch (err: any) {
    console.error('SAM contracts error:', err);
    res.status(500).json({ error: err.message });
  }
});
