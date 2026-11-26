import { fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/db/index.server';
import { interviews, jobTargets } from '$lib/db/schema';
import { getInterviewOwned, listMessages } from '$lib/server/repo';
import { limitMessage } from '$lib/server/billing';

export const load: PageServerLoad = async ({ locals, params, depends }) => {
  depends('app:interview');
  const interview = await getInterviewOwned(locals.user!.id, params.id);
  const [messages, [job]] = await Promise.all([
    interview.status === 'completed' ? listMessages(interview.id) : [],
    // The job this was practice for, to link back to it.
    interview.targetId
      ? db
          .select({ id: jobTargets.id, title: jobTargets.title, company: jobTargets.company })
          .from(jobTargets)
          .where(and(eq(jobTargets.id, interview.targetId), eq(jobTargets.userId, locals.user!.id)))
      : []
  ]);
  return {
    interview,
    job: job ?? null,
    messages: messages.map((m) => ({ id: m.id, role: m.role, content: m.content }))
  };
};

export const actions: Actions = {
  rename: async ({ request, locals, params }) => {
    const name = z.string().trim().min(1).max(120).safeParse((await request.formData()).get('name'));
    if (!name.success) return fail(400, { error: 'Enter a name' });
    await db
      .update(interviews)
      .set({ name: name.data })
      .where(and(eq(interviews.id, params.id), eq(interviews.userId, locals.user!.id)));
    return { ok: true };
  },

  delete: async ({ locals, params }) => {
    await db.delete(interviews).where(and(eq(interviews.id, params.id), eq(interviews.userId, locals.user!.id)));
    redirect(303, '/dashboard/interviews');
  },

  /** New interview with the same set-up, focused on the weakest areas from this one. */
  again: async ({ locals, params }) => {
    const user = locals.user!;
    const prev = await getInterviewOwned(user.id, params.id);
    const limit = await limitMessage(user.id, 'interview');
    if (limit) return fail(403, { error: limit, limit: true });

    const weak = prev.scorecard?.improvements.map((i) => i.title).slice(0, 3).join('; ');
    const [created] = await db
      .insert(interviews)
      .values({
        userId: user.id,
        agentId: prev.agentId,
        name: prev.name.replace(/ · retry$/, '') + ' · retry',
        jobDescription: prev.jobDescription,
        // A retry of a practice for a saved job counts towards the same job and round.
        targetId: prev.targetId,
        roundId: prev.roundId,
        cvText: prev.cvText,
        cvName: prev.cvName,
        focus: weak ? `Last time I needed to work on: ${weak}` : prev.focus,
        durationMinutes: prev.durationMinutes
      })
      .returning({ id: interviews.id });
    redirect(303, `/call/${created.id}`);
  }
};
