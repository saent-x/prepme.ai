import { z } from 'zod';

/** One utterance in the live transcript. */
export type TranscriptEntry = {
  /** Realtime conversation item id; used to keep ordering and avoid duplicates. */
  id: string;
  speaker: 'interviewer' | 'candidate';
  text: string;
  /** Milliseconds since the interview started. */
  at: number;
};

export const TranscriptEntrySchema = z.object({
  id: z.string().min(1).max(128),
  speaker: z.enum(['interviewer', 'candidate']),
  text: z.string().max(20_000),
  at: z.number().int().min(0)
});

export const TranscriptSchema = z.array(TranscriptEntrySchema).max(2_000);

export const COMPETENCIES = [
  'communication',
  'technical_depth',
  'problem_solving',
  'structure',
  'role_fit'
] as const;

export const COMPETENCY_LABELS: Record<(typeof COMPETENCIES)[number], string> = {
  communication: 'Communication',
  technical_depth: 'Technical depth',
  problem_solving: 'Problem solving',
  structure: 'Answer structure',
  role_fit: 'Role fit'
};

/**
 * The structured feedback the analysis model must return.
 * Every field is required so it works with OpenAI strict structured outputs.
 */
export const ScorecardSchema = z.object({
  overall_score: z.number().int().min(0).max(100),
  verdict: z.enum(['strong_hire', 'hire', 'lean_hire', 'lean_no_hire', 'no_hire']),
  headline: z.string(),
  overview: z.string(),
  competencies: z.array(
    z.object({
      key: z.enum(COMPETENCIES),
      score: z.number().int().min(1).max(5),
      evidence: z.string()
    })
  ),
  strengths: z.array(z.string()),
  improvements: z.array(
    z.object({
      title: z.string(),
      detail: z.string()
    })
  ),
  questions: z.array(
    z.object({
      question: z.string(),
      answer_summary: z.string(),
      score: z.number().int().min(1).max(5),
      feedback: z.string(),
      stronger_answer: z.string()
    })
  ),
  next_practice: z.array(z.string()),
  talk_ratio_comment: z.string()
});

export type Scorecard = z.infer<typeof ScorecardSchema>;

export const VERDICT_LABELS: Record<Scorecard['verdict'], string> = {
  strong_hire: 'Strong hire',
  hire: 'Hire',
  lean_hire: 'Leaning hire',
  lean_no_hire: 'Leaning no hire',
  no_hire: 'No hire'
};

/** Small stats computed from a transcript, shown next to the scorecard. */
export function transcriptStats(transcript: TranscriptEntry[]) {
  const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
  let candidateWords = 0;
  let interviewerWords = 0;
  let questions = 0;
  for (const t of transcript) {
    if (t.speaker === 'candidate') candidateWords += words(t.text);
    else {
      interviewerWords += words(t.text);
      if (t.text.includes('?')) questions += 1;
    }
  }
  const total = candidateWords + interviewerWords;
  const last = transcript.at(-1)?.at ?? 0;
  const minutes = last / 60_000;
  return {
    candidateWords,
    interviewerWords,
    questions,
    candidateShare: total ? candidateWords / total : 0,
    /** Rough speaking pace over the whole call. */
    wordsPerMinute: minutes > 0.5 ? Math.round(candidateWords / minutes) : 0
  };
}
