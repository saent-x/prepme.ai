import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/db/index.server';
import { agents, interviews } from '$lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { getInterviewerOwned, listInterviewers } from '$lib/server/repo';
import { getPlan, limitMessage } from '$lib/server/billing';
import { callMinutes } from '$lib/server/config';
import { getTemplate } from '$lib/templates';
import { getJobOwned } from '$lib/server/jobs';
import { practiceName } from '$lib/jobs';

// The form is a pop-up (see the dashboard layout). This route keeps old links working and handles the submit.
export const load: PageServerLoad = async ({ url }) => {
  const q = new URLSearchParams({ new: '1' });
  const template = url.searchParams.get('template');
  const agent = url.searchParams.get('interviewer') ?? (template ? `template:${template}` : null);
  if (agent) q.set('interviewer', agent);
  const focus = url.searchParams.get('focus')?.slice(0, 300);
  if (focus) q.set('focus', focus);
  for (const key of ['job', 'round']) {
    const value = url.searchParams.get(key)?.slice(0, 64);
    if (value) q.set(key, value);
  }
  redirect(303, `/dashboard/interviews?${q}`);
};

const Form = z.object({
  /** Either an existing interviewer id or "template:<id>". */
  interviewer: z.string().min(1, 'Choose an agent'),
  name: z.string().trim().max(120).optional(),
  jobDescription: z.string().trim().max(15_000).optional(),
  focus: z.string().trim().max(500).optional(),
  cvText: z.string().trim().max(25_000).optional(),
  cvName: z.string().trim().max(120).optional(),
  /** Reuse the CV from one of the user's earlier interviews. */
  cvFrom: z.string().max(64).optional(),
  /** Practise for one of the user's jobs: its advert and CV are used, and the interview counts towards it. */
  job: z.string().max(64).optional(),
  /** Which of that job's rounds this practises. */
  round: z.string().max(40).optional()
});

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const user = locals.user!;
    const raw = Object.fromEntries(await request.formData());
    const parsed = Form.safeParse(raw);
    if (!parsed.success) {
      return fail(400, { error: parsed.error.issues[0]?.message ?? 'Check the form', values: raw });
    }
    const f = parsed.data;

    const limit = await limitMessage(user.id, 'interview');
    if (limit) return fail(403, { error: limit, limit: true, values: raw });
    const plan = await getPlan(user.id);
    // The length comes from the plan, not the form.
    const durationMinutes = callMinutes(plan.premium);

    // Ownership check: the job id comes from the client.
    const job = f.job ? await getJobOwned(user.id, f.job) : null;
    const round = job?.rounds.find((r) => r.id === f.round) ?? null;

    // Resolve the interviewer, creating it from a template on first use.
    let agentId: string;
    let agentName: string;
    if (f.interviewer.startsWith('template:')) {
      const t = getTemplate(f.interviewer.slice('template:'.length));
      if (!t) return fail(400, { error: 'Unknown example agent', values: raw });
      const existing = (await listInterviewers(user.id)).find((i) => i.template === t.id);
      if (existing) {
        agentId = existing.id;
        agentName = existing.name;
      } else {
        const agentLimit = await limitMessage(user.id, 'interviewer');
        if (agentLimit) return fail(403, { error: agentLimit, limit: true, values: raw });
        const [created] = await db
          .insert(agents)
          .values({ userId: user.id, name: t.name, instructions: t.instructions, template: t.id, voice: t.voice })
          .returning();
        agentId = created.id;
        agentName = created.name;
      }
    } else {
      // Ownership check: never trust an id from the client.
      const owned = await getInterviewerOwned(user.id, f.interviewer);
      agentId = owned.id;
      agentName = owned.name;
    }

    let cvText = f.cvText || null;
    let cvName = cvText ? f.cvName || 'CV' : null;
    if (!cvText && job?.cvText) {
      cvText = job.cvText;
      cvName = job.cvName ?? 'CV';
    } else if (!cvText && f.cvFrom) {
      const [prev] = await db
        .select({ cvText: interviews.cvText, cvName: interviews.cvName })
        .from(interviews)
        .where(and(eq(interviews.id, f.cvFrom), eq(interviews.userId, user.id)));
      cvText = prev?.cvText ?? null;
      cvName = cvText ? prev?.cvName ?? 'CV' : null;
    }

    const [interview] = await db
      .insert(interviews)
      .values({
        userId: user.id,
        agentId,
        name: f.name || (job ? practiceName(job, round) : `${agentName} practice`),
        jobDescription: job ? job.advert.slice(0, 15_000) : f.jobDescription || null,
        targetId: job?.id ?? null,
        roundId: round?.id ?? null,
        focus: f.focus || null,
        cvText,
        cvName,
        durationMinutes
      })
      .returning({ id: interviews.id });

    redirect(303, `/call/${interview.id}`);
  }
};
