import { env } from '$env/dynamic/private';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePostgres, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { neon } from '@neondatabase/serverless';
import postgres from 'postgres';
import * as schema from './schema';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const url = env.DATABASE_URL;
const isNeon = /\.neon\.tech|neon\.build/.test(url);

/**
 * Neon's HTTP driver in production (no pooled TCP connections from serverless),
 * plain postgres-js for any other Postgres (local dev, tests, self-hosting).
 */
export const db: PostgresJsDatabase<typeof schema> = isNeon
  ? // Same query-builder surface; cast so callers see one type.
    (drizzleNeon(neon(url), { schema }) as unknown as PostgresJsDatabase<typeof schema>)
  : drizzlePostgres(postgres(url, { max: 5 }), { schema });
