import type { PageServerLoad } from './$types';
import { listJobs } from '$lib/server/jobs';

export const load: PageServerLoad = async ({ locals }) => {
  const jobs = await listJobs(locals.user!.id);
  return {
    jobs: jobs.map(({ job, readiness }) => ({
      job: { id: job.id, title: job.title, company: job.company, interviewDate: job.interviewDate },
      readiness: {
        score: readiness.score,
        practised: readiness.practised,
        nextRound: readiness.nextRound
      }
    }))
  };
};
