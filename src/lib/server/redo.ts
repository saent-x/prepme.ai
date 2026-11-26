import { error } from '@sveltejs/kit';
import { and, asc, count, eq, gte } from 'drizzle-orm';
import { zodTextFormat } from 'openai/helpers/zod';
import { db } from '$lib/db/index.server';
import { answerRedos, usageEvents } from '$lib/db/schema';
import {
  answerScore,
  audioFileName,
  clampScore,
  countWords,
  FREE_REDOS,
  MAX_ANSWER_CHARS,
  MIN_ANSWER_WORDS,
  REDO_CALLS_PER_DAY,
  RedoModelSchema,
  REDOS_PER_DAY,
  type Redo
} from '$lib/redo';
import { getPlan } from './billing';
import { config } from './config';
import { practisedRound } from './interviews';
import { openai, openaiDirect } from './openai';
import { buildRedoPrompt } from './prompts';
import type { InterviewWithAgent } from './repo';
import { quietly, recordRedoUsage } from './usage';

const columns = {
  id: answerRedos.id,
  questionIndex: answerRedos.questionIndex,
  answer: answerRedos.answer,
  previousScore: answerRedos.previousScore,
  score: answerRedos.score,
  feedback: answerRedos.feedback,
  tip: answerRedos.tip,
  spoken: answerRedos.spoken,
  seconds: answerRedos.seconds,
  createdAt: answerRedos.createdAt
};

/** Every redo of an interview's answers, oldest first. */
export function listRedos(interviewId: string): Promise<Redo[]> {
  return db
    .select(columns)
    .from(answerRedos)
    .where(eq(answerRedos.interviewId, interviewId))
    .orderBy(asc(answerRedos.createdAt));
}

async function redoCount(userId: string, since?: Date) {
  const [row] = await db
    .select({ n: count() })
    .from(answerRedos)
    .where(
      and(eq(answerRedos.userId, userId), since ? gte(answerRedos.createdAt, since) : undefined)
    );
  return row?.n ?? 0;
}

/**
 * How many redos this person has left on the free plan, or null when their
 * plan has no limit. Shown on the scorecard so the limit is never a surprise.
 * Pass `premium` when the plan is already known, to save a second lookup.
 */
export async function freeRedosLeft(userId: string, premium?: boolean): Promise<number | null> {
  if (premium ?? (await getPlan(userId)).premium) return null;
  return Math.max(0, FREE_REDOS - (await redoCount(userId)));
}

/** Stops with a message the page can show when no redo is allowed right now. */
async function assertCanRedo(userId: string) {
  if ((await freeRedosLeft(userId)) === 0) {
    error(403, {
      message: `The free plan includes ${FREE_REDOS} answer redos. Upgrade to keep going.`,
      code: 'LIMIT'
    });
  }
  const dayAgo = new Date(Date.now() - 86_400_000);
  // Attempts that failed (nothing heard, scoring down) are not stored as redos but were
  // still paid for, so the calls behind them are counted as well.
  const [stored, [calls]] = await Promise.all([
    redoCount(userId, dayAgo),
    db
      .select({ n: count() })
      .from(usageEvents)
      .where(
        and(
          eq(usageEvents.userId, userId),
          eq(usageEvents.kind, 'redo'),
          gte(usageEvents.createdAt, dayAgo)
        )
      )
  ]);
  if (stored >= REDOS_PER_DAY || (calls?.n ?? 0) >= REDO_CALLS_PER_DAY) {
    error(429, { message: 'That is a lot of redos for one day. Come back tomorrow.' });
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
    console.error('[redo] transcription failed', e);
    error(502, { message: 'Could not hear that recording. Try again, or type your answer.' });
  }
}

/**
 * Score one more go at a scorecard question and store it. The answer comes
 * either as a recording or as typed text.
 */
export async function redoAnswer(opts: {
  userId: string;
  interview: InterviewWithAgent;
  questionIndex: number;
  audio: File | null;
  text: string | null;
  seconds: number;
}): Promise<Redo> {
  const { userId, interview, questionIndex } = opts;
  const q =
    interview.status === 'completed' ? interview.scorecard?.questions[questionIndex] : undefined;
  if (!q) error(404, { message: 'That question is not on this scorecard.' });
  await assertCanRedo(userId);

  const heard = opts.audio ? await transcribe(opts.audio) : null;
  const model = config.openai.analysisModel();
  // Costed whatever happens next: once OpenAI has answered, the money is spent.
  const cost = (key: string, usage: unknown) =>
    quietly('redo usage', () =>
      recordRedoUsage({
        userId,
        interviewId: interview.id,
        redoId: key,
        scoring: { model, usage },
        transcription: heard
      })
    );

  const answer = (heard ? heard.text : (opts.text ?? '')).trim().slice(0, MAX_ANSWER_CHARS);
  if (countWords(answer) < MIN_ANSWER_WORDS) {
    if (heard) await cost(crypto.randomUUID(), null);
    error(422, {
      message: heard
        ? 'We could not hear enough to score. Check your microphone and try again.'
        : 'Write a fuller answer, at least a couple of sentences.'
    });
  }

  const { system, user } = buildRedoPrompt({
    interview,
    round: await practisedRound(interview),
    question: q,
    answer,
    spoken: !!heard
  });
  let response;
  try {
    response = await openai().responses.parse({
      model,
      instructions: system,
      input: user,
      text: { format: zodTextFormat(RedoModelSchema, 'answer_redo') }
    });
  } catch (e) {
    console.error('[redo] scoring failed', e);
    if (heard) await cost(crypto.randomUUID(), null);
    error(502, { message: 'Could not score that answer. Please try again.' });
  }

  const result = response.output_parsed;
  if (!result) {
    await cost(response.id, response.usage);
    error(502, { message: 'Could not score that answer. Please try again.' });
  }

  const [saved] = await db
    .insert(answerRedos)
    .values({
      userId,
      interviewId: interview.id,
      questionIndex,
      question: q.question,
      answer,
      previousScore: answerScore(q),
      score: clampScore(result.score),
      feedback: result.feedback.trim(),
      tip: result.tip.trim(),
      spoken: !!heard,
      seconds: heard ? opts.seconds : 0
    })
    .returning(columns);
  await cost(saved.id, response.usage);
  return saved;
}
