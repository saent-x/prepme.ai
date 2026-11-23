import { describe, expect, it } from 'vitest';
import { composeBrief } from './interviewer-brief';

describe('composeBrief', () => {
  it('writes a brief from the short form', () => {
    const brief = composeBrief({ role: "Staff Nurse, A&E at St Thomas'", job: 'ward manager', style: 'tough', focus: ['scenarios', 'motivation'] });
    expect(brief).toContain("a ward manager interviewing a candidate for this job: Staff Nurse, A&E at St Thomas'.");
    expect(brief).toContain('Cover: realistic "what would you do if" situations from the job; why they want this job and this employer.');
    expect(brief).toContain('Be demanding.');
    expect(brief.length).toBeGreaterThan(20);
  });

  it('falls back to a hiring manager and skips an empty focus list', () => {
    const brief = composeBrief({ role: 'Chef de partie', job: '', style: 'friendly', focus: [] });
    expect(brief).toContain('You are the hiring manager');
    expect(brief).not.toContain('Cover:');
  });

  it('uses "an" before a vowel and keeps an existing article', () => {
    expect(composeBrief({ role: 'x', job: 'engineering manager', style: 'realistic', focus: [] })).toContain('You are an engineering manager');
    expect(composeBrief({ role: 'x', job: 'the head teacher', style: 'realistic', focus: [] })).toContain('You are the head teacher');
  });
});
