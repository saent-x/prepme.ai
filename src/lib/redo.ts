import { z } from 'zod';
import type { Scorecard } from '$lib/interview-types';

/**
 * Redo an answer: after the scorecard, answer one question again and see the
 * new score next to the old one. Shared by the browser and the server.
 */

/** How long a redo may run. Two minutes is about the length of a good interview answer. */
export const REDO_SECONDS = 120;
/** Shorter than this is not an answer (a cough, a false start), so it is not scored. */
export const MIN_ANSWER_WORDS = 8;
export const MAX_ANSWER_CHARS = 6000;
/** Two minutes of speech is well under 2 MB in every format a browser records. */
export const MAX_AUDIO_BYTES = 4 * 1024 * 1024;
/** Redos the free plan includes. */
export const FREE_REDOS = 3;
/** Redos one person can run in a day on any plan, so a stuck script cannot run up a bill. */
export const REDOS_PER_DAY = 40;
/** Paid-for model calls behind redos in a day, counting attempts that failed and were never stored. */
export const REDO_CALLS_PER_DAY = 120;

/** What the scoring model returns for a redo. Every field is required for strict structured output. */
export const RedoModelSchema = z.object({
  score: z.number().int().min(0).max(100),
  feedback: z.string(),
  tip: z.string()
});
export type RedoModel = z.infer<typeof RedoModelSchema>;

/** A stored redo as the scorecard page shows it. */
export type Redo = {
  id: string;
  questionIndex: number;
  answer: string;
  previousScore: number;
  score: number;
  feedback: string;
  tip: string;
  spoken: boolean;
  seconds: number;
  createdAt: Date;
};

/** The scorecard marks each answer 1 to 5; the page shows it out of 100 like the skills. */
export const answerScore = (q: Pick<Scorecard['questions'][number], 'score'>) => q.score * 20;

export const clampScore = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** "+17", "-5" or "same": how a redo compares with the score it set out to beat. */
export function gainLabel(previous: number, now: number) {
  const d = now - previous;
  return d > 0 ? `+${d}` : d < 0 ? `−${Math.abs(d)}` : 'same';
}

export const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export type QuestionRedos = {
  /** Most recent attempt. */
  latest: Redo;
  /** Highest-scoring attempt (the earliest of equals). */
  best: Redo;
  attempts: number;
};

/** Group a scorecard's redos by question. */
export function redosByQuestion(redos: Redo[]): Map<number, QuestionRedos> {
  const out = new Map<number, QuestionRedos>();
  const oldestFirst = [...redos].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  for (const r of oldestFirst) {
    const q = out.get(r.questionIndex);
    if (!q) out.set(r.questionIndex, { latest: r, best: r, attempts: 1 });
    else {
      q.latest = r;
      if (r.score > q.best.score) q.best = r;
      q.attempts += 1;
    }
  }
  return out;
}

/**
 * The question to redo next: the weakest answer that has not been lifted to
 * a pass yet, or null when every answer is at 80 or above.
 */
export function nextToRedo(questions: Scorecard['questions'], redos: Redo[]): number | null {
  const done = redosByQuestion(redos);
  let pick: number | null = null;
  let lowest = 80;
  questions.forEach((q, n) => {
    const now = Math.max(answerScore(q), done.get(n)?.best.score ?? 0);
    if (now < lowest) {
      lowest = now;
      pick = n;
    }
  });
  return pick;
}

/**
 * A file name OpenAI accepts for a recording. Browsers record WebM (Chrome,
 * Firefox) or MP4 (Safari); the extension is how the API recognises the format.
 */
export function audioFileName(mime: string) {
  const type = mime.toLowerCase();
  const ext = type.includes('webm')
    ? 'webm'
    : type.includes('mp4') || type.includes('m4a') || type.includes('aac')
      ? 'mp4'
      : type.includes('ogg')
        ? 'ogg'
        : type.includes('wav')
          ? 'wav'
          : type.includes('mpeg') || type.includes('mp3')
            ? 'mp3'
            : null;
  return ext ? `answer.${ext}` : null;
}

/** m:ss for the recording clock. */
export const clock = (seconds: number) =>
  `${Math.floor(Math.max(0, seconds) / 60)}:${String(Math.max(0, seconds) % 60).padStart(2, '0')}`;
