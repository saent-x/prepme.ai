import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { requireUser } from '$lib/server/guard';
import { getInterviewOwned } from '$lib/server/repo';
import { answerFromForm } from '$lib/server/answers';
import { freeRedosLeft, redoAnswer } from '$lib/server/redo';

const Question = z.coerce.number().int().min(0).max(200);

/** Answer one scorecard question again. Takes a recording (`audio`) or typed `text`. */
export const POST: RequestHandler = async (event) => {
  const user = requireUser(event);
  const form = await event.request.formData().catch(() => null);
  if (!form) error(400, { message: 'Send the answer as a form.' });
  const question = Question.safeParse(form.get('question'));
  if (!question.success)
    error(400, { message: 'That answer could not be read. Please try again.' });
  const input = answerFromForm(form);

  const interview = await getInterviewOwned(user.id, event.params.id);
  const redo = await redoAnswer({
    userId: user.id,
    interview,
    questionIndex: question.data,
    input
  });
  return json(
    { result: redo, left: await freeRedosLeft(user.id) },
    { headers: { 'cache-control': 'no-store' } }
  );
};
