import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const businessProfiles = sqliteTable('business_profiles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  ein: text('ein'),
  uei: text('uei'), // SAM.gov Unique Entity Identifier (12-char alphanumeric)
  naicsCodes: text('naics_codes').notNull(),
  state: text('state').notNull(),
  city: text('city'),
  employeeCount: integer('employee_count'),
  annualRevenue: integer('annual_revenue'),
  ownershipType: text('ownership_type'),
  description: text('description'),
  createdAt: integer('created_at'),
});

export const savedGrants = sqliteTable('saved_grants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  opportunityId: text('opportunity_id').notNull().unique(),
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
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at'),
});

export const applicationDrafts = sqliteTable('application_drafts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  grantId: integer('grant_id'),
  profileId: integer('profile_id'),
  fields: text('fields').notNull(),
  aiNarrative: text('ai_narrative'),
  status: text('status').notNull().default('draft'),
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at'),
});
