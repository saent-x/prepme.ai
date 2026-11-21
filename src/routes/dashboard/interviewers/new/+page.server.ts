import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/db/index.server';
import { agents } from '$lib/db/schema';
import { limitMessage } from '$lib/server/billing';
import { InterviewerForm } from '$lib/server/interviewer-form';

export const load: PageServerLoad = async () => ({});

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const user = locals.user!;
    const parsed = InterviewerForm.safeParse(Object.fromEntries(await request.formData()));
    if (!parsed.success) return fail(400, { error: parsed.error.issues[0]?.message ?? 'Check the form' });
    const limit = await limitMessage(user.id, 'interviewer');
    if (limit) return fail(403, { error: limit });
    const [row] = await db
      .insert(agents)
      .values({
        userId: user.id,
        name: parsed.data.name,
        instructions: parsed.data.instructions,
        voice: parsed.data.voice,
        template: parsed.data.template || null
      })
      .returning({ id: agents.id });
    redirect(303, `/dashboard/interviewers/${row.id}?created=1`);
  }
};
