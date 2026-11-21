import type { PageServerLoad } from './$types';
import { listInterviewers } from '$lib/server/repo';

export const load: PageServerLoad = async ({ locals }) => ({
  interviewers: await listInterviewers(locals.user!.id)
});
