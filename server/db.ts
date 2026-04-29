import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');

const client = postgres(connectionString, { ssl: 'require' });
export const db = drizzle(client, { schema });

await client`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_current_period_end BIGINT,
    sam_api_key TEXT,
    created_at BIGINT
  )
`;

await client`
  CREATE TABLE IF NOT EXISTS business_profiles (
    id SERIAL PRIMARY KEY,
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
    created_at BIGINT
  )
`;

await client`
  CREATE TABLE IF NOT EXISTS saved_grants (
    id SERIAL PRIMARY KEY,
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
    created_at BIGINT,
    updated_at BIGINT
  )
`;

await client`
  CREATE TABLE IF NOT EXISTS application_drafts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL DEFAULT 0,
    grant_id INTEGER,
    profile_id INTEGER,
    fields TEXT NOT NULL,
    ai_narrative TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at BIGINT,
    updated_at BIGINT
  )
`;

console.log('✅ Database ready');
