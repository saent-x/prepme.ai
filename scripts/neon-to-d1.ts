/**
 * One-off copy of PrepMe data from Postgres (Neon) into D1.
 *
 *   DATABASE_URL=postgres://… bun scripts/neon-to-d1.ts > neon-export.sql
 *   bunx wrangler d1 execute prepme --remote --file neon-export.sql
 *
 * Reads only. It works whether or not the v2 columns were ever added to Postgres:
 * it copies the columns both databases have and lets D1 defaults fill the rest.
 * Run it against an empty D1 database (after `bun run db:migrate`).
 */
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('Set DATABASE_URL to the Neon connection string');

// D1 columns per table, in foreign-key order. Kept in sync with drizzle/0000_init.sql.
const TABLES: Record<
  string,
  { columns: string[]; timestamps: string[]; booleans?: string[]; json?: string[] }
> = {
  user: {
    columns: ['id', 'name', 'email', 'email_verified', 'image', 'created_at', 'updated_at'],
    timestamps: ['created_at', 'updated_at'],
    booleans: ['email_verified']
  },
  account: {
    columns: [
      'id',
      'account_id',
      'provider_id',
      'user_id',
      'access_token',
      'refresh_token',
      'id_token',
      'access_token_expires_at',
      'refresh_token_expires_at',
      'scope',
      'password',
      'created_at',
      'updated_at'
    ],
    timestamps: ['access_token_expires_at', 'refresh_token_expires_at', 'created_at', 'updated_at']
  },
  agents: {
    columns: [
      'id',
      'name',
      'user_id',
      'instructions',
      'template',
      'voice',
      'created_at',
      'updated_at'
    ],
    timestamps: ['created_at', 'updated_at']
  },
  interviews: {
    columns: [
      'id',
      'name',
      'user_id',
      'agent_id',
      'status',
      'job_description',
      'focus',
      'duration_minutes',
      'transcript',
      'scorecard',
      'overall_score',
      'summary',
      'analysis_error',
      'session_count',
      'realtime_model',
      'transcript_url',
      'recording_url',
      'created_at',
      'updated_at',
      'started_at',
      'ended_at'
    ],
    timestamps: ['created_at', 'updated_at', 'started_at', 'ended_at'],
    json: ['transcript', 'scorecard']
  },
  interview_messages: {
    columns: ['id', 'interview_id', 'role', 'content', 'created_at'],
    timestamps: ['created_at']
  }
  // Sessions and verification tokens are not copied: everyone signs in again once.
};

function literal(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  return `'${String(value).replaceAll("'", "''")}'`;
}

const sql = postgres(url, { max: 1, prepare: false });
const out: string[] = ['PRAGMA defer_foreign_keys = true;'];
const counts: Record<string, number> = {};

try {
  for (const [table, spec] of Object.entries(TABLES)) {
    const present = await sql<{ column_name: string }[]>`
      select column_name from information_schema.columns
      where table_schema = 'public' and table_name = ${table}`;
    if (!present.length) {
      counts[table] = 0;
      continue;
    }
    const have = new Set(present.map((r) => r.column_name));
    const cols = spec.columns.filter((c) => have.has(c));
    const rows = await sql.unsafe(`select ${cols.map((c) => `"${c}"`).join(', ')} from "${table}"`);
    counts[table] = rows.length;

    for (const row of rows) {
      const values = cols.map((c) => {
        const v = row[c];
        if (v == null) return 'NULL';
        if (spec.timestamps.includes(c)) return String(new Date(v).getTime());
        if (spec.booleans?.includes(c)) return v ? '1' : '0';
        if (spec.json?.includes(c)) return literal(typeof v === 'string' ? v : JSON.stringify(v));
        return literal(v);
      });
      out.push(
        `INSERT INTO \`${table}\` (${cols.map((c) => `\`${c}\``).join(', ')}) VALUES (${values.join(', ')});`
      );
    }
  }
} finally {
  await sql.end();
}

process.stdout.write(out.join('\n') + '\n');
console.error('Rows exported:', counts);
