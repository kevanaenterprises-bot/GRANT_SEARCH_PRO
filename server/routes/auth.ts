import { Router } from 'express';
import { db } from '../db.js';
import { users } from '../schema.js';
import { eq } from 'drizzle-orm';
import { signToken, hashPassword, checkPassword, encrypt, decrypt, requireAuth, type AuthRequest } from '../auth.js';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'email, password, and name required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()));
    if (existing.length) return res.status(409).json({ error: 'An account with that email already exists' });

    const passwordHash = await hashPassword(password);
    const [user] = await db.insert(users).values({
      email: email.toLowerCase().trim(),
      passwordHash,
      name: name.trim(),
      plan: 'free',
      createdAt: Date.now(),
    }).returning();

    const token = signToken(user.id);
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000 });
    res.json({ user: sanitizeUser(user) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()));
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const ok = await checkPassword(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    const token = signToken(user.id);
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000 });
    res.json({ user: sanitizeUser(user) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

authRouter.post('/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

authRouter.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: sanitizeUser(user) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save SAM.gov API key (encrypted at rest)
authRouter.post('/sam-key', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { samApiKey } = req.body;
    const encrypted = samApiKey ? encrypt(samApiKey.trim()) : null;
    await db.update(users).set({ samApiKey: encrypted }).where(eq(users.id, req.userId!));
    res.json({ ok: true, hasKey: !!samApiKey });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

function sanitizeUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
    stripeCustomerId: user.stripeCustomerId,
    stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd,
    hasSamKey: !!user.samApiKey,
    createdAt: user.createdAt,
  };
}
