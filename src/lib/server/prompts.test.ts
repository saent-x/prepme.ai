import { describe, expect, it } from 'vitest';
import { buildRealtimeInstructions, buildRedoPrompt, formatTranscript } from './prompts';
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
  it('tells a resumed call how much time is left', () => {
    const previousTranscript = [{ id: '1', speaker: 'candidate' as const, text: 'Hi', at: 0 }];
    const s = buildRealtimeInstructions({ agent, interview, candidateName: 'Tor', previousTranscript, minutesLeft: 7 });
    expect(s).toContain('About 7 minutes of the call remain');
    const late = buildRealtimeInstructions({ agent, interview, candidateName: 'Tor', previousTranscript, minutesLeft: 1 });
    expect(late).toContain('Time is nearly up');
  });
  it('names the round being practised for a saved job', () => {
    const round = { name: 'Hiring manager', focus: 'Ownership and trade-offs' };
    const s = buildRealtimeInstructions({ agent, interview, candidateName: 'Tor', round });
    expect(s).toContain('# The round being practised');
    expect(s).toContain('"Hiring manager" round');
    expect(s).toContain('It tests: Ownership and trade-offs.');
    expect(buildRealtimeInstructions({ agent, interview, candidateName: 'Tor' })).not.toContain('round being practised');
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

describe('CV in prompts', () => {
  it('adds the CV to the interviewer and scoring prompts', async () => {
    const { buildRealtimeInstructions, buildAnalysisPrompt } = await import('./prompts');
    const cvText = 'Built a RAG contract search; cut errors by 40%.';
    const live = buildRealtimeInstructions({
      agent: { name: 'Maya', instructions: 'Tough staff engineer.' },
      interview: { ...interview, cvText },
      candidateName: 'Tor'
    });
    expect(live).toContain("# The candidate's CV");
    expect(live).toContain(cvText);
    const { user } = buildAnalysisPrompt({
      agent: { name: 'Maya', instructions: 'x' },
      interview: { ...interview, cvText },
      candidateName: 'Tor',
      transcript: []
    });
    expect(user).toContain(cvText);
  });
});

describe('buildRedoPrompt', () => {
  const question = {
    question: 'Tell me about a time you cut costs.',
    answer_summary: 'You described moving to a cheaper model.',
    score: 2,
    feedback: 'No numbers, and the result was missing.'
  };
  const base = {
    interview: { name: 'Juro technical', jobDescription: 'Senior AI Engineer at Juro', cvText: null },
    question,
    answer: 'I cut our model bill by 40 percent by caching prompts.'
  };

  it('gives the model the question, the first score out of 100 and the new answer', () => {
    const { system, user } = buildRedoPrompt({ ...base, spoken: true });
    expect(system).toContain('Their first answer scored 40 on this scale');
    expect(system).toContain('spoken and then transcribed');
    expect(user).toContain('Question: Tell me about a time you cut costs.');
    expect(user).toContain("First answer's score: 40 out of 100");
    expect(user).toContain('No numbers, and the result was missing.');
    expect(user).toContain('I cut our model bill by 40 percent');
    expect(user).toContain('Senior AI Engineer at Juro');
  });

  it('does not judge delivery when the answer was typed', () => {
    const { system } = buildRedoPrompt({ ...base, spoken: false });
    expect(system).toContain('typed');
    expect(system).not.toContain('transcribed');
  });

  it('names the round when the interview was for a saved job', () => {
    const { user } = buildRedoPrompt({ ...base, spoken: true, round: { name: 'Hiring manager', focus: 'ownership' } });
    expect(user).toContain('Round: Hiring manager (tests: ownership)');
  });
});
