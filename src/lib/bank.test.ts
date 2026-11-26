import { describe, expect, it } from 'vitest';
import {
  BANK_SIZE,
  bankFromModel,
  bankProgress,
  basicBank,
  fallbackTitle,
  type BankAnswer,
  type BankQuestion
} from './bank';
import { DEFAULT_ROUNDS } from './jobs';

const rounds = DEFAULT_ROUNDS;

describe('bankFromModel', () => {
  it('ties each question to a round by name and tidies the text', () => {
    const bank = bankFromModel(
      {
        questions: [
          {
            question: '  How did you cut   model costs at Northwind? ',
            round: 'hiring manager',
            why: ' Probes cost work. '
          },
          {
            question: 'Walk me through your eval set design.',
            round: 'The Skills round',
            why: 'Core skill.'
          },
          { question: 'Why do you want this job?', round: 'Coffee chat', why: 'Motivation.' }
        ]
      },
      rounds
    );
    expect(bank).toEqual([
      {
        question: 'How did you cut model costs at Northwind?',
        roundId: 'r2',
        why: 'Probes cost work.'
      },
      { question: 'Walk me through your eval set design.', roundId: 'r3', why: 'Core skill.' },
      { question: 'Why do you want this job?', roundId: null, why: 'Motivation.' }
    ]);
  });

  it('drops blanks and repeats, and stops at the bank size', () => {
    const many = Array.from({ length: 20 }, (_, n) => ({
      question: `Tell me about project number ${n}.`,
      round: 'Hiring manager',
      why: ''
    }));
    const bank = bankFromModel(
      {
        questions: [
          { question: 'Why us?', round: '', why: '' },
          { question: 'Tell me about project number 0.', round: '', why: '' },
          { question: 'tell me about PROJECT number 0', round: '', why: '' },
          ...many
        ]
      },
      rounds
    );
    expect(bank).toHaveLength(BANK_SIZE);
    expect(bank.filter((q) => /number 0\b/i.test(q.question))).toHaveLength(1);
    expect(bank.some((q) => q.question === 'Why us?')).toBe(false);
  });
});

describe('basicBank', () => {
  it('asks about each gap the fit check found', () => {
    const bank = basicBank({ title: 'Senior AI Engineer', company: 'Northwind Labs' }, rounds, {
      score: 60,
      asks: [
        { ask: 'Python', covered: true, note: '' },
        { ask: 'On-call', covered: false, note: '' },
        { ask: 'Mentoring', covered: false, note: '' }
      ]
    });
    const text = bank.map((q) => q.question).join('\n');
    expect(text).toContain('The advert asks for On-call.');
    expect(text).toContain('The advert asks for Mentoring.');
    expect(text).not.toContain('The advert asks for Python.');
    expect(text).toContain('Northwind Labs');
    expect(bank.length).toBeLessThanOrEqual(BANK_SIZE);
    expect(bank.every((q) => q.roundId && rounds.some((r) => r.id === q.roundId))).toBe(true);
  });

  it('still gives a useful list with no fit check and no company', () => {
    const bank = basicBank({ title: '', company: '' }, rounds, null);
    expect(bank.length).toBeGreaterThanOrEqual(8);
    expect(bank[0].question).toContain('this employer');
    expect(new Set(bank.map((q) => q.question)).size).toBe(bank.length);
  });
});

describe('bankProgress', () => {
  const answer = (score: number): BankAnswer => ({
    id: `a${score}`,
    answer: 'An answer.',
    score,
    feedback: '',
    tip: '',
    title: '',
    spoken: true,
    createdAt: new Date()
  });
  const q = (best: BankAnswer | null): BankQuestion => ({
    id: Math.random().toString(36),
    question: 'A question?',
    roundId: null,
    why: '',
    best,
    attempts: best ? 1 : 0
  });

  it('counts answered and strong questions', () => {
    expect(bankProgress([q(answer(80)), q(answer(60)), q(null), q(answer(75))])).toEqual({
      total: 4,
      answered: 3,
      strong: 2
    });
    expect(bankProgress([])).toEqual({ total: 0, answered: 0, strong: 0 });
  });
});

describe('fallbackTitle', () => {
  it('names a story from its question when the model gave no title', () => {
    expect(fallbackTitle('Why do you want this job?')).toBe('Why do you want this job');
    expect(fallbackTitle('Tell me about a time you cut the cost of an AI feature.')).toBe(
      'Tell me about a time you cut…'
    );
  });
});
