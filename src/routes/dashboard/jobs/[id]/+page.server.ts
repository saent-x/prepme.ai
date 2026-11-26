import { fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/db/index.server';
import { jobTargets } from '$lib/db/schema';
import { DateSchema } from '$lib/jobs';
import { checkFit, getJobOwned, getJobWithReadiness, resolveCv } from '$lib/server/jobs';
import { listInterviews } from '$lib/server/repo';

export const load: PageServerLoad = async ({ locals, params }) => {
  const userId = locals.user!.id;
  const [{ job, readiness }, practice] = await Promise.all([
    getJobWithReadiness(userId, params.id),
    listInterviews(userId, { targetId: params.id, pageSize: 20 })
  ]);
  return {
    // The CV's text stays on the server; the page only needs its name.
    job: {
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      advert: job.advert,
      cvName: job.cvName,
      interviewDate: job.interviewDate,
      fit: job.fit
    },
    readiness,
    interviews: practice.items,
    moreInterviews: practice.total > practice.items.length
  };
};

const Details = z.object({
  title: z.string().trim().min(1, 'Give the job a title').max(90),
  company: z.string().trim().max(60),
  location: z.string().trim().max(60),
  interviewDate: DateSchema.or(z.literal(''))
});

const Cv = z.object({
  cvText: z.string().trim().max(25_000).optional(),
  cvName: z.string().trim().max(120).optional(),
  cvFrom: z.string().max(70).optional()
});

const mine = (userId: string, id: string) =>
  and(eq(jobTargets.id, id), eq(jobTargets.userId, userId));

export const actions: Actions = {
  update: async ({ request, locals, params }) => {
    const parsed = Details.safeParse(Object.fromEntries(await request.formData()));
    if (!parsed.success)
      return fail(400, { error: parsed.error.issues[0]?.message ?? 'Check the form' });
    const { interviewDate, ...rest } = parsed.data;
    // 404 for a job that is not theirs, rather than a save that quietly changes nothing.
    await getJobOwned(locals.user!.id, params.id);
    await db
      .update(jobTargets)
      .set({ ...rest, interviewDate: interviewDate || null })
      .where(mine(locals.user!.id, params.id));
    return { ok: true };
  },

  /** Run the fit check again, with a new CV when one is given. The planned rounds stay as they are. */
  recheck: async ({ request, locals, params }) => {
    const user = locals.user!;
    const parsed = Cv.safeParse(Object.fromEntries(await request.formData()));
    if (!parsed.success) return fail(400, { error: 'That CV could not be used.' });
    const job = await getJobOwned(user.id, params.id);
    const fresh = await resolveCv(user.id, parsed.data);
    const cv = fresh ?? (job.cvText ? { text: job.cvText, name: job.cvName ?? 'CV' } : null);
    if (!cv) return fail(400, { error: 'Add your CV first.' });
    const { fit } = await checkFit(user.id, job.advert, cv.text);
    await db
      .update(jobTargets)
      .set({ cvText: cv.text, cvName: cv.name, fit })
      .where(mine(user.id, job.id));
    return { ok: true };
  },

  /** Practice interviews for the job are kept; they just stop counting towards it. */
  delete: async ({ locals, params }) => {
    await getJobOwned(locals.user!.id, params.id);
    await db.delete(jobTargets).where(mine(locals.user!.id, params.id));
    redirect(303, '/dashboard/jobs');
  }
};
