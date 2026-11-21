import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { requireUserPage } from '$lib/server/guard';
import { getInterviewOwned } from '$lib/server/repo';
import { getPlan } from '$lib/server/billing';
import { FREE_LIMITS } from '$lib/server/config';

export const load: PageServerLoad = async (event) => {
  const user = requireUserPage(event);
  const interview = await getInterviewOwned(user.id, event.params.id);
  if (interview.status !== 'upcoming' && interview.status !== 'active') {
    redirect(303, `/dashboard/interviews/${interview.id}`);
  }
  const plan = await getPlan(user.id);
  return {
    user: { name: user.name },
    interview: {
      id: interview.id,
      name: interview.name,
      status: interview.status,
      durationMinutes: plan.premium ? interview.durationMinutes : Math.min(interview.durationMinutes, FREE_LIMITS.maxMinutes),
      hasJobDescription: !!interview.jobDescription,
      focus: interview.focus,
      savedTurns: interview.transcript?.length ?? 0
    },
    interviewer: { name: interview.agent.name, voice: interview.agent.voice }
  };
};
