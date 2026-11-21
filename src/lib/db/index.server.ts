import { getRequestEvent } from '$app/server';
import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './schema';

export type DB = DrizzleD1Database<typeof schema>;

const instances = new WeakMap<object, DB>();

function current(): DB {
  const binding = getRequestEvent().platform?.env?.DB;
  if (!binding) throw new Error('The D1 binding "DB" is missing. Check wrangler.jsonc.');
  let db = instances.get(binding);
  if (!db) {
    db = drizzle(binding, { schema });
    instances.set(binding, db);
  }
  return db;
}

/**
 * D1 through the `DB` binding in wrangler.jsonc. Bindings live on the request's
 * `platform.env`, so the client is resolved per request rather than at import
 * (SvelteKit also imports server modules during the build, when none exist).
 */
export const db: DB = new Proxy({} as DB, {
  get(_, prop) {
    const instance = current();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});
