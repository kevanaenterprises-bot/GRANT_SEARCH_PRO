import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema.js';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');
mkdirSync(dataDir, { recursive: true });

const client = createClient({ url: `file:${join(dataDir, 'grants.db')}` });
export const db = drizzle(client, { schema });

// Create tables on startup
await client.executeMultiple(`
  CREATE TABLE IF NOT EXISTS business_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    ein TEXT,
    naics_codes TEXT NOT NULL,
    state TEXT NOT NULL,
    city TEXT,
    employee_count INTEGER,
    annual_revenue INTEGER,
    ownership_type TEXT,
    description TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS saved_grants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    opportunity_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    agency TEXT,
    description TEXT,
    award_ceiling INTEGER,
    award_floor INTEGER,
    close_date TEXT,
    post_date TEXT,
    category TEXT,
    naics_codes TEXT,
    cfda TEXT,
    link TEXT,
    raw_data TEXT,
    status TEXT NOT NULL DEFAULT 'saved',
    match_score REAL,
    match_reasoning TEXT,
    notes TEXT,
    profile_id INTEGER REFERENCES business_profiles(id),
    created_at INTEGER,
    updated_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS application_drafts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grant_id INTEGER REFERENCES saved_grants(id),
    profile_id INTEGER REFERENCES business_profiles(id),
    fields TEXT NOT NULL,
    ai_narrative TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at INTEGER,
    updated_at INTEGER
  );
`);

console.log('✅ Database ready at data/grants.db');
