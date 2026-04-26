import { Router } from 'express';
import { db } from '../db.js';
import { businessProfiles } from '../schema.js';
import { eq } from 'drizzle-orm';

export const profilesRouter = Router();

profilesRouter.get('/', async (_req, res) => {
  try {
    const profiles = await db.select().from(businessProfiles);
    res.json(profiles);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

profilesRouter.post('/', async (req, res) => {
  try {
    const body = req.body;
    const [profile] = await db.insert(businessProfiles).values({
      name: body.name,
      ein: body.ein,
      naicsCodes: JSON.stringify(body.naicsCodes || []),
      state: body.state,
      city: body.city,
      employeeCount: body.employeeCount,
      annualRevenue: body.annualRevenue,
      ownershipType: body.ownershipType,
      description: body.description,
    }).returning();
    res.json(profile);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

profilesRouter.put('/:id', async (req, res) => {
  try {
    const body = req.body;
    const [profile] = await db.update(businessProfiles).set({
      name: body.name,
      ein: body.ein,
      naicsCodes: JSON.stringify(body.naicsCodes || []),
      state: body.state,
      city: body.city,
      employeeCount: body.employeeCount,
      annualRevenue: body.annualRevenue,
      ownershipType: body.ownershipType,
      description: body.description,
    }).where(eq(businessProfiles.id, parseInt(req.params.id))).returning();
    res.json(profile);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

profilesRouter.delete('/:id', async (req, res) => {
  try {
    await db.delete(businessProfiles).where(eq(businessProfiles.id, parseInt(req.params.id)));
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
