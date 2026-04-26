import { Router } from 'express';
import { db } from '../db.js';
import { savedGrants, businessProfiles } from '../schema.js';
import { and, eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import type { AuthRequest } from '../auth.js';
import { searchSBIR, getSBAEvergreenPrograms } from '../sources/sba.js';
import { getStatePrograms } from '../sources/statePortals.js';

export const grantsRouter = Router();

const GRANTS_GOV_API = 'https://apply07.grants.gov/grantsws/rest/opportunities/search/';

// NAICS code → relevant grant keywords
const NAICS_KEYWORDS: Record<string, string[]> = {
  '484': ['trucking', 'freight transportation', 'logistics'],
  '484110': ['local trucking', 'freight trucking'],
  '484121': ['long distance trucking', 'freight transportation'],
  '484122': ['long distance trucking', 'freight'],
  '488510': ['freight transportation arrangement', 'logistics broker'],
  '541511': ['software development', 'computer programming', 'technology'],
  '541512': ['computer systems', 'IT services', 'technology'],
  '541990': ['professional services', 'consulting'],
  '522390': ['financial services'],
};

const OWNERSHIP_KEYWORDS: Record<string, string[]> = {
  'minority': ['minority owned', 'minority business', 'MBE', 'disadvantaged business'],
  'woman': ['women owned', 'WOSB', 'woman owned small business'],
  'veteran': ['veteran owned', 'VOSB', 'veteran business'],
  'service-disabled-veteran': ['service disabled veteran', 'SDVOSB'],
  'hub-zone': ['HUBZone', 'historically underutilized'],
  '8a': ['8(a)', 'disadvantaged business', 'socially disadvantaged'],
};

function buildKeywordsFromProfile(profile: any): string[] {
  const naics: string[] = JSON.parse(profile.naicsCodes || '[]');
  const keywords = new Set<string>();

  // Add NAICS-based keywords
  for (const code of naics) {
    const prefix2 = code.slice(0, 2);
    const prefix3 = code.slice(0, 3);
    for (const [key, words] of Object.entries(NAICS_KEYWORDS)) {
      if (code === key || prefix3 === key || prefix2 === key) {
        words.forEach(w => keywords.add(w));
      }
    }
  }

  // Add state keyword
  if (profile.state) keywords.add(profile.state);

  // Add ownership-based keywords
  if (profile.ownershipType && OWNERSHIP_KEYWORDS[profile.ownershipType]) {
    OWNERSHIP_KEYWORDS[profile.ownershipType].forEach(w => keywords.add(w));
  }

  // Always include small business
  keywords.add('small business');

  return [...keywords].slice(0, 5); // Grants.gov works best with focused terms
}

const SearchSchema = z.object({
  keyword: z.string().optional(),
  naicsCodes: z.array(z.string()).optional(),
  state: z.string().optional(),
  agency: z.string().optional(),
  rows: z.number().default(25),
  startRecordNum: z.number().default(0),
  oppStatuses: z.string().default('posted'),
});

function normalizeGrant(opp: any) {
  return {
    opportunityId: opp.id?.toString() || opp.oppNum,
    title: opp.title,
    agency: opp.agencyName || opp.agencyCode,
    description: opp.synopsis || opp.synopsisDesc,
    awardCeiling: opp.awardCeiling ? parseInt(opp.awardCeiling) : null,
    awardFloor: opp.awardFloor ? parseInt(opp.awardFloor) : null,
    closeDate: opp.closeDate,
    postDate: opp.openDate,
    category: opp.oppCategory?.category,
    cfda: opp.cfdaList?.[0]?.programNumber,
    link: `https://grants.gov/search-results-detail/${opp.id}`,
    rawData: JSON.stringify(opp),
  };
}

async function searchGrantsGov(keyword: string, rows = 25, startRecordNum = 0, oppStatuses = 'posted') {
  const response = await fetch(GRANTS_GOV_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ rows, startRecordNum, oppStatuses, keyword }),
  });
  if (!response.ok) throw new Error(`Grants.gov API error: ${response.status}`);
  const data = await response.json() as any;
  return { grants: (data.oppHits || []).map(normalizeGrant), total: data.hitCount || 0 };
}

// Manual keyword search
grantsRouter.post('/search', async (req, res) => {
  try {
    const params = SearchSchema.parse(req.body);
    const result = await searchGrantsGov(
      params.keyword || 'small business',
      params.rows,
      params.startRecordNum,
      params.oppStatuses
    );
    res.json(result);
  } catch (err: any) {
    console.error('Grants.gov search error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Smart search: auto-build keywords from a business profile + run multiple queries
grantsRouter.post('/smart-search', async (req: AuthRequest, res) => {
  try {
    const { profileId, oppStatuses = 'posted' } = req.body;
    if (!profileId) return res.status(400).json({ error: 'profileId required' });

    const [profile] = await db.select().from(businessProfiles).where(and(
      eq(businessProfiles.id, profileId),
      eq(businessProfiles.userId, req.userId!)
    ));
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const keywords = buildKeywordsFromProfile(profile);
    console.log(`🔍 Smart search for "${profile.name}" using keywords:`, keywords);

    // Run up to 3 keyword searches in parallel, deduplicate by opportunityId
    const searches = keywords.slice(0, 3).map(kw => searchGrantsGov(kw, 15, 0, oppStatuses));
    const results = await Promise.allSettled(searches);

    const seen = new Set<string>();
    const grants: any[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') {
        for (const g of r.value.grants) {
          if (!seen.has(g.opportunityId)) {
            seen.add(g.opportunityId);
            grants.push(g);
          }
        }
      }
    }

    res.json({ grants, total: grants.length, keywords });
  } catch (err: any) {
    console.error('Smart search error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all saved grants
grantsRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const grants = await db.select().from(savedGrants)
      .where(eq(savedGrants.userId, req.userId!))
      .orderBy(desc(savedGrants.updatedAt));
    res.json(grants);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save a grant
grantsRouter.post('/save', async (req: AuthRequest, res) => {
  try {
    const grant = req.body;
    const now = Date.now();
    const [saved] = await db.insert(savedGrants).values({
      userId: req.userId!,
      opportunityId: grant.opportunityId,
      title: grant.title,
      agency: grant.agency,
      description: grant.description,
      awardCeiling: grant.awardCeiling,
      awardFloor: grant.awardFloor,
      closeDate: grant.closeDate,
      postDate: grant.postDate,
      category: grant.category,
      cfda: grant.cfda,
      link: grant.link,
      rawData: grant.rawData,
      matchScore: grant.matchScore,
      matchReasoning: grant.matchReasoning,
      profileId: grant.profileId,
      createdAt: now,
      updatedAt: now,
    }).onConflictDoUpdate({
      target: savedGrants.opportunityId,
      set: { matchScore: grant.matchScore, matchReasoning: grant.matchReasoning, updatedAt: now },
    }).returning();
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update grant status or notes
grantsRouter.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const { status, notes } = req.body;
    const [updated] = await db.update(savedGrants)
      .set({ status, notes, updatedAt: Date.now() })
      .where(and(eq(savedGrants.id, parseInt(req.params.id)), eq(savedGrants.userId, req.userId!)))
      .returning();
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a saved grant
grantsRouter.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await db.delete(savedGrants).where(and(
      eq(savedGrants.id, parseInt(req.params.id)),
      eq(savedGrants.userId, req.userId!)
    ));
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Multi-source discovery: Grants.gov + SBA + State portals combined
grantsRouter.post('/discover', async (req: AuthRequest, res) => {
  try {
    const { profileId, oppStatuses = 'posted' } = req.body;
    if (!profileId) return res.status(400).json({ error: 'profileId required' });

    const [profile] = await db.select().from(businessProfiles).where(and(
      eq(businessProfiles.id, profileId),
      eq(businessProfiles.userId, req.userId!)
    ));
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const naics: string[] = JSON.parse(profile.naicsCodes || '[]');
    const keywords = buildKeywordsFromProfile(profile);

    // Run all sources in parallel
    const [grantsGovResults, sbirResults] = await Promise.allSettled([
      // Grants.gov: top 2 keywords
      Promise.all(keywords.slice(0, 2).map(kw => searchGrantsGov(kw, 12, 0, oppStatuses))),
      // SBIR (for software NAICS)
      naics.some(c => c.startsWith('541')) ? searchSBIR(keywords[0] || 'technology') : Promise.resolve([]),
    ]);

    // Merge and deduplicate
    const seen = new Set<string>();
    const grants: any[] = [];

    if (grantsGovResults.status === 'fulfilled') {
      for (const r of grantsGovResults.value) {
        for (const g of r.grants) {
          if (!seen.has(g.opportunityId)) { seen.add(g.opportunityId); grants.push({ ...g, source: 'Grants.gov' }); }
        }
      }
    }

    if (sbirResults.status === 'fulfilled' && Array.isArray(sbirResults.value)) {
      for (const g of sbirResults.value as any[]) {
        if (!seen.has(g.opportunityId)) { seen.add(g.opportunityId); grants.push(g); }
      }
    }

    // Add state programs (always relevant, no API call needed)
    const stateGrants = getStatePrograms(profile.state, naics);
    for (const g of stateGrants) {
      if (!seen.has(g.opportunityId)) { seen.add(g.opportunityId); grants.push(g); }
    }

    // Add SBA evergreen programs
    const sbaGrants = getSBAEvergreenPrograms(profile.ownershipType || undefined);
    for (const g of sbaGrants) {
      if (!seen.has(g.opportunityId)) { seen.add(g.opportunityId); grants.push(g); }
    }

    res.json({ grants, total: grants.length, sources: ['Grants.gov', 'SBA', 'State Portals'] });
  } catch (err: any) {
    console.error('Discover error:', err);
    res.status(500).json({ error: err.message });
  }
});

export { buildKeywordsFromProfile, searchGrantsGov };
