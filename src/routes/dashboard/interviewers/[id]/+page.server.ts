import { fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/db/index.server';
import { agents } from '$lib/db/schema';
import { getInterviewerOwned, listInterviews } from '$lib/server/repo';
import { InterviewerForm } from '$lib/server/interviewer-form';

export const load: PageServerLoad = async ({ locals, params }) => {
  const interviewer = await getInterviewerOwned(locals.user!.id, params.id);
  const recent = await listInterviews(locals.user!.id, { agentId: interviewer.id, pageSize: 5 });
  return { interviewer, recent: recent.items, total: recent.total };
};

export const actions: Actions = {
  update: async ({ request, locals, params }) => {
    const parsed = InterviewerForm.safeParse(Object.fromEntries(await request.formData()));
    if (!parsed.success) return fail(400, { error: parsed.error.issues[0]?.message ?? 'Check the form' });
    await db
      .update(agents)
      .set({ name: parsed.data.name, instructions: parsed.data.instructions, voice: parsed.data.voice })
      .where(and(eq(agents.id, params.id), eq(agents.userId, locals.user!.id)));
    return { saved: true };
  },
  delete: async ({ locals, params }) => {
    // Interviews cascade with the interviewer (FK on delete cascade).
    await db.delete(agents).where(and(eq(agents.id, params.id), eq(agents.userId, locals.user!.id)));
    redirect(303, '/dashboard/interviewers');
  }
};
