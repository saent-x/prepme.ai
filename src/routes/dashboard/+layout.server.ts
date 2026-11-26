import type { LayoutServerLoad } from './$types';
import { requireUserPage } from '$lib/server/guard';
import { getUsageSummary } from '$lib/server/billing';
import { listInterviewers, listInterviews } from '$lib/server/repo';
import { callMinutes } from '$lib/server/config';
import { isAdmin } from '$lib/server/usage';
import { agentBlurb } from '$lib/interviewer-brief';
import { TEMPLATES } from '$lib/templates';
import { db } from '$lib/db/index.server';
import { interviews } from '$lib/db/schema';
import { and, desc, eq, isNotNull } from 'drizzle-orm';

export const load: LayoutServerLoad = async (event) => {
  const user = requireUserPage(event);
  event.depends('app:usage');
  const [usage, agents, recent, lastCv] = await Promise.all([
    getUsageSummary(user.id),
    listInterviewers(user.id),
    listInterviews(user.id, { pageSize: 50 }),
    // The CV used last time is offered again, by name only (the text stays on the server).
    db
      .select({ id: interviews.id, name: interviews.cvName })
      .from(interviews)
      .where(and(eq(interviews.userId, user.id), isNotNull(interviews.cvText)))
      .orderBy(desc(interviews.createdAt))
      .limit(1)
      .then((r) => r[0] ?? null)
  ]);
  const used = new Set(agents.map((a) => a.template).filter(Boolean));
  return {
    user: { id: user.id, name: user.name, email: user.email, image: user.image ?? null },
    /** Shows the link to the cost page; the page checks again for itself. */
    admin: isAdmin(user.email),
    usage,
    // For the Cmd+K palette.
    search: {
      interviews: recent.items.map((r) => ({ id: r.id, name: r.name, agent: r.agent.name, status: r.status, score: r.overallScore })),
      agents: agents.map((a) => ({ id: a.id, name: a.name }))
    },
    // For the "New interview" pop-up, which opens from any dashboard page.
    newInterview: {
      agents: agents.map((a) => ({ id: a.id, name: a.name, blurb: agentBlurb(a.instructions) })),
      examples: TEMPLATES.filter((t) => !used.has(t.id)).map((t) => ({ id: `template:${t.id}`, name: t.name, blurb: t.tagline })),
      minutes: callMinutes(usage.plan.premium),
      lastCv: lastCv ? { from: lastCv.id, name: lastCv.name ?? 'CV' } : null
    }
  };
};
