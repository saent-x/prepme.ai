import type { PageServerLoad } from './$types';
import { listInterviewers, listInterviews } from '$lib/server/repo';
import { INTERVIEW_STATUSES, type InterviewStatus } from '$lib/db/schema';

export const load: PageServerLoad = async ({ locals, url }) => {
  const userId = locals.user!.id;
  const statusParam = url.searchParams.get('status');
  const status = (INTERVIEW_STATUSES as readonly string[]).includes(statusParam ?? '')
    ? (statusParam as InterviewStatus)
    : null;
  const search = url.searchParams.get('q')?.slice(0, 100) || null;
  const agentId = url.searchParams.get('interviewer') || null;
  const page = Number(url.searchParams.get('page')) || 1;

  const [result, interviewers] = await Promise.all([
    listInterviews(userId, { search, status, agentId, page, pageSize: 12 }),
    listInterviewers(userId)
  ]);
  return {
    result,
    interviewers: interviewers.map((i) => ({ id: i.id, name: i.name })),
    filters: { q: search ?? '', status, interviewer: agentId }
  };
};
