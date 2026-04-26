import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '../db.js';
import { businessProfiles, savedGrants } from '../schema.js';
import { eq } from 'drizzle-orm';

export const scoreRouter = Router();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Score a single grant against a business profile
scoreRouter.post('/', async (req, res) => {
  try {
    const { grant, profileId } = req.body;

    const [profile] = await db.select().from(businessProfiles).where(eq(businessProfiles.id, profileId));
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const naics = JSON.parse(profile.naicsCodes || '[]');

    const prompt = `You are a grant eligibility analyst. Score this grant opportunity for a business and explain your reasoning.

BUSINESS PROFILE:
- Company: ${profile.name}
- State: ${profile.state}${profile.city ? `, ${profile.city}` : ''}
- NAICS Codes: ${naics.join(', ')}
- Employees: ${profile.employeeCount || 'unknown'}
- Annual Revenue: ${profile.annualRevenue ? `$${profile.annualRevenue.toLocaleString()}` : 'unknown'}
- Ownership Type: ${profile.ownershipType || 'standard small business'}
- Description: ${profile.description || 'not provided'}

GRANT OPPORTUNITY:
- Title: ${grant.title}
- Agency: ${grant.agency || 'unknown'}
- Description: ${grant.description || 'not provided'}
- Award: ${grant.awardFloor ? `$${grant.awardFloor.toLocaleString()}` : ''}${grant.awardCeiling ? ` - $${grant.awardCeiling.toLocaleString()}` : ''}
- Close Date: ${grant.closeDate || 'unknown'}
- CFDA: ${grant.cfda || 'N/A'}
- Category: ${grant.category || 'N/A'}

Respond in this exact JSON format:
{
  "score": <number 0-100>,
  "tier": "<hot|warm|cold>",
  "summary": "<2-3 sentence plain English summary of fit>",
  "pros": ["<reason 1>", "<reason 2>", "<reason 3>"],
  "cons": ["<concern 1>", "<concern 2>"],
  "recommendation": "<apply|skip|investigate>"
}

Score guide: 80+ = hot (strong match), 50-79 = warm (investigate), below 50 = cold (likely skip).`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (message.content[0] as any).text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse scoring response');

    const result = JSON.parse(jsonMatch[0]);
    res.json(result);
  } catch (err: any) {
    console.error('Scoring error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Batch score all search results against a profile
scoreRouter.post('/batch', async (req, res) => {
  try {
    const { grants, profileId } = req.body;
    if (!grants?.length) return res.json([]);

    const [profile] = await db.select().from(businessProfiles).where(eq(businessProfiles.id, profileId));
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const naics = JSON.parse(profile.naicsCodes || '[]');

    // Build a compact batch prompt to score all grants in one call
    const grantList = grants.map((g: any, i: number) =>
      `[${i}] "${g.title}" | ${g.agency || 'unknown agency'} | ${g.description?.slice(0, 200) || 'no description'} | Award: ${g.awardCeiling ? `$${g.awardCeiling.toLocaleString()}` : 'unspecified'}`
    ).join('\n');

    const prompt = `Score these grant opportunities for this business. Be concise.

BUSINESS: ${profile.name} | ${profile.state} | NAICS: ${naics.join(', ')} | ${profile.ownershipType || 'small business'} | ${profile.description?.slice(0, 150) || ''}

GRANTS TO SCORE:
${grantList}

Respond with a JSON array, one object per grant in order:
[{"score": 0-100, "tier": "hot|warm|cold", "summary": "1 sentence"}]`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (message.content[0] as any).text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Could not parse batch scoring response');

    const scores = JSON.parse(jsonMatch[0]);
    res.json(scores);
  } catch (err: any) {
    console.error('Batch scoring error:', err);
    res.status(500).json({ error: err.message });
  }
});
