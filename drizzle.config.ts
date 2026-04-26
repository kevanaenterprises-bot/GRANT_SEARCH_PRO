import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './server/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: { url: 'file:./data/grants.db' },
});
