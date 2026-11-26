import { z } from 'zod';
import type { Fit, Round } from '$lib/jobs';

/**
 * The question bank and the story bank. A job's bank is the questions its
 * interviews are most likely to ask, each with the candidate's best answer so
 * far. Strong answers can be kept as stories to reuse for any job.
 */

/** Questions in a job's bank. */
export const BANK_SIZE = 12;
/** How many of them the free plan shows. */
export const FREE_BANK_QUESTIONS = 5;
/** Scored practice answers the free plan includes, across all bank questions. */
export const FREE_BANK_ANSWERS = 5;
/** Times a day one person can build or rebuild a bank with the model. */
export const BANK_BUILDS_PER_DAY = 10;
/** An answer at or above this is worth keeping as a story. Same line as the pass mark. */
export const STORY_SCORE = 75;
export const MAX_STORIES = 100;
export const MAX_STORY_CHARS = 6000;

/** What the model returns when it builds a bank. Every field is required (strict structured output). */
export const BankModelSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().describe('The question, worded as the interviewer would ask it.'),
        round: z
          .string()
          .describe(
            'The name of the round it is most likely to come up in, copied from the list given.'
          ),
        why: z
          .string()
          .describe('Under 20 words: why this employer is likely to ask it, or what it tests.')
      })
    )
    .describe(`The ${BANK_SIZE} questions most likely to be asked for this job.`)
});
export type BankModel = z.infer<typeof BankModelSchema>;

/** A bank question before it is stored. */
export type BankDraft = { question: string; roundId: string | null; why: string };

const tidy = (s: string, max: number) => s.replace(/\s+/g, ' ').trim().slice(0, max);
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
/** Two questions are the same when they match once case and punctuation are ignored. */
const key = (q: string) =>
  q
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Tidy what the model returned: no blanks, no repeats, each tied to one of the job's rounds. */
export function bankFromModel(model: BankModel, rounds: Round[]): BankDraft[] {
  const seen = new Set<string>();
  const out: BankDraft[] = [];
  for (const q of model.questions) {
    const question = tidy(q.question, 300);
    if (question.length < 10 || seen.has(key(question))) continue;
    seen.add(key(question));
    const round =
      rounds.find((r) => same(r.name, q.round)) ??
      rounds.find((r) => q.round.toLowerCase().includes(r.name.toLowerCase()));
    out.push({ question, roundId: round?.id ?? null, why: tidy(q.why, 200) });
    if (out.length === BANK_SIZE) break;
  }
  return out;
}

/**
 * A bank built without the model, so building one never fails: the questions
 * nearly every interview asks, plus one for each gap the fit check found.
 */
export function basicBank(
  job: { title: string; company: string },
  rounds: Round[],
  fit: Fit | null
): BankDraft[] {
  const first = rounds[0]?.id ?? null;
  const middle = rounds[Math.min(1, rounds.length - 1)]?.id ?? null;
  const last = rounds.at(-1)?.id ?? null;
  const employer = job.company || 'this employer';
  const role = job.title || 'this job';
  const gaps = (fit?.asks ?? []).filter((a) => !a.covered).slice(0, 4);
  const drafts: BankDraft[] = [
    {
      question: `Tell me about yourself and what brings you to ${employer}.`,
      roundId: first,
      why: 'Opens almost every interview and sets the tone for the rest.'
    },
    {
      question: `Why do you want this ${role} job?`,
      roundId: first,
      why: 'Tests whether you have thought about this job and not just any job.'
    },
    ...gaps.map((g) => ({
      question: `The advert asks for ${g.ask}. Tell me about your experience with it.`,
      roundId: last,
      why: 'Your CV does not clearly show this, so expect to be asked about it.'
    })),
    {
      question: 'Tell me about a piece of work you are proud of and your part in it.',
      roundId: middle,
      why: 'Shows what you count as good work and what you did yourself.'
    },
    {
      question: 'Describe a time you disagreed with a colleague and how it ended.',
      roundId: middle,
      why: 'Tests how you work with others when it is not easy.'
    },
    {
      question: 'Tell me about a time something went wrong and what you did about it.',
      roundId: middle,
      why: 'Tests ownership and what you learn from mistakes.'
    },
    {
      question: 'Talk me through a hard problem you solved recently, step by step.',
      roundId: last,
      why: 'Tests the depth of your skills on a real example.'
    },
    {
      question: 'How do you decide what to do first when everything is urgent?',
      roundId: middle,
      why: 'Tests judgement and how you handle pressure.'
    },
    {
      question: `What would you want to get done in your first 90 days as ${role}?`,
      roundId: middle,
      why: 'Shows whether you understand what the job needs.'
    },
    {
      question: 'What questions do you have for us?',
      roundId: first,
      why: 'Asked at the end of nearly every round. Good questions show real interest.'
    }
  ];
  return drafts.slice(0, BANK_SIZE);
}

/** A bank question as the job page shows it. */
export type BankQuestion = {
  id: string;
  question: string;
  roundId: string | null;
  why: string;
  /** Best scored answer so far, if any. */
  best: BankAnswer | null;
  attempts: number;
};

export type BankAnswer = {
  id: string;
  answer: string;
  score: number;
  feedback: string;
  tip: string;
  title: string;
  spoken: boolean;
  createdAt: Date;
};

/** How far through its bank a job is: answered questions, and those answered well. */
export function bankProgress(questions: BankQuestion[]) {
  const answered = questions.filter((q) => q.best).length;
  const strong = questions.filter((q) => (q.best?.score ?? 0) >= STORY_SCORE).length;
  return { total: questions.length, answered, strong };
}

/** A kept story as the Stories page shows it. */
export type Story = {
  id: string;
  title: string;
  question: string;
  text: string;
  score: number;
  job: { id: string; title: string; company: string } | null;
  createdAt: Date;
};

/** A title for a story when the model gave none: the first few words of the question. */
export function fallbackTitle(question: string) {
  const words = question
    .replace(/[“”"?]/g, '')
    .trim()
    .split(/\s+/);
  return words.slice(0, 7).join(' ') + (words.length > 7 ? '…' : '');
}
