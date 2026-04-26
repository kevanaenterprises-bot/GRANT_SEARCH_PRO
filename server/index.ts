import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { grantsRouter } from './routes/grants.js';
import { profilesRouter } from './routes/profiles.js';
import { scoreRouter } from './routes/score.js';
import { draftsRouter } from './routes/drafts.js';
import { samRouter } from './routes/sam.js';
import { scrapeRouter } from './routes/scrape.js';
import { authRouter } from './routes/auth.js';
import { billingRouter } from './routes/billing.js';
import { requireAuth, decrypt } from './auth.js';
import { db } from './db.js';
import { users } from './schema.js';
import { eq } from 'drizzle-orm';
import { startDigestCron, runDigest } from './digest.js';
import './db.js';

const app = express();
const PORT = process.env.PORT || 3001;
const __dirname = dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

const ALLOWED_ORIGIN = process.env.APP_URL || 'http://localhost:5173';

app.use(cors({ origin: ALLOWED_ORIGIN, credentials: true }));
app.use(cookieParser());

// Stripe webhook needs raw body before JSON parse
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '2mb' }));

// Origin lock: in production, reject API calls from unexpected origins
if (isProd) {
  app.use('/api', (req: any, res, next) => {
    // Stripe webhooks have no Origin header — always allow them through
    if (req.path.startsWith('/billing/webhook')) return next();
    const origin = req.headers.origin || req.headers.referer || '';
    const host = req.headers.host || '';
    const allowedHost = new URL(ALLOWED_ORIGIN).hostname;
    if (origin && !origin.includes(allowedHost) && !host.includes(allowedHost)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  });
}

// Public routes
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/billing', billingRouter);

// Middleware: attach user SAM key from DB to every authenticated request
app.use(async (req: any, _res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return next();
  try {
    const { verifyToken } = await import('./auth.js');
    const payload = verifyToken(token);
    if (!payload) return next();
    const [user] = await db.select().from(users).where(eq(users.id, payload.userId));
    if (user) {
      req.userId = user.id;
      req.userPlan = user.plan;
      req.userSamKey = user.samApiKey ? decrypt(user.samApiKey) : undefined;
    }
  } catch {}
  next();
});

// Protected routes — all require auth
app.use('/api/grants', requireAuth, grantsRouter);
app.use('/api/profiles', requireAuth, profilesRouter);
app.use('/api/score', requireAuth, scoreRouter);
app.use('/api/drafts', requireAuth, draftsRouter);
app.use('/api/sam', requireAuth, samRouter);
app.use('/api/scrape', requireAuth, scrapeRouter);

app.post('/api/digest/run', requireAuth, async (_req, res) => {
  try { await runDigest(true); res.json({ ok: true }); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Serve built Vite client in production
if (isProd) {
  const clientDist = join(__dirname, '../dist/client');
  if (existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => res.sendFile(join(clientDist, 'index.html')));
  }
}

app.listen(PORT, () => {
  console.log(`🚀 Grant Intelligence running on http://localhost:${PORT}`);
  startDigestCron();
});
