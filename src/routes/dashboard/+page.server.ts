import type { PageServerLoad } from './$types';
import { agentStyle } from '$lib/interviewer-brief';
import { getProgress, listInterviewers, listInterviews } from '$lib/server/repo';
import { listJobs } from '$lib/server/jobs';

export const load: PageServerLoad = async ({ locals }) => {
  const userId = locals.user!.id;
  const [progress, recent, active, interviewers, jobs] = await Promise.all([
    getProgress(userId),
    listInterviews(userId, { pageSize: 8 }),
    listInterviews(userId, { status: 'active', pageSize: 3 }),
    listInterviewers(userId),
    listJobs(userId)
  ]);
  return {
    progress,
    recent: recent.items,
    active: active.items,
    // Soonest interview first; Home shows the top few.
    jobs: jobs.slice(0, 4).map(({ job, readiness }) => ({
      job: { id: job.id, title: job.title, company: job.company, interviewDate: job.interviewDate },
      readiness: { score: readiness.score, practised: readiness.practised, nextRound: readiness.nextRound }
    })),
    jobCount: jobs.length,
    interviewers: interviewers
      .slice(0, 6)
      .map((i) => ({ id: i.id, name: i.name, interviewCount: i.interviewCount, style: agentStyle(i.instructions) }))
  };
};
