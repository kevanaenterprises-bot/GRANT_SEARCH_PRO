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

await client.executeMultiple(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_current_period_end INTEGER,
    sam_api_key TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS business_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL DEFAULT 0,
    name TEXT NOT NULL,
    ein TEXT,
    uei TEXT,
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
    user_id INTEGER NOT NULL DEFAULT 0,
    opportunity_id TEXT NOT NULL,
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
    profile_id INTEGER,
    created_at INTEGER,
    updated_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS application_drafts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL DEFAULT 0,
    grant_id INTEGER,
    profile_id INTEGER,
    fields TEXT NOT NULL,
    ai_narrative TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at INTEGER,
    updated_at INTEGER
  );
`);

// Non-destructive column additions for existing databases
const migrations = [
  `ALTER TABLE business_profiles ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE business_profiles ADD COLUMN uei TEXT`,
  `ALTER TABLE saved_grants ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE application_drafts ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0`,
];
for (const m of migrations) {
  await client.execute(m).catch(() => {}); // silently skip if column exists
}

console.log('✅ Database ready');
