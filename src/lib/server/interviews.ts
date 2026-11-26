import { error } from '@sveltejs/kit';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '$lib/db/index.server';
import { interviews } from '$lib/db/schema';
import type { TranscriptEntry } from '$lib/interview-types';
import { getInterviewOwned } from './repo';
import { analyseInterview, createRealtimeClientSecret } from './openai';
import { buildRealtimeInstructions } from './prompts';
import { getPlan } from './billing';
import { callMinutes } from './config';
import { quietly, recordTextUsage, recordVoiceUsage } from './usage';
import type { VoiceUsage } from '$lib/usage';

/** Interviews in these states can (re)start a live session. */
const JOINABLE = ['upcoming', 'active'] as const;

/** Under this many candidate words there is nothing meaningful to score. */
const MIN_CANDIDATE_WORDS = 25;

/**
 * How long past its set length an interview can still open a live session.
 * Covers the client's own wrap-up window (it hangs up 90 s after time is up)
 * plus a reconnect, but stops anyone minting fresh realtime keys for an
 * interview whose time ran out long ago.
 */
const SESSION_GRACE_MS = 5 * 60_000;

/** Fresh realtime keys one interview can mint (first start + reconnects + reloads). */
const MAX_SESSIONS_PER_INTERVIEW = 15;

export async function startRealtimeSession(user: { id: string; name: string }, interviewId: string) {
  const interview = await getInterviewOwned(user.id, interviewId);
  if (!(JOINABLE as readonly string[]).includes(interview.status)) {
    error(409, { message: 'This interview has already finished.' });
  }

  const plan = await getPlan(user.id);
  // The plan sets the length. Older interviews saved with a longer one are capped too.
  const durationMinutes = Math.min(interview.durationMinutes, callMinutes(plan.premium));

  // The client keeps time, but the server is what stops a call from running on:
  // without this, reloading the page (or calling this endpoint directly) mints a
  // fresh OpenAI session for an interview whose time ran out long ago.
  const now = Date.now();
  const elapsedMs = interview.startedAt ? now - interview.startedAt.getTime() : 0;
  if (elapsedMs > durationMinutes * 60_000 + SESSION_GRACE_MS) {
    error(409, { message: "This interview's time is up. End it to get your score." });
  }
  if (interview.sessionCount >= MAX_SESSIONS_PER_INTERVIEW) {
    error(429, { message: 'This interview has reconnected too many times. End it to get your score.' });
  }

  const previous = interview.transcript ?? [];
  const instructions = buildRealtimeInstructions({
    agent: interview.agent,
    interview: { ...interview, durationMinutes },
    candidateName: user.name.split(' ')[0] || user.name,
    previousTranscript: previous.length ? previous : undefined,
    minutesLeft: interview.startedAt
      ? Math.max(0, Math.round((durationMinutes * 60_000 - elapsedMs) / 60_000))
      : undefined
  });

  const secret = await createRealtimeClientSecret({
    instructions,
    voice: interview.agent.voice
  });

  // The session number comes from the update itself, so two starts at once get different numbers.
  const [claimed] = await db
    .update(interviews)
    .set({
      status: 'active',
      startedAt: interview.startedAt ?? new Date(),
      sessionCount: sql`${interviews.sessionCount} + 1`,
      realtimeModel: secret.model,
      analysisError: null
    })
    .where(eq(interviews.id, interview.id))
    .returning({ session: interviews.sessionCount });
  // Deleted while the key was being made.
  if (!claimed) error(404, { message: 'Interview not found' });

  const startedAt = interview.startedAt ?? new Date();
  return {
    clientSecret: secret.value,
    model: secret.model,
    expiresAt: secret.expiresAt,
    durationMinutes,
    startedAt: startedAt.toISOString(),
    resumed: previous.length > 0,
    transcript: previous,
    /** Which live session of this interview the key is for; the browser tags its usage report with it. */
    session: claimed.session,
    /** Old turns are being trimmed on this call, so the browser keeps the interviewer's list of asked questions fresh. */
    trimming: secret.contextTokens > 0
  };
}

/**
 * Save the live transcript. The browser sends the whole list each time, so this
 * is idempotent and a lost request is simply covered by the next one. The usage
 * so far rides along now and then, so a call that is never ended is still costed.
 */
export async function saveTranscript(
  userId: string,
  interviewId: string,
  transcript: TranscriptEntry[],
  usage: VoiceUsage[] | null = null
) {
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
    .returning({
      id: interviews.id,
      realtimeModel: interviews.realtimeModel,
      sessionCount: interviews.sessionCount
    });
  if (!row) error(409, { message: 'This interview is no longer accepting transcript updates.' });
  if (usage?.length) {
    await quietly('voice usage', () =>
      recordVoiceUsage({
        userId,
        interviewId,
        model: row.realtimeModel,
        sessions: row.sessionCount,
        reports: usage
      })
    );
  }
}

/** End the call: store the final transcript, then score it. */
export async function completeInterview(
  user: { id: string; name: string },
  interviewId: string,
  transcript: TranscriptEntry[] | null,
  usage: VoiceUsage[] | null = null
) {
  const interview = await getInterviewOwned(user.id, interviewId);
  // Before anything can turn the request away: the call happened, so its cost counts.
  if (usage?.length) {
    await quietly('voice usage', () =>
      recordVoiceUsage({
        userId: user.id,
        interviewId,
        model: interview.realtimeModel,
        sessions: interview.sessionCount,
        reports: usage
      })
    );
  }
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
      transcript,
      onUsage: (usage) =>
        quietly('scoring usage', () =>
          recordTextUsage({ userId: user.id, interviewId, kind: 'scoring', ...usage })
        )
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
