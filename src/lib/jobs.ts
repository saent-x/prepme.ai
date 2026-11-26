import { z } from 'zod';
import { COMPETENCIES, COMPETENCY_LABELS } from './interview-types';
import { parseJobBasic } from './job-parse';

/**
 * Job targets: the job someone is preparing for, how well their CV fits it,
 * the rounds to practise and how ready they are. Everything here is plain
 * logic shared by the server and the screens.
 */

// ---------------------------------------------------------------------------
// Rounds
// ---------------------------------------------------------------------------

export const RoundSchema = z.object({
  id: z.string().min(1).max(40),
  /** e.g. "Hiring manager". */
  name: z.string().trim().min(1).max(60),
  /** What the round is about, in a few words. The interviewer is told this. */
  focus: z.string().trim().max(200)
});
export type Round = z.infer<typeof RoundSchema>;
export const RoundsSchema = z.array(RoundSchema).min(1).max(6);

/** The rounds most hiring processes have, used when a model has not planned them. */
export const DEFAULT_ROUNDS: Round[] = [
  {
    id: 'r1',
    name: 'Recruiter screen',
    focus: 'Your background, why this job and this employer, pay and practical details'
  },
  {
    id: 'r2',
    name: 'Hiring manager',
    focus: 'Your experience against what the job asks for, and how you work with others'
  },
  {
    id: 'r3',
    name: 'Skills round',
    focus: 'The core skills of the job, worked through in depth with real examples'
  }
];

/** Give planned rounds stable ids (r1, r2, …) and tidy their text. */
export function toRounds(planned: { name: string; focus: string }[]): Round[] {
  const rounds = planned
    .map((r) => ({ name: r.name.trim().slice(0, 60), focus: r.focus.trim().slice(0, 200) }))
    .filter((r) => r.name)
    .slice(0, 6)
    .map((r, i) => ({ id: `r${i + 1}`, ...r }));
  return rounds.length ? rounds : DEFAULT_ROUNDS;
}

// ---------------------------------------------------------------------------
// Fit check
// ---------------------------------------------------------------------------

export const AskSchema = z.object({
  /** One thing the advert asks for, in 1 to 4 words. */
  ask: z.string().trim().min(1).max(60),
  /** The CV shows it. */
  covered: z.boolean(),
  /** Where the CV shows it, or what is missing. One short sentence. */
  note: z.string().trim().max(200)
});
export type Ask = z.infer<typeof AskSchema>;

/** How a CV matches an advert, as stored on the job. */
export const FitSchema = z.object({
  score: z.number().int().min(0).max(100),
  asks: z.array(AskSchema).max(14)
});
export type Fit = z.infer<typeof FitSchema>;

/** What the fit-check model must return. Every field is required (strict structured output). */
export const FitModelSchema = z.object({
  title: z.string().describe('Job title, e.g. "Senior AI Engineer". Empty string if not stated.'),
  company: z.string().describe('Employer name. Empty string if not stated.'),
  location: z
    .string()
    .describe('Place of work, e.g. "London, hybrid". Empty string if not stated.'),
  fit_score: z
    .number()
    .int()
    .describe('0 to 100: how well the CV covers what the advert asks for. 0 when there is no CV.'),
  asks: z
    .array(
      z.object({
        ask: z.string().describe('One thing the advert asks for, in 1 to 4 words.'),
        covered: z.boolean().describe('True only if the CV clearly shows it.'),
        note: z.string().describe('Under 16 words: where the CV shows it, or what is missing.')
      })
    )
    .describe('The 6 to 12 most important things the advert asks for, most important first.'),
  rounds: z
    .array(
      z.object({
        name: z
          .string()
          .describe('Round name, e.g. "Recruiter screen", "Hiring manager", "Technical".'),
        focus: z.string().describe('Under 16 words: what this round tests for this job.')
      })
    )
    .describe(
      'The 2 to 4 interview rounds this employer would most likely run for this job, in order.'
    )
});
export type FitModel = z.infer<typeof FitModelSchema>;

/** What a fit check hands back to the "Add a job" screen. */
export type FitResult = {
  title: string;
  company: string;
  location: string;
  /** Null when no CV was given: there is nothing to compare. */
  fit: Fit | null;
  rounds: Round[];
  /** "model" when the AI read it, "basic" when the rule-based reader stood in. */
  source: 'model' | 'basic';
};

export function fitBand(score: number) {
  return score >= 75
    ? 'Strong fit'
    : score >= 60
      ? 'Good fit'
      : score >= 40
        ? 'Partial fit'
        : 'A stretch';
}

/** "Strong fit, 3 gaps". */
export function fitHeadline(fit: Fit) {
  const gaps = fit.asks.filter((a) => !a.covered).length;
  return `${fitBand(fit.score)}, ${gaps === 0 ? 'no gaps' : gaps === 1 ? '1 gap' : `${gaps} gaps`}`;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(n)));

/** Tidy a model's answer into what gets stored and shown. */
export function fitFromModel(m: FitModel, hasCv: boolean): FitResult {
  const asks = m.asks
    .map((a) => ({
      ask: a.ask.trim().slice(0, 60),
      covered: hasCv && a.covered,
      note: a.note.trim().slice(0, 200)
    }))
    .filter((a) => a.ask)
    .slice(0, 14);
  return {
    title: m.title.trim().slice(0, 90),
    company: m.company.trim().slice(0, 60),
    location: m.location.trim().slice(0, 60),
    fit: hasCv && asks.length ? { score: clamp(m.fit_score, 0, 100), asks } : null,
    rounds: toRounds(m.rounds),
    source: 'model'
  };
}

const wholeWord = (haystack: string, needle: string) => {
  const k = needle.toLowerCase();
  let i = haystack.indexOf(k);
  while (i !== -1) {
    const before = haystack[i - 1] ?? ' ';
    const after = haystack[i + k.length] ?? ' ';
    if (!/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after)) return true;
    i = haystack.indexOf(k, i + 1);
  }
  return false;
};

/**
 * A fit check without a model: the skills the advert names, ticked when the CV
 * names them too. Rougher than the model's reading, but it means adding a job
 * never fails because the model is unavailable.
 */
export function basicFit(advert: string, cvText: string | null): FitResult {
  const job = parseJobBasic(advert);
  const cv = (cvText ?? '').toLowerCase();
  const asks: Ask[] = job.skills.map((skill) => {
    const covered = !!cv && wholeWord(cv, skill);
    return { ask: skill, covered, note: covered ? 'Named in your CV.' : 'Not named in your CV.' };
  });
  const covered = asks.filter((a) => a.covered).length;
  return {
    title: job.title,
    company: job.company,
    location: [job.location, job.workMode].filter(Boolean).join(', '),
    // A CV rarely names every skill it shows, so the rough reading starts from 40.
    fit:
      cv && asks.length ? { score: clamp(40 + (60 * covered) / asks.length, 0, 100), asks } : null,
    rounds: DEFAULT_ROUNDS,
    source: 'basic'
  };
}

// ---------------------------------------------------------------------------
// Readiness
// ---------------------------------------------------------------------------

/** A score that would likely get through a real interview (same line as a "good" score elsewhere). */
export const PASS_MARK = 75;

/** One practice interview for a job, as readiness needs it. */
export type Practice = {
  id: string;
  roundId: string | null;
  /** Overall score 0 to 100; null while unscored or too short to score. */
  score: number | null;
  at: Date;
  /** Skill scores from the scorecard, 1 to 5. */
  competencies: { key: string; score: number }[];
};

export type RoundProgress = {
  round: Round;
  /** done = practised and scored; next = the first one not yet practised; todo = after that. */
  state: 'done' | 'next' | 'todo';
  /** Latest score for this round. */
  score: number | null;
  lastAt: Date | null;
  count: number;
};

/** The latest scores count most: the newest weighs 5, the one before 4, down to 1. */
const RECENT = 5;

/**
 * How ready someone is for a job, from their practice interviews for it.
 *
 * Readiness is their recent scores (latest weighted most), held back until
 * every planned round has been practised: with none of the rounds covered it
 * is 70% of the recent average, with all of them it is 100%.
 */
export function readiness(practices: Practice[], rounds: Round[]) {
  const scored = practices
    .filter((p): p is Practice & { score: number } => p.score != null)
    .sort((a, b) => a.at.getTime() - b.at.getTime());

  const progress: RoundProgress[] = rounds.map((round) => {
    const mine = scored.filter((p) => p.roundId === round.id);
    const last = mine.at(-1);
    return {
      round,
      state: mine.length ? 'done' : 'todo',
      score: last?.score ?? null,
      lastAt: last?.at ?? null,
      count: mine.length
    };
  });
  const next = progress.find((r) => r.state === 'todo');
  if (next) next.state = 'next';

  let score: number | null = null;
  if (scored.length) {
    const recent = scored.slice(-RECENT).reverse();
    const weights = recent.map((_, i) => RECENT - i);
    const average =
      recent.reduce((s, p, i) => s + p.score * weights[i], 0) / weights.reduce((s, w) => s + w, 0);
    const coverage = rounds.length
      ? progress.filter((r) => r.state === 'done').length / rounds.length
      : 1;
    score = clamp(average * (0.7 + 0.3 * coverage), 0, 100);
  }

  const withSkills = scored.filter((p) => p.competencies.length);
  const skills = COMPETENCIES.flatMap((key) => {
    const points = withSkills.flatMap((p) =>
      p.competencies.filter((c) => c.key === key).map((c) => c.score)
    );
    if (!points.length) return [];
    // Skill scores are 1 to 5; show them on the same 0 to 100 scale as everything else.
    return [
      { key, label: COMPETENCY_LABELS[key], first: points[0] * 20, latest: points.at(-1)! * 20 }
    ];
  });

  const weekAgo = Date.now() - 7 * 86_400_000;
  return {
    score,
    toPass: score == null ? null : Math.max(0, PASS_MARK - score),
    rounds: progress,
    nextRound: next?.round ?? null,
    practised: practices.length,
    practisedThisWeek: practices.filter((p) => p.at.getTime() >= weekAgo).length,
    /** Latest score minus the first one; null until there are two scored interviews. */
    sinceFirst: scored.length >= 2 ? scored.at(-1)!.score - scored[0].score : null,
    skills
  };
}

export type Readiness = ReturnType<typeof readiness>;

// ---------------------------------------------------------------------------
// Dates and names
// ---------------------------------------------------------------------------

export const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a valid date');

/** Whole days from today to a YYYY-MM-DD date (negative once it has passed). */
export function daysUntil(date: string, now = new Date()) {
  const [y, m, d] = date.split('-').map(Number);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((Date.UTC(y, m - 1, d) - today) / 86_400_000);
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-12-03" → "Wed 3 Dec". */
export function formatDay(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  const day = new Date(Date.UTC(y, m - 1, d));
  return `${DAYS[day.getUTCDay()]} ${d} ${MONTHS[m - 1]}`;
}

/** "in 7 days", "tomorrow", "today", "3 days ago". */
export function countdown(date: string, now = new Date()) {
  const n = daysUntil(date, now);
  if (n === 0) return 'today';
  if (n === 1) return 'tomorrow';
  if (n === -1) return 'yesterday';
  return n > 0 ? `in ${n} days` : `${-n} days ago`;
}

/** "Interview Wed 3 Dec · in 7 days", or "No date yet". */
export function whenLine(date: string | null, now = new Date()) {
  return date ? `Interview ${formatDay(date)} · ${countdown(date, now)}` : 'No date yet';
}

/** "Senior AI Engineer · Juro". */
export function jobName(job: { title: string; company: string }) {
  return [job.title, job.company].filter(Boolean).join(' · ');
}

/** The name a practice interview gets: "Hiring manager · Juro". */
export function practiceName(job: { title: string; company: string }, round: Round | null) {
  if (!round) return jobName(job);
  return [round.name, job.company || job.title].filter(Boolean).join(' · ');
}
