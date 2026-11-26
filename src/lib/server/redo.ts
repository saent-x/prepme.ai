import { error } from '@sveltejs/kit';
import { and, asc, count, eq, gte } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '$lib/db/index.server';
import { answerRedos } from '$lib/db/schema';
import { answerScore, FREE_REDOS, REDOS_PER_DAY, type Redo } from '$lib/redo';
import { assertAnswerCallsLeft, scoreAnswer, type AnswerInput } from './answers';
import { getPlan } from './billing';
import { practisedRound } from './interviews';
import { buildRedoPrompt } from './prompts';
import type { InterviewWithAgent } from './repo';

const columns = {
  id: answerRedos.id,
  questionIndex: answerRedos.questionIndex,
  answer: answerRedos.answer,
  previousScore: answerRedos.previousScore,
  score: answerRedos.score,
  feedback: answerRedos.feedback,
  tip: answerRedos.tip,
  title: answerRedos.title,
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
  if ((await redoCount(userId, new Date(Date.now() - 86_400_000))) >= REDOS_PER_DAY) {
    error(429, { message: 'That is a lot of redos for one day. Come back tomorrow.' });
  }
  await assertAnswerCallsLeft(userId);
}

/**
 * Score one more go at a scorecard question and store it. The answer comes
 * either as a recording or as typed text.
 */
export async function redoAnswer(opts: {
  userId: string;
  interview: InterviewWithAgent;
  questionIndex: number;
  input: AnswerInput;
}): Promise<Redo> {
  const { userId, interview, questionIndex } = opts;
  const q =
    interview.status === 'completed' ? interview.scorecard?.questions[questionIndex] : undefined;
  if (!q) error(404, { message: 'That question is not on this scorecard.' });
  await assertCanRedo(userId);

  const round = await practisedRound(interview);
  const id = nanoid();
  const scored = await scoreAnswer({
    userId,
    id,
    kind: 'redo',
    interviewId: interview.id,
    input: opts.input,
    prompt: (answer, spoken) => buildRedoPrompt({ interview, round, question: q, answer, spoken })
  });

  const [saved] = await db
    .insert(answerRedos)
    .values({
      id,
      userId,
      interviewId: interview.id,
      questionIndex,
      question: q.question,
      answer: scored.answer,
      previousScore: answerScore(q),
      ...scored.result,
      spoken: scored.spoken,
      seconds: scored.seconds
    })
    .returning(columns);
  return saved;
}
