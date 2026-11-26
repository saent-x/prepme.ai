import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireUser } from '$lib/server/guard';
import { answerFromForm } from '$lib/server/answers';
import { answerBankQuestion, freeBankAnswersLeft } from '$lib/server/bank';
import { getPlan } from '$lib/server/billing';
import { getJobOwned } from '$lib/server/jobs';

/** Practise one question from a job's bank. Takes a recording (`audio`) or typed `text`. */
export const POST: RequestHandler = async (event) => {
  const user = requireUser(event);
  const form = await event.request.formData().catch(() => null);
  if (!form) error(400, { message: 'Send the answer as a form.' });
  const input = answerFromForm(form);

  const [job, plan] = await Promise.all([getJobOwned(user.id, event.params.id), getPlan(user.id)]);
  const result = await answerBankQuestion({
    userId: user.id,
    premium: plan.premium,
    job,
    questionId: event.params.question,
    input
  });
  return json(
    { result, left: await freeBankAnswersLeft(user.id, plan.premium) },
    { headers: { 'cache-control': 'no-store' } }
  );
};
