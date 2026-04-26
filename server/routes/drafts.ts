import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import PDFDocument from 'pdfkit';
import { db } from '../db.js';
import { applicationDrafts, businessProfiles, savedGrants } from '../schema.js';
import { and, eq } from 'drizzle-orm';
import type { AuthRequest } from '../auth.js';

export const draftsRouter = Router();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

draftsRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const drafts = await db.select().from(applicationDrafts)
      .where(eq(applicationDrafts.userId, req.userId!));
    res.json(drafts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Generate an application draft using AI
draftsRouter.post('/generate', async (req: AuthRequest, res) => {
  try {
    const { grantId, profileId } = req.body;

    const [grant] = await db.select().from(savedGrants).where(and(
      eq(savedGrants.id, grantId), eq(savedGrants.userId, req.userId!)
    ));
    const [profile] = await db.select().from(businessProfiles).where(and(
      eq(businessProfiles.id, profileId), eq(businessProfiles.userId, req.userId!)
    ));
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
      userId: req.userId!,
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

// Export draft as PDF
draftsRouter.get('/:id/pdf', async (req: AuthRequest, res) => {
  try {
    const [draft] = await db.select().from(applicationDrafts).where(and(
      eq(applicationDrafts.id, parseInt(req.params.id)),
      eq(applicationDrafts.userId, req.userId!)
    ));
    if (!draft) return res.status(404).json({ error: 'Draft not found' });

    let grant: any = null;
    let profile: any = null;
    if (draft.grantId) {
      [grant] = await db.select().from(savedGrants).where(eq(savedGrants.id, draft.grantId));
    }
    if (draft.profileId) {
      [profile] = await db.select().from(businessProfiles).where(eq(businessProfiles.id, draft.profileId));
    }

    const fields = JSON.parse(draft.fields || '{}');

    const FIELD_LABELS: Record<string, string> = {
      project_title: 'Project Title',
      executive_summary: 'Executive Summary',
      organizational_background: 'Organizational Background',
      project_description: 'Project Description',
      goals_and_objectives: 'Goals & Objectives',
      target_population: 'Target Population',
      evaluation_plan: 'Evaluation Plan',
      budget_narrative: 'Budget Narrative',
      sustainability_plan: 'Sustainability Plan',
      certifications: 'Certifications',
    };

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="grant-draft-${draft.id}.pdf"`);

    const doc = new PDFDocument({ margin: 60, size: 'LETTER' });
    doc.pipe(res);

    // Header
    doc.rect(0, 0, doc.page.width, 80).fill('#1d4ed8');
    doc.fillColor('white').fontSize(20).font('Helvetica-Bold').text('Grant Application Draft', 60, 24);
    doc.fontSize(11).font('Helvetica').text(`${profile?.name || 'Business'} · Generated ${new Date().toLocaleDateString()}`, 60, 50);
    doc.fillColor('#0f172a').moveDown(3);

    // Grant title banner
    if (grant?.title) {
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#1d4ed8').text('For:', 60, 100);
      doc.fontSize(13).font('Helvetica').fillColor('#0f172a').text(grant.title, 90, 100, { width: doc.page.width - 150 });
      doc.moveDown(2);
    }

    // Content sections
    let y = grant?.title ? 140 : 100;
    doc.y = y;

    for (const [key, label] of Object.entries(FIELD_LABELS)) {
      const val = fields[key];
      if (!val) continue;

      // Section header
      doc.fillColor('#1d4ed8').fontSize(12).font('Helvetica-Bold').text(label.toUpperCase(), { continued: false });
      doc.moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y).strokeColor('#e2e8f0').stroke();
      doc.moveDown(0.4);

      // Content
      doc.fillColor('#0f172a').fontSize(11).font('Helvetica');
      if (Array.isArray(val)) {
        val.forEach((item: string, i: number) => doc.text(`${i + 1}. ${item}`, { indent: 10 }));
      } else {
        doc.text(val, { lineGap: 3 });
      }
      doc.moveDown(1.5);
    }

    // Footer
    const pageRange = doc.bufferedPageRange();
    for (let i = pageRange.start; i < pageRange.start + pageRange.count; i++) {
      doc.switchToPage(i);
      doc.fillColor('#94a3b8').fontSize(9).text(
        `Grant Intelligence · ${profile?.name || ''} · Draft #${draft.id} · Page ${i + 1}`,
        60, doc.page.height - 40, { align: 'center', width: doc.page.width - 120 }
      );
    }

    doc.end();
  } catch (err: any) {
    console.error('PDF export error:', err);
    res.status(500).json({ error: err.message });
  }
});

draftsRouter.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { fields, status } = req.body;
    const [updated] = await db.update(applicationDrafts).set({
      fields: JSON.stringify(fields),
      status,
      updatedAt: Date.now(),
    }).where(and(
      eq(applicationDrafts.id, parseInt(req.params.id)),
      eq(applicationDrafts.userId, req.userId!)
    )).returning();
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
