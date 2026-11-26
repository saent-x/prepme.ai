import { error } from '@sveltejs/kit';
import { and, count, eq, gte, inArray } from 'drizzle-orm';
import { zodTextFormat } from 'openai/helpers/zod';
import { db } from '$lib/db/index.server';
import { usageEvents } from '$lib/db/schema';
import {
  ANSWER_CALLS_PER_DAY,
  AnswerModelSchema,
  audioFileName,
  clampScore,
  countWords,
  MAX_ANSWER_CHARS,
  MAX_AUDIO_BYTES,
  MIN_ANSWER_WORDS,
  REDO_SECONDS,
  type AnswerModel
} from '$lib/redo';
import { z } from 'zod';
import { config } from './config';
import { openai, openaiDirect } from './openai';
import { quietly, recordAnswerUsage } from './usage';

/**
 * The part that "redo an answer" and the question bank share: take one answer,
 * spoken or typed, and have the model score it.
 */

const Fields = z.object({
  // A little over the limit is allowed for: the recorder stops itself, then the upload starts.
  seconds: z.coerce
    .number()
    .int()
    .min(0)
    .max(REDO_SECONDS + 10)
    .catch(0),
  text: z.string().trim().max(MAX_ANSWER_CHARS).optional()
});

export type AnswerInput = { audio: File | null; text: string | null; seconds: number };

/** Read an answer from a posted form: a recording (`audio`) or typed `text`. */
export function answerFromForm(form: FormData): AnswerInput {
  const text = form.get('text');
  const parsed = Fields.safeParse({
    seconds: form.get('seconds') ?? 0,
    text: typeof text === 'string' ? text : undefined
  });
  if (!parsed.success) error(400, { message: 'That answer could not be read. Please try again.' });
  const file = form.get('audio');
  const audio = file instanceof File && file.size > 0 ? file : null;
  if (audio && audio.size > MAX_AUDIO_BYTES)
    error(413, { message: 'That recording is too long. Keep it to two minutes.' });
  if (!audio && !parsed.data.text) error(400, { message: 'Record or type an answer first.' });
  return { audio, text: audio ? null : (parsed.data.text ?? null), seconds: parsed.data.seconds };
}

/**
 * Stops when someone has run too many paid-for calls in a day. Attempts that
 * failed (nothing heard, scoring down) are not stored anywhere else but were
 * still paid for, so this counts the usage rows behind them.
 */
export async function assertAnswerCallsLeft(userId: string) {
  const [calls] = await db
    .select({ n: count() })
    .from(usageEvents)
    .where(
      and(
        eq(usageEvents.userId, userId),
        inArray(usageEvents.kind, ['redo', 'bank']),
        gte(usageEvents.createdAt, new Date(Date.now() - 86_400_000))
      )
    );
  if ((calls?.n ?? 0) >= ANSWER_CALLS_PER_DAY) {
    error(429, { message: 'That is a lot of practice for one day. Come back tomorrow.' });
  }
}

/**
 * Turn the recording into text. Uses the direct client, like the live call's
 * key: the optional AI Gateway route is only set up for scoring and chat.
 */
async function transcribe(audio: File) {
  const name = audioFileName(audio.type);
  if (!name)
    error(415, { message: 'That recording format is not supported. Try typing your answer.' });
  const model = config.openai.transcribeModel();
  try {
    const res = await openaiDirect().audio.transcriptions.create({
      // Re-wrapped so the file name carries the format, whatever the browser called it.
      file: new File([await audio.arrayBuffer()], name, { type: audio.type }),
      model,
      language: 'en'
    });
    return { text: res.text.trim(), model, usage: res.usage as unknown };
  } catch (e) {
    console.error('[answer] transcription failed', e);
    error(502, { message: 'Could not hear that recording. Try again, or type your answer.' });
  }
}

/**
 * Transcribe (when spoken) and score one answer. What it used is recorded
 * under `id` whatever happens next: once OpenAI has answered, the money is spent.
 */
export async function scoreAnswer(opts: {
  userId: string;
  /** The id the attempt will be stored under; also the key of its usage rows. */
  id: string;
  kind: 'redo' | 'bank';
  interviewId: string | null;
  input: AnswerInput;
  prompt: (answer: string, spoken: boolean) => { system: string; user: string };
}): Promise<{ answer: string; spoken: boolean; seconds: number; result: AnswerModel }> {
  const heard = opts.input.audio ? await transcribe(opts.input.audio) : null;
  const model = config.openai.analysisModel();
  const cost = (usage: unknown) =>
    quietly(`${opts.kind} usage`, () =>
      recordAnswerUsage({
        userId: opts.userId,
        interviewId: opts.interviewId,
        kind: opts.kind,
        key: opts.id,
        scoring: { model, usage },
        transcription: heard
      })
    );

  const answer = (heard ? heard.text : (opts.input.text ?? '')).trim().slice(0, MAX_ANSWER_CHARS);
  if (countWords(answer) < MIN_ANSWER_WORDS) {
    if (heard) await cost(null);
    error(422, {
      message: heard
        ? 'We could not hear enough to score. Check your microphone and try again.'
        : 'Write a fuller answer, at least a couple of sentences.'
    });
  }

  const { system, user } = opts.prompt(answer, !!heard);
  let response;
  try {
    response = await openai().responses.parse({
      model,
      instructions: system,
      input: user,
      text: { format: zodTextFormat(AnswerModelSchema, 'scored_answer') }
    });
  } catch (e) {
    console.error('[answer] scoring failed', e);
    if (heard) await cost(null);
    error(502, { message: 'Could not score that answer. Please try again.' });
  }
  await cost(response.usage);

  const result = response.output_parsed;
  if (!result) error(502, { message: 'Could not score that answer. Please try again.' });
  return {
    answer,
    spoken: !!heard,
    seconds: heard ? opts.input.seconds : 0,
    result: {
      score: clampScore(result.score),
      feedback: result.feedback.trim(),
      tip: result.tip.trim(),
      title: result.title.replace(/\s+/g, ' ').trim().replace(/\.$/, '').slice(0, 80)
    }
  };
}
