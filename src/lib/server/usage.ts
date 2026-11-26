import { desc, gte, sql, type SQL } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import { db } from '$lib/db/index.server';
import { usageEvents, type UsageKind } from '$lib/db/schema';
import {
  buildCostReport,
  costMicros,
  isEmptyUsage,
  tokensFromResponse,
  zeroTokens,
  type Tokens,
  type VoiceUsage
} from '$lib/usage';
import { config } from './config';

/**
 * Records what each interview costs in AI usage. Measuring must never get in
 * the way of an interview, so every write goes through `quietly`.
 */
export async function quietly(what: string, fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (e) {
    console.error(`[usage] could not record ${what}`, e);
  }
}

export function isAdmin(email: string | null | undefined) {
  return !!email && config.adminEmails().includes(email.toLowerCase());
}

type Row = Tokens & {
  key: string;
  userId: string;
  interviewId: string | null;
  kind: UsageKind;
  model: string;
  session?: number;
  seconds?: number;
  contextLimit?: number;
  responses: number;
};

/** The larger of the stored value and the one being written. */
const larger = (column: SQLiteColumn): SQL =>
  sql`max(${column}, excluded.${sql.identifier(column.name)})`;

/**
 * Insert a usage row, or raise the stored totals when its key already exists.
 * The browser re-sends running totals, sometimes out of order (a late save, a
 * second tab), so counts only ever go up.
 */
function upsert(row: Row) {
  const seconds = row.seconds ?? 0;
  const cost = costMicros(row.model, row, row.kind === 'transcription' ? seconds : 0);
  const u = usageEvents;
  return db
    .insert(u)
    .values({ ...row, seconds, contextLimit: row.contextLimit ?? 0, costMicros: cost })
    .onConflictDoUpdate({
      target: u.key,
      set: {
        seconds: larger(u.seconds),
        responses: larger(u.responses),
        contextLimit: larger(u.contextLimit),
        inputText: larger(u.inputText),
        inputAudio: larger(u.inputAudio),
        cachedText: larger(u.cachedText),
        cachedAudio: larger(u.cachedAudio),
        outputText: larger(u.outputText),
        outputAudio: larger(u.outputAudio),
        // Stays empty for a model with no price; otherwise follows the counts up.
        costMicros: sql`case when excluded.cost_micros is null then ${u.costMicros} else max(coalesce(${u.costMicros}, 0), excluded.cost_micros) end`,
        updatedAt: new Date()
      }
    });
}

/**
 * Store what the browser measured on the live call: one voice row and one
 * transcription row per session.
 *
 * These numbers come from the candidate's browser, so they are good for
 * working out what interviews cost but must not be used to bill anyone.
 */
export async function recordVoiceUsage(opts: {
  userId: string;
  interviewId: string;
  /** The realtime model the interview's sessions were opened with. */
  model: string | null;
  /** How many live sessions the server has opened for this interview. */
  sessions: number;
  reports: VoiceUsage[];
}) {
  const voiceModel = opts.model ?? config.openai.realtimeModel();
  const transcribeModel = config.openai.transcribeModel();
  const contextLimit = config.openai.realtimeContextTokens();
  const base = { userId: opts.userId, interviewId: opts.interviewId };

  const writes = [];
  for (const r of opts.reports) {
    // A session the server never opened cannot have used anything.
    if (isEmptyUsage(r) || r.session > opts.sessions) continue;
    writes.push(
      upsert({
        ...base,
        ...r.voice,
        key: `${opts.interviewId}:voice:${r.session}`,
        kind: 'voice',
        model: voiceModel,
        session: r.session,
        seconds: r.seconds,
        contextLimit,
        responses: r.responses
      })
    );
    const t = r.transcription;
    if (t.inputText + t.inputAudio + t.outputText + t.seconds > 0) {
      writes.push(
        upsert({
          ...base,
          ...zeroTokens(),
          inputText: t.inputText,
          inputAudio: t.inputAudio,
          outputText: t.outputText,
          key: `${opts.interviewId}:transcription:${r.session}`,
          kind: 'transcription',
          model: transcribeModel,
          session: r.session,
          seconds: t.seconds,
          responses: 0
        })
      );
    }
  }
  await Promise.all(writes);
}

/** Store what one scoring run, coach chat reply or fit check used. A fit check has no interview. */
export async function recordTextUsage(opts: {
  userId: string;
  interviewId: string | null;
  kind: 'scoring' | 'chat' | 'fit';
  model: string;
  responseId: string;
  usage: unknown;
}) {
  if (!opts.usage) return;
  await upsert({
    ...tokensFromResponse(opts.usage),
    key: `${opts.interviewId ?? opts.userId}:${opts.kind}:${opts.responseId}`,
    userId: opts.userId,
    interviewId: opts.interviewId,
    kind: opts.kind,
    model: opts.model,
    responses: 1
  });
}

/** Most rows the cost page reads at once; plenty for months of use at today's volume. */
const REPORT_ROW_LIMIT = 5000;

export async function getCostReport(days: number) {
  const since = new Date(Date.now() - days * 86_400_000);
  const rows = await db
    .select()
    .from(usageEvents)
    .where(gte(usageEvents.createdAt, since))
    .orderBy(desc(usageEvents.createdAt))
    .limit(REPORT_ROW_LIMIT);
  return { ...buildCostReport(rows), truncated: rows.length === REPORT_ROW_LIMIT };
}
