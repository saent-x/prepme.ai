import { describe, expect, it } from 'vitest';
import type { TranscriptEntry } from '$lib/interview-types';
import { buildRecapNote, contextWasTrimmed } from './context';

describe('contextWasTrimmed', () => {
  it('spots the fall in input when the oldest turns are dropped', () => {
    expect(contextWasTrimmed(9000, 4800)).toBe(true);
  });

  it('ignores normal growth, small dips and the start of a call', () => {
    expect(contextWasTrimmed(9000, 9400)).toBe(false);
    // An interrupted reply shaves a little off; that is not trimming.
    expect(contextWasTrimmed(9000, 8600)).toBe(false);
    expect(contextWasTrimmed(0, 0)).toBe(false);
    expect(contextWasTrimmed(1500, 700)).toBe(false);
  });
});

describe('buildRecapNote', () => {
  const say = (speaker: TranscriptEntry['speaker'], text: string, i: number): TranscriptEntry => ({
    id: `item-${i}`,
    speaker,
    text,
    at: i * 1000
  });

  it('lists the questions the interviewer asked, in order', () => {
    const note = buildRecapNote([
      say('interviewer', 'Hi Sam, good to meet you. Can you walk me through your last project?', 1),
      say('candidate', 'Sure. Why did we pick Postgres? Because of the joins.', 2),
      say('interviewer', 'Thanks, that helps.', 3),
      say('interviewer', 'Got it. How did you measure success?', 4)
    ])!;
    expect(note).toContain('1. Can you walk me through your last project?');
    expect(note).toContain('2. How did you measure success?');
    // The candidate's own question and the interviewer's non-question are left out.
    expect(note).not.toContain('Postgres');
    expect(note).not.toContain('that helps');
    expect(note).toContain('Do not ask these again');
  });

  it('keeps every question from a turn that asks more than one', () => {
    const note = buildRecapNote([
      say('interviewer', 'I see. What failed? How did you recover?', 1)
    ])!;
    expect(note).toContain('1. What failed?');
    expect(note).toContain('2. How did you recover?');
  });

  it('keeps only the most recent questions and clips very long ones', () => {
    const many = Array.from({ length: 40 }, (_, i) =>
      say('interviewer', `Question number ${i + 1}?`, i)
    );
    const note = buildRecapNote(many, 5)!;
    expect(note).not.toContain('Question number 35?');
    expect(note).toContain('1. Question number 36?');
    expect(note).toContain('5. Question number 40?');

    const long = buildRecapNote([say('interviewer', `${'really '.repeat(80)}why?`, 1)])!;
    expect(long.split('\n')[1].length).toBeLessThanOrEqual(203);
    expect(long).toContain('…');
  });

  it('has nothing to say before the first question', () => {
    expect(buildRecapNote([])).toBeNull();
    expect(
      buildRecapNote([say('interviewer', 'Welcome.', 1), say('candidate', 'Is this on?', 2)])
    ).toBeNull();
  });
});
