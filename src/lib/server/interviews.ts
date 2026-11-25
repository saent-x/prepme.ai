import { error } from '@sveltejs/kit';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '$lib/db/index.server';
import { interviews } from '$lib/db/schema';
import type { TranscriptEntry } from '$lib/interview-types';
import { getInterviewOwned } from './repo';
import { analyseInterview, createRealtimeClientSecret } from './openai';
import { buildRealtimeInstructions } from './prompts';
import { getPlan } from './billing';
import { callMinutes, RESUME_GRACE_MINUTES } from './config';

/** Interviews in these states can (re)start a live session. */
const JOINABLE = ['upcoming', 'active'] as const;

/** Under this many candidate words there is nothing meaningful to score. */
const MIN_CANDIDATE_WORDS = 25;

export async function startRealtimeSession(user: { id: string; name: string }, interviewId: string) {
  const interview = await getInterviewOwned(user.id, interviewId);
  if (!(JOINABLE as readonly string[]).includes(interview.status)) {
    error(409, { message: 'This interview has already finished.' });
  }

  const plan = await getPlan(user.id);
  // The plan sets the length. Older interviews saved with a longer one are capped too.
  const durationMinutes = Math.min(interview.durationMinutes, callMinutes(plan.premium));
  if (interview.startedAt) {
    const overMs = Date.now() - interview.startedAt.getTime() - (durationMinutes + RESUME_GRACE_MINUTES) * 60_000;
    if (overMs > 0) error(409, { message: "Time is up for this interview. End it to get your score." });
  }

  const previous = interview.transcript ?? [];
  const instructions = buildRealtimeInstructions({
    agent: interview.agent,
    interview: { ...interview, durationMinutes },
    candidateName: user.name.split(' ')[0] || user.name,
    previousTranscript: previous.length ? previous : undefined
  });

  const secret = await createRealtimeClientSecret({
    instructions,
    voice: interview.agent.voice
  });

  await db
    .update(interviews)
    .set({
      status: 'active',
      startedAt: interview.startedAt ?? new Date(),
      sessionCount: sql`${interviews.sessionCount} + 1`,
      realtimeModel: secret.model,
      analysisError: null
    })
    .where(eq(interviews.id, interview.id));

  const startedAt = interview.startedAt ?? new Date();
  return {
    clientSecret: secret.value,
    model: secret.model,
    expiresAt: secret.expiresAt,
    durationMinutes,
    startedAt: startedAt.toISOString(),
    resumed: previous.length > 0,
    transcript: previous
  };
}

/**
 * Save the live transcript. The browser sends the whole list each time, so this
 * is idempotent and a lost request is simply covered by the next one.
 */
export async function saveTranscript(userId: string, interviewId: string, transcript: TranscriptEntry[]) {
  const [row] = await db
    .update(interviews)
    .set({ transcript })
    .where(
      and(
        eq(interviews.id, interviewId),
        eq(interviews.userId, userId),
        inArray(interviews.status, ['active', 'upcoming'])
      )
    )
    .returning({ id: interviews.id });
  if (!row) error(409, { message: 'This interview is no longer accepting transcript updates.' });
}

/** End the call: store the final transcript, then score it. */
export async function completeInterview(
  user: { id: string; name: string },
  interviewId: string,
  transcript: TranscriptEntry[] | null
) {
  const interview = await getInterviewOwned(user.id, interviewId);
  if (interview.status === 'completed') return { status: 'completed' as const };
  if (interview.status === 'cancelled') error(409, { message: 'This interview was cancelled.' });

  // Never let a shorter (e.g. stale tab) transcript overwrite a longer saved one.
  const saved = interview.transcript ?? [];
  const finalTranscript = transcript && transcript.length >= saved.length ? transcript : saved;

  await db
    .update(interviews)
    .set({
      status: 'processing',
      transcript: finalTranscript,
      endedAt: interview.endedAt ?? new Date(),
      analysisError: null
    })
    .where(eq(interviews.id, interview.id));

  return analyse(user, interviewId);
}

/** Run (or re-run) the scorecard for an interview in the processing state. */
export async function analyse(user: { id: string; name: string }, interviewId: string) {
  const interview = await getInterviewOwned(user.id, interviewId);
  if (interview.status === 'completed' && interview.scorecard) return { status: 'completed' as const };
  if (interview.status !== 'processing' && interview.status !== 'completed') {
    error(409, { message: 'Finish the interview before analysing it.' });
  }

  const transcript = interview.transcript ?? [];
  const candidateWords = transcript
    .filter((t) => t.speaker === 'candidate')
    .reduce((n, t) => n + t.text.split(/\s+/).filter(Boolean).length, 0);

  if (candidateWords < MIN_CANDIDATE_WORDS) {
    await db
      .update(interviews)
      .set({
        status: 'completed',
        scorecard: null,
        overallScore: null,
        summary:
          'This interview was too short to score. Try again and answer at least a couple of questions in full.'
      })
      .where(eq(interviews.id, interview.id));
    return { status: 'completed' as const };
  }

  try {
    const { scorecard, summary } = await analyseInterview({
      agent: interview.agent,
      interview,
      candidateName: user.name.split(' ')[0] || user.name,
      transcript
    });
    await db
      .update(interviews)
      .set({
        status: 'completed',
        scorecard,
        overallScore: scorecard.overall_score,
        summary,
        analysisError: null
      })
      .where(eq(interviews.id, interview.id));
    return { status: 'completed' as const };
  } catch (e) {
    console.error('[analysis] failed for interview', interviewId, e);
    const message = e instanceof Error ? e.message : 'Unknown error';
    await db
      .update(interviews)
      .set({ analysisError: message.slice(0, 500) })
      .where(eq(interviews.id, interview.id));
    error(502, { message: 'Scoring failed. Your transcript is saved, so you can retry.' });
  }
}
