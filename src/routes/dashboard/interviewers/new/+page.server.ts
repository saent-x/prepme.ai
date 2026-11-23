import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/db/index.server';
import { agents } from '$lib/db/schema';
import { limitMessage } from '$lib/server/billing';
import { InterviewerForm } from '$lib/server/interviewer-form';

// The form is a pop-up on the interviewers page. This route only keeps old links working and handles the submit.
export const load: PageServerLoad = async ({ url }) => {
  const job = url.searchParams.get('job');
  redirect(303, `/dashboard/interviewers?new=1${job ? `&job=${encodeURIComponent(job)}` : ''}`);
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const user = locals.user!;
    const raw = Object.fromEntries(await request.formData());
    const parsed = InterviewerForm.safeParse(raw);
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
    redirect(303, raw.then === 'start' ? `/dashboard/interviews/new?interviewer=${row.id}` : '/dashboard/interviewers');
  }
};
