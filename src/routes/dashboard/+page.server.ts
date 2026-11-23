import type { PageServerLoad } from './$types';
import { getProgress, listInterviewers, listInterviews } from '$lib/server/repo';

export const load: PageServerLoad = async ({ locals }) => {
  const userId = locals.user!.id;
  const [progress, recent, active, interviewers] = await Promise.all([
    getProgress(userId),
    listInterviews(userId, { pageSize: 8 }),
    listInterviews(userId, { status: 'active', pageSize: 3 }),
    listInterviewers(userId)
  ]);
  return {
    progress,
    recent: recent.items,
    active: active.items,
    interviewers: interviewers.slice(0, 12).map((i) => ({ id: i.id, name: i.name, interviewCount: i.interviewCount }))
  };
};
