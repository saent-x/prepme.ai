import { defineConfig } from 'drizzle-kit';

// Generates SQL migrations into ./drizzle. Wrangler applies them to D1:
//   bun run db:migrate:local   (local dev database)
//   bun run db:migrate         (production D1)
export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  verbose: true,
  strict: true
});
