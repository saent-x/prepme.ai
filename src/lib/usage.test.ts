import { describe, expect, it } from 'vitest';
import {
  addRealtimeResponse,
  addTranscription,
  buildCostReport,
  costMicros,
  costParts,
  formatCost,
  isEmptyUsage,
  minuteRate,
  newVoiceUsage,
  priceFor,
  tokensFromRealtime,
  tokensFromResponse,
  transcriptionFromEvent,
  VoiceUsageListSchema,
  zeroTokens,
  type UsageRow
} from './usage';

/** A `response.done` usage block, shaped as OpenAI's realtime API sends it. */
const realtimeUsage = {
  total_tokens: 5300,
  input_tokens: 5000,
  output_tokens: 300,
  input_token_details: {
    text_tokens: 1000,
    audio_tokens: 4000,
    cached_tokens: 3800,
    cached_tokens_details: { text_tokens: 800, audio_tokens: 3000 }
  },
  output_token_details: { text_tokens: 60, audio_tokens: 240 }
};

describe('prices', () => {
  it('knows the models the app runs on, including dated snapshots', () => {
    expect(priceFor('gpt-realtime-2.1-mini')?.outputAudio).toBe(20);
    expect(priceFor('gpt-6-luna-2026-09-01')).toEqual(priceFor('gpt-6-luna'));
    expect(priceFor('some-future-model')).toBeNull();
  });
});

describe('reading usage from OpenAI', () => {
  it('splits a realtime reply into text, audio and their cached parts', () => {
    expect(tokensFromRealtime(realtimeUsage)).toEqual({
      inputText: 1000,
      inputAudio: 4000,
      cachedText: 800,
      cachedAudio: 3000,
      outputText: 60,
      outputAudio: 240
    });
  });

  it('shares out a cached total when OpenAI gives no split', () => {
    const t = tokensFromRealtime({
      input_token_details: { text_tokens: 1000, audio_tokens: 3000, cached_tokens: 2000 }
    });
    expect(t.cachedAudio).toBe(1500);
    expect(t.cachedText).toBe(500);
  });

  it('never counts more cached tokens than there was input, and survives junk', () => {
    const t = tokensFromRealtime({
      input_token_details: {
        text_tokens: 10,
        audio_tokens: 0,
        cached_tokens_details: { text_tokens: 99, audio_tokens: 5 }
      }
    });
    expect(t.cachedText).toBe(10);
    expect(t.cachedAudio).toBe(0);
    expect(tokensFromRealtime(undefined)).toEqual(zeroTokens());
    expect(
      tokensFromRealtime({ input_token_details: { text_tokens: 'lots', audio_tokens: -4 } })
    ).toEqual(zeroTokens());
  });

  it('keeps the totals when OpenAI leaves the text and audio split out', () => {
    expect(tokensFromRealtime({ input_tokens: 5000, output_tokens: 300 })).toEqual({
      ...zeroTokens(),
      inputAudio: 5000,
      outputAudio: 300
    });
  });

  it('reads scoring and chat replies', () => {
    expect(
      tokensFromResponse({
        input_tokens: 9000,
        output_tokens: 1200,
        input_tokens_details: { cached_tokens: 4000 }
      })
    ).toEqual({ ...zeroTokens(), inputText: 9000, cachedText: 4000, outputText: 1200 });
  });

  it('reads transcription billed by tokens or by length', () => {
    expect(
      transcriptionFromEvent({
        type: 'tokens',
        input_tokens: 130,
        output_tokens: 40,
        total_tokens: 170,
        input_token_details: { audio_tokens: 120, text_tokens: 10 }
      })
    ).toEqual({ inputText: 10, inputAudio: 120, outputText: 40, seconds: 0 });
    // No text count: it is the rest of the total.
    expect(
      transcriptionFromEvent({
        type: 'tokens',
        input_tokens: 130,
        output_tokens: 40,
        input_token_details: { audio_tokens: 120 }
      })
    ).toMatchObject({ inputText: 10, inputAudio: 120 });
    expect(transcriptionFromEvent({ type: 'duration', seconds: 12.4 })).toEqual({
      inputText: 0,
      inputAudio: 0,
      outputText: 0,
      seconds: 12
    });
  });
});

describe('cost', () => {
  it('prices fresh input, cached input and output separately', () => {
    const parts = costParts('gpt-realtime-2.1-mini', tokensFromRealtime(realtimeUsage))!;
    // Fresh: 200 text at $0.60 and 1000 audio at $10 per million.
    expect(parts.freshInput).toBeCloseTo(200 * 0.6 + 1000 * 10);
    // Cached: 800 text at $0.06 and 3000 audio at $0.30.
    expect(parts.cachedInput).toBeCloseTo(800 * 0.06 + 3000 * 0.3);
    // Output: 60 text at $2.40 and 240 audio at $20.
    expect(parts.output).toBeCloseTo(60 * 2.4 + 240 * 20);
    expect(costMicros('gpt-realtime-2.1-mini', tokensFromRealtime(realtimeUsage))).toBe(
      Math.round(parts.freshInput + parts.cachedInput + parts.output)
    );
  });

  it('never goes negative when a report claims more cached tokens than input', () => {
    const t = { ...zeroTokens(), inputAudio: 100, cachedAudio: 200 };
    expect(costMicros('gpt-realtime-2.1-mini', t)).toBe(Math.round(100 * 0.3));
  });

  it('is in millionths of a dollar: a million output audio tokens on mini cost $20', () => {
    expect(costMicros('gpt-realtime-2.1-mini', { ...zeroTokens(), outputAudio: 1_000_000 })).toBe(
      20_000_000
    );
  });

  it('prices audio billed by length, and gives null for a model with no price', () => {
    expect(costMicros('gpt-4o-mini-transcribe', zeroTokens(), 600)).toBe(30_000);
    expect(costMicros('some-future-model', { ...zeroTokens(), inputText: 5 })).toBeNull();
  });
});

describe('the running totals the browser keeps', () => {
  it('adds up replies and transcriptions', () => {
    const u = newVoiceUsage(2);
    expect(isEmptyUsage(u)).toBe(true);
    expect(addRealtimeResponse(u, realtimeUsage)).toBe(5000);
    addRealtimeResponse(u, realtimeUsage);
    addTranscription(u, {
      type: 'tokens',
      input_tokens: 100,
      output_tokens: 30,
      input_token_details: { audio_tokens: 100 }
    });
    expect(u.responses).toBe(2);
    expect(u.voice.inputAudio).toBe(8000);
    expect(u.voice.outputAudio).toBe(480);
    expect(u.transcription).toEqual({ inputText: 0, inputAudio: 100, outputText: 30, seconds: 0 });
    expect(isEmptyUsage(u)).toBe(false);
    expect(VoiceUsageListSchema.safeParse([u]).success).toBe(true);
  });

  it('rejects reports that cannot be real', () => {
    const u = newVoiceUsage(1);
    expect(VoiceUsageListSchema.safeParse([{ ...u, session: 0 }]).success).toBe(false);
    expect(VoiceUsageListSchema.safeParse([{ ...u, seconds: -1 }]).success).toBe(false);
    expect(
      VoiceUsageListSchema.safeParse([{ ...u, voice: { ...u.voice, inputAudio: 1.5 } }]).success
    ).toBe(false);
    expect(VoiceUsageListSchema.safeParse('nope').success).toBe(false);
  });
});

describe('the cost report', () => {
  const at = (minute: number) => new Date(Date.UTC(2026, 10, 26, 12, minute));
  const row = (over: Partial<UsageRow>): UsageRow => ({
    ...zeroTokens(),
    interviewId: 'a',
    kind: 'voice',
    model: 'gpt-realtime-2.1-mini',
    session: 1,
    seconds: 0,
    contextLimit: 0,
    responses: 0,
    costMicros: 0,
    createdAt: at(0),
    ...over
  });

  // Interview a: 10 minutes over two connections, scored, one chat reply. Interview b: 30 minutes, trimmed.
  const rows: UsageRow[] = [
    row({
      seconds: 400,
      responses: 10,
      inputAudio: 10_000,
      cachedAudio: 8000,
      outputAudio: 5000,
      costMicros: 122_400
    }),
    row({
      session: 2,
      seconds: 200,
      responses: 5,
      inputAudio: 4000,
      cachedAudio: 2000,
      costMicros: 20_600,
      createdAt: at(7)
    }),
    row({ kind: 'transcription', model: 'gpt-4o-mini-transcribe', costMicros: 3000 }),
    row({
      kind: 'scoring',
      model: 'gpt-6-luna',
      session: null,
      costMicros: 800,
      createdAt: at(11)
    }),
    row({ kind: 'chat', model: 'gpt-6-luna', session: null, costMicros: 200, createdAt: at(15) }),
    row({
      interviewId: 'b',
      seconds: 1800,
      contextLimit: 8000,
      responses: 60,
      costMicros: 900_000,
      createdAt: at(30)
    }),
    row({
      interviewId: 'b',
      kind: 'scoring',
      model: 'gpt-6-luna',
      session: null,
      costMicros: 1200,
      createdAt: at(61)
    })
  ];
  const report = buildCostReport(rows);

  it('adds each interview up, newest first', () => {
    expect(report.interviews.map((i) => i.interviewId)).toEqual(['b', 'a']);
    const a = report.interviews[1];
    expect(a).toMatchObject({
      voiceSeconds: 600,
      sessions: 2,
      responses: 15,
      trimmed: false,
      voice: 143_000,
      transcription: 3000,
      scoring: 800,
      chat: 200,
      total: 147_000
    });
    expect(a.at).toEqual(at(0));
    expect(a.cachedShare).toBeCloseTo(10_000 / 14_000);
    expect(report.interviews[0].trimmed).toBe(true);
  });

  it('gives the totals the pricing depends on', () => {
    expect(report.totals.interviews).toBe(2);
    expect(report.totals.total).toBe(147_000 + 901_200);
    expect(report.totals.averagePerInterview).toBe((147_000 + 901_200) / 2);
    expect(report.totals.voiceMinutes).toBe(40);
    // Voice and transcription only: scoring and chat do not grow with talking time.
    expect(report.totals.perVoiceMinute).toBe((143_000 + 3000 + 900_000) / 40);
    expect(report.totals.scoringPerInterview).toBe(1000);
  });

  it('shows that long calls cost more per minute', () => {
    const short = report.buckets.find((b) => b.label === '5 to 12 min')!;
    const long = report.buckets.find((b) => b.label === '22 to 35 min')!;
    expect(short.interviews).toBe(1);
    expect(short.perMinute).toBe(14_600);
    expect(long.perMinute).toBe(30_000);
    expect(report.buckets.find((b) => b.label === 'Under 5 min')).toMatchObject({
      interviews: 0,
      perMinute: null
    });
    expect(minuteRate(report.interviews, 21, 39).perMinute).toBe(30_000);
    expect(minuteRate(report.interviews, 40).perMinute).toBeNull();
  });

  it('compares trimmed calls with untrimmed ones', () => {
    expect(report.trimming.off.interviews).toBe(1);
    expect(report.trimming.on).toMatchObject({
      interviews: 1,
      averageMinutes: 30,
      perMinute: 30_000
    });
  });

  it('splits the spend by what was paid for, biggest first', () => {
    const split = Object.fromEntries(report.split.map((s) => [s.key, s.micros]));
    expect(split.voiceOutput).toBeCloseTo(5000 * 20);
    expect(split.voiceFresh).toBeCloseTo(4000 * 10);
    expect(split.voiceCached).toBeCloseTo(10_000 * 0.3);
    expect(split.scoring).toBe(2000);
    expect(split.chat).toBe(200);
    expect(report.split[0].key).toBe('voiceOutput');
  });

  it('counts fit checks in the spend without treating them as interviews', () => {
    const withFit = buildCostReport([
      ...rows,
      row({ interviewId: null, kind: 'fit', model: 'gpt-6-luna', session: null, costMicros: 500 })
    ]);
    expect(withFit.interviews).toHaveLength(2);
    expect(withFit.totals.total).toBe(report.totals.total + 500);
    expect(withFit.totals.averagePerInterview).toBe(report.totals.averagePerInterview);
    expect(withFit.split.find((s) => s.key === 'fit')?.micros).toBe(500);
  });

  it('counts answer redos in the spend without adding them to the interview they follow', () => {
    const id = rows[0].interviewId;
    const before = report.interviews.find((i) => i.interviewId === id)!.total;
    const withRedo = buildCostReport([
      ...rows,
      row({ interviewId: id, kind: 'redo', model: 'gpt-6-luna', session: null, costMicros: 300 }),
      row({ interviewId: id, kind: 'redo', model: 'gpt-4o-mini-transcribe', session: null, costMicros: 6000 })
    ]);
    expect(withRedo.interviews).toHaveLength(2);
    expect(withRedo.interviews.find((i) => i.interviewId === id)!.total).toBe(before);
    expect(withRedo.totals.total).toBe(report.totals.total + 6300);
    expect(withRedo.totals.perVoiceMinute).toBe(report.totals.perVoiceMinute);
    expect(withRedo.split.find((s) => s.key === 'redo')?.micros).toBe(6300);
  });

  it('shows question bank work as its own line outside any interview', () => {
    const withBank = buildCostReport([
      ...rows,
      row({ interviewId: null, kind: 'bank', model: 'gpt-6-luna', session: null, costMicros: 900 })
    ]);
    expect(withBank.interviews).toHaveLength(2);
    expect(withBank.totals.total).toBe(report.totals.total + 900);
    expect(withBank.split.find((s) => s.key === 'bank')?.micros).toBe(900);
  });

  it('keeps the split equal to what was stored, even after a price change', () => {
    // Stored at half of what today's prices would give.
    const voice = row({ inputAudio: 1000, outputAudio: 1000, costMicros: 15_000 });
    const r = buildCostReport([voice]);
    const parts = Object.fromEntries(r.split.map((s) => [s.key, s.micros]));
    expect(parts.voiceOutput + parts.voiceFresh + parts.voiceCached).toBeCloseTo(15_000);
    expect(parts.voiceOutput).toBeCloseTo(10_000);
  });

  it('leaves calls with no price out of the per-minute rate', () => {
    const r = buildCostReport([
      row({ seconds: 600, costMicros: 60_000 }),
      row({ interviewId: 'c', model: 'mystery', seconds: 600, costMicros: null })
    ]);
    expect(r.interviews.find((i) => i.interviewId === 'c')?.priced).toBe(false);
    expect(r.totals.perVoiceMinute).toBeCloseTo(6000);
    // Only unpriced calls: no rate at all, rather than a rate of zero.
    expect(
      buildCostReport([row({ model: 'mystery', seconds: 600, costMicros: null })]).totals
        .perVoiceMinute
    ).toBeNull();
  });

  it('names models it has no price for, and copes with nothing at all', () => {
    expect(report.unpriced).toEqual([]);
    expect(buildCostReport([row({ model: 'mystery', costMicros: null })]).unpriced).toEqual([
      'mystery'
    ]);
    const empty = buildCostReport([]);
    expect(empty.interviews).toEqual([]);
    expect(empty.totals).toMatchObject({
      interviews: 0,
      averagePerInterview: null,
      perVoiceMinute: null,
      cachedShare: null
    });
  });
});

describe('formatCost', () => {
  it('shows pounds, and pence for small amounts', () => {
    expect(formatCost(1_270_000, 1.27)).toBe('£1.00');
    expect(formatCost(17_780, 1.27)).toBe('1.4p');
    expect(formatCost(0)).toBe('£0');
    expect(formatCost(null)).toBe('—');
  });
});
