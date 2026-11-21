import { describe, expect, it } from 'vitest';
import { buildRealtimeInstructions, formatTranscript } from './prompts';
import { normaliseScorecard } from './openai';
import type { Scorecard } from '$lib/interview-types';

const agent = { name: 'Maya', instructions: 'Senior backend interviewer.' };
const interview = { name: 'Backend loop', jobDescription: 'Go and Postgres', focus: null, durationMinutes: 20 };

describe('realtime instructions', () => {
  it('opens fresh calls with a greeting', () => {
    const s = buildRealtimeInstructions({ agent, interview, candidateName: 'Tor' });
    expect(s).toContain('# Opening');
    expect(s).toContain('Go and Postgres');
    expect(s).toContain('about 20 minutes');
    expect(s).not.toContain('Resuming');
  });
  it('resumes with the previous transcript instead of restarting', () => {
    const s = buildRealtimeInstructions({
      agent,
      interview,
      candidateName: 'Tor',
      previousTranscript: [{ id: '1', speaker: 'candidate', text: 'I was saying…', at: 61_000 }]
    });
    expect(s).toContain('Resuming after a dropped connection');
    expect(s).toContain('[1:01] Tor: I was saying…');
    expect(s).not.toContain('# Opening');
  });
  it('skips blank lines in transcripts', () => {
    expect(formatTranscript([{ id: '1', speaker: 'interviewer', text: '  ', at: 0 }])).toBe('');
  });
});

describe('normaliseScorecard', () => {
  it('clamps scores and de-duplicates competencies', () => {
    const raw = {
      overall_score: 140.4,
      verdict: 'hire',
      headline: 'h',
      overview: 'o',
      competencies: [
        { key: 'communication', score: 9, evidence: 'e' },
        { key: 'communication', score: 2, evidence: 'dup' }
      ],
      strengths: [],
      improvements: [],
      questions: [{ question: 'q', answer_summary: 'a', score: 0, feedback: 'f', stronger_answer: 's' }],
      next_practice: [],
      talk_ratio_comment: ''
    } as unknown as Scorecard;
    const s = normaliseScorecard(raw);
    expect(s.overall_score).toBe(100);
    expect(s.competencies).toHaveLength(1);
    expect(s.competencies[0].score).toBe(5);
    expect(s.questions[0].score).toBe(1);
  });
});
