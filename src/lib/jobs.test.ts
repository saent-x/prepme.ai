import { describe, expect, it } from 'vitest';
import {
  basicFit,
  countdown,
  daysUntil,
  DEFAULT_ROUNDS,
  fitFromModel,
  fitHeadline,
  formatDay,
  jobName,
  PASS_MARK,
  practiceName,
  readiness,
  toRounds,
  whenLine,
  type Practice,
  type Round
} from './jobs';

const ADVERT = `Senior AI Engineer at Juro
Location: London

What you'll do
- Build retrieval features with Python and RAG on AWS
- Work with stakeholders across legal and product

About you
- Strong Python and TypeScript
- Experience with LLM products and Kubernetes
${'We are a contract software company. '.repeat(8)}`;

describe('rounds', () => {
  it('gives planned rounds stable ids and trims them', () => {
    expect(
      toRounds([
        { name: ' Recruiter screen ', focus: 'Motivation' },
        { name: 'Technical', focus: 'System design' }
      ])
    ).toEqual([
      { id: 'r1', name: 'Recruiter screen', focus: 'Motivation' },
      { id: 'r2', name: 'Technical', focus: 'System design' }
    ]);
  });

  it('falls back to the usual rounds when none were planned, and caps a long list', () => {
    expect(toRounds([])).toEqual(DEFAULT_ROUNDS);
    expect(toRounds([{ name: '  ', focus: 'x' }])).toEqual(DEFAULT_ROUNDS);
    expect(
      toRounds(Array.from({ length: 9 }, (_, i) => ({ name: `Round ${i}`, focus: '' })))
    ).toHaveLength(6);
  });
});

describe('fit check', () => {
  it('reads a fit without a model: advert skills ticked when the CV names them', () => {
    const r = basicFit(
      ADVERT,
      'I have built Python services on AWS and shipped RAG and LLM features.'
    );
    expect(r.source).toBe('basic');
    expect(r.title).toBe('Senior AI Engineer');
    expect(r.company).toBe('Juro');
    const by = Object.fromEntries(r.fit!.asks.map((a) => [a.ask, a.covered]));
    expect(by.Python).toBe(true);
    expect(by.RAG).toBe(true);
    expect(by.TypeScript).toBe(false);
    expect(by.Kubernetes).toBe(false);
    expect(r.fit!.score).toBeGreaterThan(40);
    expect(r.fit!.score).toBeLessThan(100);
    expect(r.rounds).toEqual(DEFAULT_ROUNDS);
  });

  it('matches whole words only, so "Go" is not found in "good"', () => {
    const r = basicFit(`${ADVERT}\n- Go and Java`, 'A good engineer who writes JavaScript.');
    const by = Object.fromEntries(r.fit!.asks.map((a) => [a.ask, a.covered]));
    expect(by.Go).toBe(false);
    expect(by.Java).toBe(false);
  });

  it('gives no fit without a CV, but still plans the rounds', () => {
    const r = basicFit(ADVERT, null);
    expect(r.fit).toBeNull();
    expect(r.rounds.length).toBeGreaterThan(0);
  });

  it('tidies what the model returns', () => {
    const model = {
      title: ' Senior AI Engineer ',
      company: 'Juro',
      location: 'London',
      fit_score: 140,
      asks: [
        { ask: 'Python', covered: true, note: 'Six years at two companies.' },
        { ask: 'Mentoring', covered: false, note: 'No example in the CV.' },
        { ask: ' ', covered: true, note: '' }
      ],
      rounds: [{ name: 'Recruiter screen', focus: 'Motivation' }]
    };
    const r = fitFromModel(model, true);
    expect(r.title).toBe('Senior AI Engineer');
    expect(r.fit).toEqual({ score: 100, asks: model.asks.slice(0, 2) });
    expect(r.rounds).toEqual([{ id: 'r1', name: 'Recruiter screen', focus: 'Motivation' }]);
    // With no CV nothing can be covered, whatever the model said.
    expect(fitFromModel(model, false).fit).toBeNull();
  });

  it('writes the headline from the score and the gaps', () => {
    const ask = (covered: boolean) => ({ ask: 'x', covered, note: '' });
    expect(fitHeadline({ score: 78, asks: [ask(true), ask(false), ask(false), ask(false)] })).toBe(
      'Strong fit, 3 gaps'
    );
    expect(fitHeadline({ score: 62, asks: [ask(true), ask(false)] })).toBe('Good fit, 1 gap');
    expect(fitHeadline({ score: 45, asks: [ask(true)] })).toBe('Partial fit, no gaps');
    expect(fitHeadline({ score: 20, asks: [ask(false), ask(false)] })).toBe('A stretch, 2 gaps');
  });
});

describe('readiness', () => {
  const rounds: Round[] = [
    { id: 'r1', name: 'Recruiter screen', focus: '' },
    { id: 'r2', name: 'Hiring manager', focus: '' },
    { id: 'r3', name: 'Technical', focus: '' }
  ];
  const day = (n: number) => new Date(Date.UTC(2026, 10, n, 12));
  const practice = (over: Partial<Practice>): Practice => ({
    id: 'p',
    roundId: null,
    score: null,
    at: day(1),
    competencies: [],
    ...over
  });

  it('is empty before the first scored interview', () => {
    const r = readiness([practice({ score: null })], rounds);
    expect(r.score).toBeNull();
    expect(r.toPass).toBeNull();
    expect(r.sinceFirst).toBeNull();
    expect(r.practised).toBe(1);
    expect(r.rounds.map((x) => x.state)).toEqual(['next', 'todo', 'todo']);
    expect(r.nextRound?.id).toBe('r1');
    expect(r.skills).toEqual([]);
  });

  it('weights the latest scores most and holds back until every round is practised', () => {
    const r = readiness(
      [
        practice({ id: 'a', roundId: 'r1', score: 60, at: day(1) }),
        practice({ id: 'b', roundId: 'r2', score: 80, at: day(5) })
      ],
      rounds
    );
    // Average (80×5 + 60×4) / 9 = 71.1, with 2 of 3 rounds covered: × 0.9 = 64.
    expect(r.score).toBe(64);
    expect(r.toPass).toBe(PASS_MARK - 64);
    expect(r.sinceFirst).toBe(20);
    expect(r.rounds.map((x) => x.state)).toEqual(['done', 'done', 'next']);
    expect(r.rounds[1]).toMatchObject({ score: 80, count: 1 });
    expect(r.nextRound?.name).toBe('Technical');
  });

  it('reaches the full average once all rounds are covered, whatever order they were saved in', () => {
    const r = readiness(
      [
        practice({ id: 'c', roundId: 'r3', score: 90, at: day(9) }),
        practice({ id: 'a', roundId: 'r1', score: 60, at: day(1) }),
        practice({ id: 'b', roundId: 'r2', score: 80, at: day(5) })
      ],
      rounds
    );
    // (90×5 + 80×4 + 60×3) / 12 = 79.2
    expect(r.score).toBe(79);
    expect(r.toPass).toBe(0);
    expect(r.nextRound).toBeNull();
    expect(r.sinceFirst).toBe(30);
  });

  it('shows the latest score of a round practised twice, and only counts the five latest', () => {
    const many = [40, 50, 60, 70, 80, 90].map((score, i) =>
      practice({ id: `p${i}`, roundId: 'r1', score, at: day(i + 1) })
    );
    const r = readiness(many, [rounds[0]]);
    expect(r.rounds[0]).toMatchObject({ state: 'done', score: 90, count: 6 });
    // The 40 has dropped out: (90×5 + 80×4 + 70×3 + 60×2 + 50×1) / 15 = 76.7
    expect(r.score).toBe(77);
  });

  it('counts practice that is not tied to a round, but not as covering one', () => {
    const r = readiness([practice({ score: 80 })], rounds);
    expect(r.score).toBe(56);
    expect(r.rounds[0].state).toBe('next');
  });

  it('tracks each skill from the first try to the latest, on a 0 to 100 scale', () => {
    const r = readiness(
      [
        practice({
          id: 'a',
          score: 60,
          at: day(1),
          competencies: [
            { key: 'communication', score: 3 },
            { key: 'structure', score: 2 }
          ]
        }),
        practice({
          id: 'b',
          score: 70,
          at: day(4),
          competencies: [{ key: 'communication', score: 4 }]
        })
      ],
      []
    );
    expect(r.skills).toEqual([
      { key: 'communication', label: 'Communication', first: 60, latest: 80 },
      { key: 'structure', label: 'Answer structure', first: 40, latest: 40 }
    ]);
    // No rounds planned: nothing holds the average back.
    expect(r.score).toBe(66);
  });
});

describe('dates and names', () => {
  const now = new Date(Date.UTC(2026, 10, 26, 19, 30));

  it('counts whole days to the interview', () => {
    expect(daysUntil('2026-12-03', now)).toBe(7);
    expect(daysUntil('2026-11-26', now)).toBe(0);
    expect(daysUntil('2026-11-20', now)).toBe(-6);
  });

  it('says it the way a person would', () => {
    expect(formatDay('2026-12-03')).toBe('Thu 3 Dec');
    expect(countdown('2026-12-03', now)).toBe('in 7 days');
    expect(countdown('2026-11-27', now)).toBe('tomorrow');
    expect(countdown('2026-11-26', now)).toBe('today');
    expect(countdown('2026-11-25', now)).toBe('yesterday');
    expect(countdown('2026-11-20', now)).toBe('6 days ago');
    expect(whenLine('2026-12-03', now)).toBe('Interview Thu 3 Dec · in 7 days');
    expect(whenLine(null, now)).toBe('No date yet');
  });

  it('names jobs and their practice interviews', () => {
    const job = { title: 'Senior AI Engineer', company: 'Juro' };
    expect(jobName(job)).toBe('Senior AI Engineer · Juro');
    expect(jobName({ title: 'Nurse', company: '' })).toBe('Nurse');
    expect(practiceName(job, { id: 'r2', name: 'Hiring manager', focus: '' })).toBe(
      'Hiring manager · Juro'
    );
    expect(
      practiceName(
        { title: 'Nurse', company: '' },
        { id: 'r1', name: 'Recruiter screen', focus: '' }
      )
    ).toBe('Recruiter screen · Nurse');
    expect(practiceName(job, null)).toBe('Senior AI Engineer · Juro');
  });
});
