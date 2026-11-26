import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { requireUser } from '$lib/server/guard';
import { getInterviewOwned } from '$lib/server/repo';
import { freeRedosLeft, redoAnswer } from '$lib/server/redo';
import { MAX_ANSWER_CHARS, MAX_AUDIO_BYTES, REDO_SECONDS } from '$lib/redo';

const Fields = z.object({
  question: z.coerce.number().int().min(0).max(200),
  // A little over the limit is allowed for: the recorder stops itself, then the upload starts.
  seconds: z.coerce
    .number()
    .int()
    .min(0)
    .max(REDO_SECONDS + 10)
    .catch(0),
  text: z.string().trim().max(MAX_ANSWER_CHARS).optional()
});

/** Answer one scorecard question again. Takes a recording (`audio`) or typed `text`. */
export const POST: RequestHandler = async (event) => {
  const user = requireUser(event);
  const form = await event.request.formData().catch(() => null);
  if (!form) error(400, { message: 'Send the answer as a form.' });

  const text = form.get('text');
  const parsed = Fields.safeParse({
    question: form.get('question'),
    seconds: form.get('seconds') ?? 0,
    text: typeof text === 'string' ? text : undefined
  });
  if (!parsed.success) error(400, { message: 'That answer could not be read. Please try again.' });

  const file = form.get('audio');
  const audio = file instanceof File && file.size > 0 ? file : null;
  if (audio && audio.size > MAX_AUDIO_BYTES)
    error(413, { message: 'That recording is too long. Keep it to two minutes.' });
  if (!audio && !parsed.data.text) error(400, { message: 'Record or type an answer first.' });

  const interview = await getInterviewOwned(user.id, event.params.id);
  const redo = await redoAnswer({
    userId: user.id,
    interview,
    questionIndex: parsed.data.question,
    audio,
    text: audio ? null : (parsed.data.text ?? null),
    seconds: parsed.data.seconds
  });
  return json(
    { redo, left: await freeRedosLeft(user.id) },
    { headers: { 'cache-control': 'no-store' } }
  );
};
