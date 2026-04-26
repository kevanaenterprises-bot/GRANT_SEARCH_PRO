import { Router } from 'express';
import { db } from '../db.js';
import { businessProfiles } from '../schema.js';
import { and, eq } from 'drizzle-orm';
import type { AuthRequest } from '../auth.js';

export const profilesRouter = Router();

profilesRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const profiles = await db.select().from(businessProfiles)
      .where(eq(businessProfiles.userId, req.userId!));
    res.json(profiles);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

profilesRouter.post('/', async (req: AuthRequest, res) => {
  try {
    const body = req.body;
    const [profile] = await db.insert(businessProfiles).values({
      userId: req.userId!,
      name: body.name,
      ein: body.ein,
      uei: body.uei?.trim().toUpperCase() || null,
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

profilesRouter.put('/:id', async (req: AuthRequest, res) => {
  try {
    const body = req.body;
    const [profile] = await db.update(businessProfiles).set({
      name: body.name,
      ein: body.ein,
      uei: body.uei?.trim().toUpperCase() || null,
      naicsCodes: JSON.stringify(body.naicsCodes || []),
      state: body.state,
      city: body.city,
      employeeCount: body.employeeCount,
      annualRevenue: body.annualRevenue,
      ownershipType: body.ownershipType,
      description: body.description,
    }).where(and(
      eq(businessProfiles.id, parseInt(req.params.id)),
      eq(businessProfiles.userId, req.userId!)
    )).returning();
    res.json(profile);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

profilesRouter.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await db.delete(businessProfiles).where(and(
      eq(businessProfiles.id, parseInt(req.params.id)),
      eq(businessProfiles.userId, req.userId!)
    ));
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
