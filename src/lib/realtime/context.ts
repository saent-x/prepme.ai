import type { TranscriptEntry } from '$lib/interview-types';

/**
 * Helpers for calls where old turns are trimmed to keep long interviews cheap
 * (OPENAI_REALTIME_CONTEXT_TOKENS). When OpenAI drops the oldest part of the
 * call, the interviewer no longer knows what it asked there, so the browser
 * hands it a short list of the questions already covered.
 */

/** Below this much input a smaller reading is noise (an interrupted reply), not trimming. */
const MIN_INPUT_TOKENS = 2000;

/**
 * Each reply reads the whole call so far, so its input only grows. A clear
 * fall from one reply to the next means the oldest turns were just dropped.
 */
export function contextWasTrimmed(previousInputTokens: number, inputTokens: number) {
  return previousInputTokens >= MIN_INPUT_TOKENS && inputTokens < previousInputTokens * 0.8;
}

const clip = (s: string, max: number) => (s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s);

/** The questions in an interviewer turn: each sentence that ends in a question mark, in order. */
function questionsIn(text: string) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [];
  return sentences.filter((s) => s.trim().endsWith('?')).map((s) => clip(s.trim(), 200));
}

/**
 * A private note listing what the interviewer already asked, or null when it
 * has not asked anything yet. Kept short: it is re-read on every later turn.
 */
export function buildRecapNote(transcript: TranscriptEntry[], maxQuestions = 25) {
  const questions = transcript
    .filter((t) => t.speaker === 'interviewer')
    .flatMap((t) => questionsIn(t.text));
  if (!questions.length) return null;
  const recent = questions.slice(-maxQuestions);
  return [
    'Note for you only, do not read it out or mention it. The oldest part of this call is no longer in your memory. Questions you have already asked, oldest first:',
    ...recent.map((q, i) => `${i + 1}. ${q}`),
    'Do not ask these again. Carry on from the current topic.'
  ].join('\n');
}
