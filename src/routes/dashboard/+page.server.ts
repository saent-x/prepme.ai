import type { PageServerLoad } from './$types';
import { getProgress, listInterviews } from '$lib/server/repo';

export const load: PageServerLoad = async ({ locals }) => {
  const userId = locals.user!.id;
  const [progress, recent, active] = await Promise.all([
    getProgress(userId),
    listInterviews(userId, { pageSize: 5 }),
    listInterviews(userId, { status: 'active', pageSize: 3 })
  ]);
  return { progress, recent: recent.items, active: active.items };
};
