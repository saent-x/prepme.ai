import { describe, expect, it } from 'vitest';
import { formatClock, formatDuration, initials, scoreTone } from './utils';
import { transcriptStats, TranscriptSchema, type TranscriptEntry } from './interview-types';

describe('formatting', () => {
  it('formats durations', () => {
    expect(formatDuration(0)).toBe('—');
    expect(formatDuration(42)).toBe('42s');
    expect(formatDuration(754)).toBe('12m 34s');
    expect(formatDuration(600)).toBe('10m');
    expect(formatDuration(3720)).toBe('1h 2m');
  });
  it('formats the call clock and clamps negatives', () => {
    expect(formatClock(65_000)).toBe('1:05');
    expect(formatClock(-10)).toBe('0:00');
  });
  it('builds initials', () => {
    expect(initials('Ada Lovelace King')).toBe('AL');
    expect(initials('   ')).toBe('?');
  });
  it('maps scores to tones', () => {
    expect(scoreTone(null)).toBe('none');
    expect(scoreTone(85)).toBe('good');
    expect(scoreTone(65)).toBe('ok');
    expect(scoreTone(55)).toBe('low');
    expect(scoreTone(20)).toBe('low');
  });
});

describe('transcript', () => {
  const t: TranscriptEntry[] = [
    { id: '1', speaker: 'interviewer', text: 'Hi there, tell me about yourself?', at: 0 },
    { id: '2', speaker: 'candidate', text: 'I build backend systems in TypeScript and Python.', at: 30_000 },
    { id: '3', speaker: 'interviewer', text: 'Great.', at: 60_000 }
  ];
  it('computes talk share and questions', () => {
    const s = transcriptStats(t);
    expect(s.candidateWords).toBe(8);
    expect(s.interviewerWords).toBe(7);
    expect(s.questions).toBe(1);
    expect(s.candidateShare).toBeCloseTo(8 / 15);
    expect(s.wordsPerMinute).toBe(8);
  });
  it('handles an empty transcript', () => {
    expect(transcriptStats([])).toMatchObject({ candidateShare: 0, wordsPerMinute: 0 });
  });
  it('rejects malformed entries', () => {
    expect(TranscriptSchema.safeParse([{ id: '1', speaker: 'robot', text: 'x', at: 0 }]).success).toBe(false);
    expect(TranscriptSchema.safeParse(t).success).toBe(true);
  });
});
