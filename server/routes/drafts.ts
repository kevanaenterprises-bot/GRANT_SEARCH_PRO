import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '../db.js';
import { applicationDrafts, businessProfiles, savedGrants } from '../schema.js';
import { eq } from 'drizzle-orm';

export const draftsRouter = Router();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

draftsRouter.get('/', async (_req, res) => {
  try {
    const drafts = await db.select().from(applicationDrafts);
    res.json(drafts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Generate an application draft using AI
draftsRouter.post('/generate', async (req, res) => {
  try {
    const { grantId, profileId } = req.body;

    const [grant] = await db.select().from(savedGrants).where(eq(savedGrants.id, grantId));
    const [profile] = await db.select().from(businessProfiles).where(eq(businessProfiles.id, profileId));
    if (!grant || !profile) return res.status(404).json({ error: 'Grant or profile not found' });

    const naics = JSON.parse(profile.naicsCodes || '[]');

    const prompt = `You are a professional grant writer. Generate a compelling grant application draft for this business.

BUSINESS PROFILE:
- Company: ${profile.name}
- State: ${profile.state}${profile.city ? `, ${profile.city}` : ''}
- NAICS Codes: ${naics.join(', ')}
- Employees: ${profile.employeeCount || 'not specified'}
- Annual Revenue: ${profile.annualRevenue ? `$${profile.annualRevenue.toLocaleString()}` : 'not specified'}
- Ownership: ${profile.ownershipType || 'standard small business'}
- Business Description: ${profile.description || 'not provided'}

GRANT:
- Title: ${grant.title}
- Agency: ${grant.agency}
- Description: ${grant.description}
- Award Range: ${grant.awardFloor ? `$${grant.awardFloor.toLocaleString()}` : ''} - ${grant.awardCeiling ? `$${grant.awardCeiling.toLocaleString()}` : 'unspecified'}

Generate a JSON object with these application fields filled in:
{
  "project_title": "...",
  "executive_summary": "2-3 paragraph summary of the project and need (300-400 words)",
  "organizational_background": "Description of the organization, its mission, and track record (200-300 words)",
  "project_description": "Detailed description of what will be done with the grant funds (400-500 words)",
  "goals_and_objectives": ["goal 1", "goal 2", "goal 3"],
  "target_population": "...",
  "evaluation_plan": "How success will be measured (150-200 words)",
  "budget_narrative": "How grant funds will be used (150-200 words)",
  "sustainability_plan": "How the project will continue after grant period (150-200 words)",
  "certifications": ["We certify that all information is accurate", "Organization is in good standing", "No conflicts of interest exist"]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (message.content[0] as any).text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse draft response');

    const fields = JSON.parse(jsonMatch[0]);

    const [draft] = await db.insert(applicationDrafts).values({
      grantId,
      profileId,
      fields: JSON.stringify(fields),
      aiNarrative: fields.executive_summary,
      status: 'draft',
    }).returning();

    res.json({ ...draft, fields });
  } catch (err: any) {
    console.error('Draft generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

draftsRouter.put('/:id', async (req, res) => {
  try {
    const { fields, status } = req.body;
    const [updated] = await db.update(applicationDrafts).set({
      fields: JSON.stringify(fields),
      status,
      updatedAt: new Date(),
    }).where(eq(applicationDrafts.id, parseInt(req.params.id))).returning();
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
