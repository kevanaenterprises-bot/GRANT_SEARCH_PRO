import { pgTable, text, integer, bigint, real, serial } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  plan: text('plan').notNull().default('free'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripeCurrentPeriodEnd: bigint('stripe_current_period_end', { mode: 'number' }),
  samApiKey: text('sam_api_key'),
  createdAt: bigint('created_at', { mode: 'number' }),
});

export const businessProfiles = pgTable('business_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  name: text('name').notNull(),
  ein: text('ein'),
  uei: text('uei'),
  naicsCodes: text('naics_codes').notNull(),
  state: text('state').notNull(),
  city: text('city'),
  employeeCount: integer('employee_count'),
  annualRevenue: integer('annual_revenue'),
  ownershipType: text('ownership_type'),
  description: text('description'),
  createdAt: bigint('created_at', { mode: 'number' }),
});

export const savedGrants = pgTable('saved_grants', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  opportunityId: text('opportunity_id').notNull(),
  title: text('title').notNull(),
  agency: text('agency'),
  description: text('description'),
  awardCeiling: integer('award_ceiling'),
  awardFloor: integer('award_floor'),
  closeDate: text('close_date'),
  postDate: text('post_date'),
  category: text('category'),
  naicsCodes: text('naics_codes'),
  cfda: text('cfda'),
  link: text('link'),
  rawData: text('raw_data'),
  status: text('status').notNull().default('saved'),
  matchScore: real('match_score'),
  matchReasoning: text('match_reasoning'),
  notes: text('notes'),
  profileId: integer('profile_id'),
  createdAt: bigint('created_at', { mode: 'number' }),
  updatedAt: bigint('updated_at', { mode: 'number' }),
});

export const applicationDrafts = pgTable('application_drafts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  grantId: integer('grant_id'),
  profileId: integer('profile_id'),
  fields: text('fields').notNull(),
  aiNarrative: text('ai_narrative'),
  status: text('status').notNull().default('draft'),
  createdAt: bigint('created_at', { mode: 'number' }),
  updatedAt: bigint('updated_at', { mode: 'number' }),
});
