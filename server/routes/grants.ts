import { Router } from 'express';
import { db } from '../db.js';
import { savedGrants } from '../schema.js';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

export const grantsRouter = Router();

const GRANTS_GOV_API = 'https://apply07.grants.gov/grantsws/rest/opportunities/search/';

const SearchSchema = z.object({
  keyword: z.string().optional(),
  naicsCodes: z.array(z.string()).optional(),
  state: z.string().optional(),
  agency: z.string().optional(),
  rows: z.number().default(25),
  startRecordNum: z.number().default(0),
  oppStatuses: z.string().default('posted'), // posted | closed | archived
});

// Search Grants.gov
grantsRouter.post('/search', async (req, res) => {
  try {
    const params = SearchSchema.parse(req.body);

    const payload: Record<string, unknown> = {
      rows: params.rows,
      startRecordNum: params.startRecordNum,
      oppStatuses: params.oppStatuses,
    };

    if (params.keyword) payload.keyword = params.keyword;
    if (params.state) payload.eligibilities = params.state;

    const response = await fetch(GRANTS_GOV_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Grants.gov API error: ${response.status}`);
    }

    const data = await response.json() as any;
    const opportunities = data.oppHits || [];

    // Normalize into a cleaner shape
    const grants = opportunities.map((opp: any) => ({
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
    }));

    res.json({ grants, total: data.hitCount || grants.length });
  } catch (err: any) {
    console.error('Grants.gov search error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all saved grants
grantsRouter.get('/', async (_req, res) => {
  try {
    const grants = await db.select().from(savedGrants).orderBy(desc(savedGrants.updatedAt));
    res.json(grants);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save a grant
grantsRouter.post('/save', async (req, res) => {
  try {
    const grant = req.body;
    const [saved] = await db.insert(savedGrants).values({
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
    }).onConflictDoUpdate({
      target: savedGrants.opportunityId,
      set: {
        matchScore: grant.matchScore,
        matchReasoning: grant.matchReasoning,
        updatedAt: new Date(),
      },
    }).returning();
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update grant status or notes
grantsRouter.patch('/:id', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const [updated] = await db.update(savedGrants)
      .set({ status, notes, updatedAt: new Date() })
      .where(eq(savedGrants.id, parseInt(req.params.id)))
      .returning();
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a saved grant
grantsRouter.delete('/:id', async (req, res) => {
  try {
    await db.delete(savedGrants).where(eq(savedGrants.id, parseInt(req.params.id)));
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
