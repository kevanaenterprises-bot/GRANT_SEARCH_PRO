import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { grantsRouter } from './routes/grants.js';
import { profilesRouter } from './routes/profiles.js';
import { scoreRouter } from './routes/score.js';
import { draftsRouter } from './routes/drafts.js';
import './db.js'; // run migrations on startup

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/grants', grantsRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/score', scoreRouter);
app.use('/api/drafts', draftsRouter);

app.listen(PORT, () => {
  console.log(`🚀 Grant Intelligence server running on http://localhost:${PORT}`);
});
