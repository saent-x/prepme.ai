import { fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/db/index.server';
import { jobTargets } from '$lib/db/schema';
import { DateSchema } from '$lib/jobs';
import { checkFit, getJobOwned, getJobWithReadiness, resolveCv } from '$lib/server/jobs';
import { listInterviews } from '$lib/server/repo';
import {
  addOwnQuestion,
  buildBank,
  freeBankAnswersLeft,
  keptSources,
  listBank,
  removeQuestion
} from '$lib/server/bank';

export const load: PageServerLoad = async ({ locals, params, depends, parent }) => {
  depends('app:job');
  const userId = locals.user!.id;
  // The layout has already looked the plan up.
  const premium = (await parent()).usage.plan.premium;
  const [{ job, readiness }, practice, bank, bankAnswersLeft] = await Promise.all([
    getJobWithReadiness(userId, params.id),
    listInterviews(userId, { targetId: params.id, pageSize: 20 }),
    listBank(userId, params.id, premium),
    freeBankAnswersLeft(userId, premium)
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
    moreInterviews: practice.total > practice.items.length,
    bank,
    bankAnswersLeft,
    /** Best answers already kept as stories ("answer:<id>"). */
    keptStories: await keptSources(
      userId,
      bank.questions.flatMap((q) => (q.best ? [`answer:${q.best.id}`] : []))
    )
  };
};

const OwnQuestion = z.string().trim().min(10, 'Write the question out in full').max(300);

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

  /** Build the question bank, or build it again. Answered questions are kept. */
  bank: async ({ locals, params }) => {
    const job = await getJobOwned(locals.user!.id, params.id);
    await buildBank(locals.user!.id, job);
    return { ok: true };
  },

  addQuestion: async ({ request, locals, params }) => {
    const parsed = OwnQuestion.safeParse((await request.formData()).get('question'));
    if (!parsed.success)
      return fail(400, { bankError: parsed.error.issues[0]?.message ?? 'Check the question' });
    const job = await getJobOwned(locals.user!.id, params.id);
    const problem = await addOwnQuestion(locals.user!.id, job, parsed.data);
    if (problem) return fail(400, { bankError: problem });
    return { ok: true };
  },

  removeQuestion: async ({ request, locals, params }) => {
    const id = z
      .string()
      .min(1)
      .max(40)
      .safeParse((await request.formData()).get('id'));
    if (!id.success) return fail(400, { bankError: 'That question could not be found.' });
    await getJobOwned(locals.user!.id, params.id);
    await removeQuestion(locals.user!.id, params.id, id.data);
    return { ok: true };
  },

  /** Practice interviews for the job are kept; they just stop counting towards it. */
  delete: async ({ locals, params }) => {
    await getJobOwned(locals.user!.id, params.id);
    await db.delete(jobTargets).where(mine(locals.user!.id, params.id));
    redirect(303, '/dashboard/jobs');
  }
};
