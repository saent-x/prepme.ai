import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/db/index.server';
import { jobTargets } from '$lib/db/schema';
import { DateSchema, FitSchema, RoundsSchema } from '$lib/jobs';
import { MIN_JOB_TEXT } from '$lib/job-parse';
import { checkFit, countJobs, lastCv, MAX_JOBS, resolveCv } from '$lib/server/jobs';

export const load: PageServerLoad = async ({ locals }) => ({
  lastCv: await lastCv(locals.user!.id)
});

const Cv = {
  cvText: z.string().trim().max(25_000).optional(),
  cvName: z.string().trim().max(120).optional(),
  /** Reuse the CV from one of the user's jobs ("job:<id>") or interviews. */
  cvFrom: z.string().max(70).optional()
};
const advert = z
  .string()
  .trim()
  .min(MIN_JOB_TEXT, 'Paste the whole advert so there is enough to read.')
  .max(15_000, 'That advert is too long. Paste just the job description.');

const CheckForm = z.object({ advert, ...Cv });

/** A fit check the browser got from `check` and sends back with the save, so the model is not asked twice. */
const CheckedSchema = z.object({ fit: FitSchema.nullable(), rounds: RoundsSchema });

const SaveForm = z.object({
  advert,
  ...Cv,
  title: z.string().trim().max(90).optional(),
  company: z.string().trim().max(60).optional(),
  location: z.string().trim().max(60).optional(),
  interviewDate: DateSchema.or(z.literal('')).optional(),
  checked: z.string().max(20_000).optional()
});

const firstIssue = (e: z.ZodError) => e.issues[0]?.message ?? 'Check the form';

function parseChecked(raw: string | undefined) {
  if (!raw) return null;
  try {
    const parsed = CheckedSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export const actions: Actions = {
  /** Read the advert against the CV and hand the result back to the page. Nothing is saved yet. */
  check: async ({ request, locals }) => {
    const user = locals.user!;
    const parsed = CheckForm.safeParse(Object.fromEntries(await request.formData()));
    if (!parsed.success) return fail(400, { error: firstIssue(parsed.error) });
    const cv = await resolveCv(user.id, parsed.data);
    return { result: await checkFit(user.id, parsed.data.advert, cv?.text ?? null) };
  },

  save: async ({ request, locals }) => {
    const user = locals.user!;
    const parsed = SaveForm.safeParse(Object.fromEntries(await request.formData()));
    if (!parsed.success) return fail(400, { error: firstIssue(parsed.error) });
    const f = parsed.data;
    if ((await countJobs(user.id)) >= MAX_JOBS) {
      return fail(403, {
        error: `You can keep up to ${MAX_JOBS} jobs. Delete one you no longer need first.`
      });
    }

    const cv = await resolveCv(user.id, f);
    // Saving without checking first (or after changing the advert) runs the check now.
    const checked = parseChecked(f.checked);
    const read = checked ? null : await checkFit(user.id, f.advert, cv?.text ?? null);
    const fit = checked?.fit ?? read?.fit ?? null;
    const rounds = checked?.rounds ?? read!.rounds;

    const [job] = await db
      .insert(jobTargets)
      .values({
        userId: user.id,
        title: f.title || read?.title || 'Untitled job',
        company: f.company ?? read?.company ?? '',
        location: f.location ?? read?.location ?? '',
        advert: f.advert,
        cvText: cv?.text ?? null,
        cvName: cv?.name ?? null,
        interviewDate: f.interviewDate || null,
        // Without a CV there is nothing to compare, whatever the browser sent.
        fit: cv ? fit : null,
        rounds
      })
      .returning({ id: jobTargets.id });
    redirect(303, `/dashboard/jobs/${job.id}`);
  }
};
