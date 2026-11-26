import { describe, expect, it } from 'vitest';
import {
  answerScore,
  audioFileName,
  clampScore,
  clock,
  countWords,
  gainLabel,
  nextToRedo,
  redosByQuestion,
  RedoModelSchema,
  type Redo
} from './redo';
import type { Scorecard } from './interview-types';

let n = 0;
const redo = (
  questionIndex: number,
  score: number,
  minutesAgo: number,
  previousScore = 40
): Redo => ({
  id: `r${++n}`,
  questionIndex,
  answer: 'An answer.',
  previousScore,
  score,
  feedback: 'Better.',
  tip: 'End on the result.',
  spoken: true,
  seconds: 60,
  createdAt: new Date(Date.UTC(2026, 10, 26, 12, 0) - minutesAgo * 60_000)
});

const question = (score: number): Scorecard['questions'][number] => ({
  question: 'Tell me about a time you disagreed.',
  answer_summary: 'A short story.',
  score,
  feedback: 'No result.',
  stronger_answer: 'A better story.'
});

describe('scores', () => {
  it('shows a 1 to 5 answer score out of 100', () => {
    expect(answerScore({ score: 1 })).toBe(20);
    expect(answerScore({ score: 3 })).toBe(60);
    expect(answerScore({ score: 5 })).toBe(100);
  });

  it('keeps a model score inside 0 to 100', () => {
    expect(clampScore(77.4)).toBe(77);
    expect(clampScore(140)).toBe(100);
    expect(clampScore(-3)).toBe(0);
  });

  it('says how a redo compares with the first answer', () => {
    expect(gainLabel(40, 77)).toBe('+37');
    expect(gainLabel(60, 55)).toBe('−5');
    expect(gainLabel(60, 60)).toBe('same');
  });

  it('accepts only whole scores from the model', () => {
    expect(RedoModelSchema.safeParse({ score: 77, feedback: 'a', tip: 'b' }).success).toBe(true);
    expect(RedoModelSchema.safeParse({ score: 101, feedback: 'a', tip: 'b' }).success).toBe(false);
    expect(RedoModelSchema.safeParse({ score: 77, feedback: 'a' }).success).toBe(false);
  });
});

describe('redosByQuestion', () => {
  it('keeps the latest and the best attempt for each question', () => {
    const first = redo(0, 70, 30);
    const second = redo(0, 85, 20);
    const third = redo(0, 60, 10);
    const other = redo(2, 50, 5);
    const by = redosByQuestion([third, other, first, second]);
    expect(by.get(0)).toMatchObject({ attempts: 3, best: second, latest: third });
    expect(by.get(2)).toMatchObject({ attempts: 1, best: other, latest: other });
    expect(by.has(1)).toBe(false);
  });

  it('keeps the earlier attempt when two score the same', () => {
    const first = redo(0, 70, 30);
    const by = redosByQuestion([first, redo(0, 70, 10)]);
    expect(by.get(0)?.best).toBe(first);
  });
});

describe('nextToRedo', () => {
  it('picks the weakest answer', () => {
    expect(nextToRedo([question(4), question(2), question(3)], [])).toBe(1);
  });

  it('moves on once a redo lifts the weakest answer', () => {
    const questions = [question(4), question(2), question(3)];
    expect(nextToRedo(questions, [redo(1, 85, 5)])).toBe(2);
  });

  it('still suggests an answer whose redo did not reach a strong score', () => {
    expect(nextToRedo([question(4), question(2)], [redo(1, 55, 5)])).toBe(1);
  });

  it('suggests nothing when every answer is strong', () => {
    expect(nextToRedo([question(4), question(5)], [])).toBeNull();
    expect(nextToRedo([], [])).toBeNull();
  });
});

describe('recordings', () => {
  it('names a recording by its format so the transcriber recognises it', () => {
    expect(audioFileName('audio/webm;codecs=opus')).toBe('answer.webm');
    expect(audioFileName('audio/mp4')).toBe('answer.mp4');
    expect(audioFileName('audio/ogg; codecs=opus')).toBe('answer.ogg');
    expect(audioFileName('audio/wav')).toBe('answer.wav');
    expect(audioFileName('audio/mpeg')).toBe('answer.mp3');
  });

  it('refuses a file that is not a recording it knows', () => {
    expect(audioFileName('application/pdf')).toBeNull();
    expect(audioFileName('')).toBeNull();
  });

  it('counts words and shows the clock', () => {
    expect(countWords('  I led   the migration \n myself ')).toBe(5);
    expect(countWords('')).toBe(0);
    expect(clock(0)).toBe('0:00');
    expect(clock(75)).toBe('1:15');
    expect(clock(120)).toBe('2:00');
  });
});
