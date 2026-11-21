import { error } from '@sveltejs/kit';
import { and, asc, count, desc, eq, getTableColumns, ilike, inArray, sql } from 'drizzle-orm';
import { db } from '$lib/db/index.server';
import { agents, interviewMessages, interviews, type InterviewStatus } from '$lib/db/schema';

// ---------------------------------------------------------------------------
// Interviewers
// ---------------------------------------------------------------------------

export async function listInterviewers(userId: string, search?: string | null) {
  return db
    .select({
      ...getTableColumns(agents),
      interviewCount: sql<number>`(select count(*)::int from ${interviews} where ${interviews.agentId} = ${agents.id})`
    })
    .from(agents)
    .where(and(eq(agents.userId, userId), search ? ilike(agents.name, `%${search}%`) : undefined))
    .orderBy(desc(agents.createdAt));
}

/** Throws 404 unless the interviewer exists AND belongs to the user. */
export async function getInterviewerOwned(userId: string, id: string) {
  const [row] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, id), eq(agents.userId, userId)));
  if (!row) error(404, { message: 'Interviewer not found' });
  return row;
}

// ---------------------------------------------------------------------------
// Interviews
// ---------------------------------------------------------------------------

const durationSql = sql<
  number | null
>`EXTRACT(EPOCH FROM (${interviews.endedAt} - ${interviews.startedAt}))::int`;

export async function listInterviews(
  userId: string,
  opts: {
    search?: string | null;
    status?: InterviewStatus | null;
    agentId?: string | null;
    page?: number;
    pageSize?: number;
  } = {}
) {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, opts.pageSize ?? 12));
  const where = and(
    eq(interviews.userId, userId),
    opts.search ? ilike(interviews.name, `%${opts.search}%`) : undefined,
    opts.status ? eq(interviews.status, opts.status) : undefined,
    opts.agentId ? eq(interviews.agentId, opts.agentId) : undefined
  );

  const [items, [total]] = await Promise.all([
    db
      .select({
        id: interviews.id,
        name: interviews.name,
        status: interviews.status,
        overallScore: interviews.overallScore,
        durationMinutes: interviews.durationMinutes,
        createdAt: interviews.createdAt,
        startedAt: interviews.startedAt,
        duration: durationSql,
        agent: { id: agents.id, name: agents.name, template: agents.template }
      })
      .from(interviews)
      .innerJoin(agents, eq(interviews.agentId, agents.id))
      .where(where)
      .orderBy(desc(interviews.createdAt), desc(interviews.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ n: count() }).from(interviews).where(where)
  ]);

  return { items, total: total.n, page, pageSize, totalPages: Math.max(1, Math.ceil(total.n / pageSize)) };
}

/** Throws 404 unless the interview belongs to the user. */
export async function getInterviewOwned(userId: string, id: string) {
  const [row] = await db
    .select({ ...getTableColumns(interviews), agent: agents, duration: durationSql })
    .from(interviews)
    .innerJoin(agents, eq(interviews.agentId, agents.id))
    .where(and(eq(interviews.id, id), eq(interviews.userId, userId)));
  if (!row) error(404, { message: 'Interview not found' });
  return row;
}

export type InterviewWithAgent = Awaited<ReturnType<typeof getInterviewOwned>>;

export async function listMessages(interviewId: string) {
  return db
    .select()
    .from(interviewMessages)
    .where(eq(interviewMessages.interviewId, interviewId))
    .orderBy(asc(interviewMessages.createdAt));
}

/** Overview numbers for the dashboard home. */
export async function getProgress(userId: string) {
  const completed = await db
    .select({
      id: interviews.id,
      name: interviews.name,
      overallScore: interviews.overallScore,
      startedAt: interviews.startedAt,
      createdAt: interviews.createdAt,
      duration: durationSql,
      scorecard: interviews.scorecard,
      agentName: agents.name
    })
    .from(interviews)
    .innerJoin(agents, eq(interviews.agentId, agents.id))
    .where(and(eq(interviews.userId, userId), eq(interviews.status, 'completed')))
    .orderBy(asc(interviews.createdAt));

  const scored = completed.filter((c) => c.overallScore != null);
  const minutes = Math.round(completed.reduce((s, c) => s + (c.duration ?? 0), 0) / 60);
  const avg = scored.length
    ? Math.round(scored.reduce((s, c) => s + (c.overallScore ?? 0), 0) / scored.length)
    : null;

  // Average each competency across all scorecards.
  const sums = new Map<string, { total: number; n: number }>();
  for (const c of scored) {
    for (const comp of c.scorecard?.competencies ?? []) {
      const cur = sums.get(comp.key) ?? { total: 0, n: 0 };
      cur.total += comp.score;
      cur.n += 1;
      sums.set(comp.key, cur);
    }
  }
  const competencies = [...sums.entries()].map(([key, v]) => ({
    key,
    avg: Math.round((v.total / v.n) * 10) / 10
  }));

  return {
    completedCount: completed.length,
    minutes,
    averageScore: avg,
    best: scored.length ? Math.max(...scored.map((s) => s.overallScore ?? 0)) : null,
    trend: scored.map((s) => ({
      id: s.id,
      name: s.name,
      score: s.overallScore ?? 0,
      date: (s.startedAt ?? s.createdAt).toISOString()
    })),
    competencies
  };
}

export async function deleteInterviewsForAgentIds(userId: string, ids: string[]) {
  if (!ids.length) return;
  await db.delete(interviews).where(and(eq(interviews.userId, userId), inArray(interviews.agentId, ids)));
}
