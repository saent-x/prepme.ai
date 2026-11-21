import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/db/index.server';
import { agents, interviews } from '$lib/db/schema';
import { getInterviewerOwned, listInterviewers } from '$lib/server/repo';
import { getPlan, limitMessage } from '$lib/server/billing';
import { FREE_LIMITS } from '$lib/server/config';
import { DURATIONS, getTemplate } from '$lib/templates';

export const load: PageServerLoad = async ({ locals, url }) => {
  const userId = locals.user!.id;
  const [interviewers, plan] = await Promise.all([listInterviewers(userId), getPlan(userId)]);
  return {
    interviewers: interviewers.map((i) => ({ id: i.id, name: i.name, template: i.template, voice: i.voice })),
    preset: {
      template: url.searchParams.get('template'),
      interviewer: url.searchParams.get('interviewer'),
      focus: url.searchParams.get('focus')?.slice(0, 300) ?? '',
      from: url.searchParams.get('from')
    },
    maxMinutes: plan.premium ? 45 : FREE_LIMITS.maxMinutes
  };
};

const Form = z.object({
  /** Either an existing interviewer id or "template:<id>". */
  interviewer: z.string().min(1, 'Choose an interviewer'),
  name: z.string().trim().max(120).optional(),
  jobDescription: z.string().trim().max(15_000).optional(),
  focus: z.string().trim().max(500).optional(),
  durationMinutes: z.coerce.number().refine((n) => (DURATIONS as readonly number[]).includes(n), 'Pick a length')
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
    const durationMinutes = plan.premium ? f.durationMinutes : Math.min(f.durationMinutes, FREE_LIMITS.maxMinutes);

    // Resolve the interviewer, creating it from a template on first use.
    let agentId: string;
    let agentName: string;
    if (f.interviewer.startsWith('template:')) {
      const t = getTemplate(f.interviewer.slice('template:'.length));
      if (!t) return fail(400, { error: 'Unknown interviewer template', values: raw });
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

    const [interview] = await db
      .insert(interviews)
      .values({
        userId: user.id,
        agentId,
        name: f.name || `${agentName} practice`,
        jobDescription: f.jobDescription || null,
        focus: f.focus || null,
        durationMinutes
      })
      .returning({ id: interviews.id });

    redirect(303, `/call/${interview.id}`);
  }
};
