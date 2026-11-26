import { z } from 'zod';

/**
 * What the AI behind an interview costs: prices, token counting and the sums
 * for the cost page. Shared by the browser (which sees the live voice usage)
 * and the server (which stores it), so everything here is plain and testable.
 */

// ---------------------------------------------------------------------------
// Prices
// ---------------------------------------------------------------------------

/** US dollars per one million tokens. */
export type ModelPrice = {
  inputText: number;
  cachedText: number;
  outputText: number;
  inputAudio?: number;
  cachedAudio?: number;
  outputAudio?: number;
  /** US dollars per minute of audio, for usage that is reported by length instead of tokens. */
  perMinute?: number;
};

/**
 * Read from OpenAI's pricing pages on 26 November 2026. When OpenAI changes a
 * price or a model is swapped, update this table: rows already stored keep the
 * cost they were given at the time.
 */
export const MODEL_PRICES: Record<string, ModelPrice> = {
  'gpt-realtime-2.1-mini': {
    inputText: 0.6,
    cachedText: 0.06,
    outputText: 2.4,
    inputAudio: 10,
    cachedAudio: 0.3,
    outputAudio: 20
  },
  'gpt-realtime-2.1': {
    inputText: 4,
    cachedText: 0.4,
    outputText: 24,
    inputAudio: 32,
    cachedAudio: 0.4,
    outputAudio: 64
  },
  'gpt-6-luna': { inputText: 0.05, cachedText: 0.005, outputText: 0.25 },
  // The model page lists one input price for audio and text alike.
  'gpt-4o-mini-transcribe': {
    inputText: 1.25,
    cachedText: 1.25,
    outputText: 5,
    inputAudio: 1.25,
    cachedAudio: 1.25,
    perMinute: 0.003
  }
};

/** Price for a model name, also matching dated snapshots such as "gpt-6-luna-2026-09-01". */
export function priceFor(model: string): ModelPrice | null {
  return MODEL_PRICES[model] ?? MODEL_PRICES[model.replace(/-\d{4}-\d{2}-\d{2}$/, '')] ?? null;
}

// ---------------------------------------------------------------------------
// Token counts
// ---------------------------------------------------------------------------

/** Input counts include the cached part; the cached counts are the share re-read at the cheaper rate. */
export type Tokens = {
  inputText: number;
  inputAudio: number;
  cachedText: number;
  cachedAudio: number;
  outputText: number;
  outputAudio: number;
};

export const TOKEN_KEYS = [
  'inputText',
  'inputAudio',
  'cachedText',
  'cachedAudio',
  'outputText',
  'outputAudio'
] as const satisfies readonly (keyof Tokens)[];

export const zeroTokens = (): Tokens => ({
  inputText: 0,
  inputAudio: 0,
  cachedText: 0,
  cachedAudio: 0,
  outputText: 0,
  outputAudio: 0
});

/** A whole number of tokens from whatever the API sent (missing, negative or fractional becomes 0 or rounds). */
const n = (v: unknown) =>
  typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.round(v) : 0;

type Loose = Record<string, unknown> | null | undefined;
const obj = (v: unknown): Loose =>
  v && typeof v === 'object' ? (v as Record<string, unknown>) : null;

/** Token counts from the `usage` of a realtime `response.done` event. */
export function tokensFromRealtime(usage: unknown): Tokens {
  const u = obj(usage);
  const input = obj(u?.input_token_details);
  const cached = obj(input?.cached_tokens_details);
  const output = obj(u?.output_token_details);

  const inputText = n(input?.text_tokens);
  // With no split at all, the total counts as audio: most of a voice call is, and the cost is not understated.
  const inputAudio = input ? n(input.audio_tokens) : n(u?.input_tokens);
  let cachedText = n(cached?.text_tokens);
  let cachedAudio = n(cached?.audio_tokens);
  // Only a cached total, no split: share it out the way the input itself splits.
  if (!cached && n(input?.cached_tokens) && inputText + inputAudio > 0) {
    cachedAudio = Math.round((n(input?.cached_tokens) * inputAudio) / (inputText + inputAudio));
    cachedText = n(input?.cached_tokens) - cachedAudio;
  }
  return {
    inputText,
    inputAudio,
    cachedText: Math.min(cachedText, inputText),
    cachedAudio: Math.min(cachedAudio, inputAudio),
    outputText: n(output?.text_tokens),
    outputAudio: output ? n(output.audio_tokens) : n(u?.output_tokens)
  };
}

/** Token counts from the `usage` of a Responses API reply (scoring and the coach chat). */
export function tokensFromResponse(usage: unknown): Tokens {
  const u = obj(usage);
  const inputText = n(u?.input_tokens);
  return {
    ...zeroTokens(),
    inputText,
    cachedText: Math.min(n(obj(u?.input_tokens_details)?.cached_tokens), inputText),
    outputText: n(u?.output_tokens)
  };
}

/** Usage of one live transcription (`conversation.item.input_audio_transcription.completed`). */
export function transcriptionFromEvent(usage: unknown): Transcription {
  const u = obj(usage);
  if (u?.type === 'duration')
    return { inputText: 0, inputAudio: 0, outputText: 0, seconds: n(u.seconds) };
  const details = obj(u?.input_token_details);
  const inputAudio = n(details?.audio_tokens);
  // No text count given: it is whatever the total holds beyond the audio.
  const inputText =
    details?.text_tokens != null
      ? n(details.text_tokens)
      : Math.max(0, n(u?.input_tokens) - inputAudio);
  return { inputText, inputAudio, outputText: n(u?.output_tokens), seconds: 0 };
}

// ---------------------------------------------------------------------------
// Cost
// ---------------------------------------------------------------------------

/**
 * Cost in millionths of a US dollar, split by what was paid for. Prices are per
 * million tokens, so tokens × price is already in millionths of a dollar.
 */
export function costParts(model: string, t: Tokens, seconds = 0) {
  const p = priceFor(model);
  if (!p) return null;
  const audioIn = p.inputAudio ?? p.inputText;
  const audioCached = p.cachedAudio ?? p.cachedText;
  const audioOut = p.outputAudio ?? p.outputText;
  // Cached tokens are part of the input, so a report claiming more cached than input cannot go negative.
  const cachedText = Math.min(t.cachedText, t.inputText);
  const cachedAudio = Math.min(t.cachedAudio, t.inputAudio);
  const freshInput =
    (t.inputText - cachedText) * p.inputText + (t.inputAudio - cachedAudio) * audioIn;
  const cachedInput = cachedText * p.cachedText + cachedAudio * audioCached;
  const output = t.outputText * p.outputText + t.outputAudio * audioOut;
  const byLength = (seconds / 60) * (p.perMinute ?? 0) * 1_000_000;
  return { freshInput, cachedInput, output: output + byLength };
}

/** Total cost in millionths of a US dollar, or null when the model has no price here. */
export function costMicros(model: string, t: Tokens, seconds = 0): number | null {
  const parts = costParts(model, t, seconds);
  return parts ? Math.round(parts.freshInput + parts.cachedInput + parts.output) : null;
}

// ---------------------------------------------------------------------------
// What the browser reports about a live voice session
// ---------------------------------------------------------------------------

const count = z.number().int().min(0).max(100_000_000);

const TokensSchema = z.object({
  inputText: count,
  inputAudio: count,
  cachedText: count,
  cachedAudio: count,
  outputText: count,
  outputAudio: count
});

const TranscriptionSchema = z.object({
  inputText: count,
  inputAudio: count,
  outputText: count,
  /** Seconds of audio, when the transcriber bills by length. */
  seconds: z.number().int().min(0).max(86_400)
});

export const VoiceUsageSchema = z.object({
  /** Which live session of the interview this is (1 = first start, 2+ = reconnects and reloads). */
  session: z.number().int().min(1).max(1000),
  /** Seconds the session has been connected. */
  seconds: z.number().int().min(0).max(86_400),
  /** Interviewer replies so far. */
  responses: z.number().int().min(0).max(100_000),
  voice: TokensSchema,
  transcription: TranscriptionSchema
});

/** Running totals, one entry per live session, re-sent in full each time. */
export const VoiceUsageListSchema = z.array(VoiceUsageSchema).max(40);

export type Transcription = z.infer<typeof TranscriptionSchema>;
export type VoiceUsage = z.infer<typeof VoiceUsageSchema>;

export function newVoiceUsage(session: number): VoiceUsage {
  return {
    session,
    seconds: 0,
    responses: 0,
    voice: zeroTokens(),
    transcription: { inputText: 0, inputAudio: 0, outputText: 0, seconds: 0 }
  };
}

/** Add one finished interviewer reply. Returns the input tokens that reply read. */
export function addRealtimeResponse(into: VoiceUsage, usage: unknown) {
  const t = tokensFromRealtime(usage);
  for (const k of TOKEN_KEYS) into.voice[k] += t[k];
  into.responses += 1;
  return t.inputText + t.inputAudio;
}

export function addTranscription(into: VoiceUsage, usage: unknown) {
  const t = transcriptionFromEvent(usage);
  into.transcription.inputText += t.inputText;
  into.transcription.inputAudio += t.inputAudio;
  into.transcription.outputText += t.outputText;
  into.transcription.seconds += t.seconds;
}

/** Nothing was measured: the session never got as far as a reply. */
export const isEmptyUsage = (u: VoiceUsage) =>
  u.responses === 0 &&
  u.seconds === 0 &&
  u.transcription.outputText === 0 &&
  u.transcription.seconds === 0;

// ---------------------------------------------------------------------------
// The cost report
// ---------------------------------------------------------------------------

export type UsageKindName = 'voice' | 'transcription' | 'scoring' | 'chat' | 'fit' | 'redo';

/** The columns of a stored usage row that the report needs. */
export type UsageRow = Tokens & {
  interviewId: string | null;
  kind: UsageKindName;
  model: string;
  session: number | null;
  seconds: number;
  contextLimit: number;
  responses: number;
  costMicros: number | null;
  createdAt: Date;
};

export type InterviewCost = {
  interviewId: string;
  at: Date;
  /** Connected voice time across every session of the interview. */
  voiceSeconds: number;
  sessions: number;
  responses: number;
  trimmed: boolean;
  /** False when some of its voice or transcription has no price here, so its cost is not the whole cost. */
  priced: boolean;
  /** Share of the voice input that was re-read at the cheap cached rate (0..1). */
  cachedShare: number | null;
  voice: number;
  transcription: number;
  scoring: number;
  chat: number;
  total: number;
};

export const LENGTH_BUCKETS = [
  { label: 'Under 5 min', from: 0, to: 5 },
  { label: '5 to 12 min', from: 5, to: 12 },
  { label: '12 to 22 min', from: 12, to: 22 },
  { label: '22 to 35 min', from: 22, to: 35 },
  { label: 'Over 35 min', from: 35, to: Infinity }
] as const;

type Group = { interviews: number; minutes: number; micros: number };
const rate = (g: Group) => (g.minutes > 0 ? g.micros / g.minutes : null);

/**
 * Cost per voice minute over interviews of a given length. Long calls cost more
 * per minute than short ones (the interviewer re-reads the call so far on every
 * turn), so a plan's cost has to use the rate of the call length it allows.
 */
export function minuteRate(interviews: InterviewCost[], fromMinutes = 0, toMinutes = Infinity) {
  const g: Group = { interviews: 0, minutes: 0, micros: 0 };
  for (const i of interviews) {
    const minutes = i.voiceSeconds / 60;
    // A call with unpriced usage would drag the rate down, so it is left out rather than counted as free.
    if (!i.priced || minutes <= 0 || minutes < fromMinutes || minutes >= toMinutes) continue;
    g.interviews += 1;
    g.minutes += minutes;
    g.micros += i.voice + i.transcription;
  }
  return { ...g, perMinute: rate(g) };
}

/** Everything the cost page shows, from the stored usage rows. All money is in millionths of a US dollar. */
export function buildCostReport(rows: UsageRow[]) {
  const byInterview = new Map<
    string,
    InterviewCost & { input: number; cached: number; sessionIds: Set<number> }
  >();
  const split = {
    voiceOutput: 0,
    voiceFresh: 0,
    voiceCached: 0,
    transcription: 0,
    scoring: 0,
    chat: 0,
    fit: 0,
    redo: 0
  };
  const unpriced = new Set<string>();
  let input = 0;
  let cached = 0;
  /** Spend that is not part of what an interview itself cost: fit checks for a job, and answer redos afterwards. */
  let outside = 0;

  for (const r of rows) {
    if (r.kind === 'fit' || r.kind === 'redo') {
      if (r.costMicros == null) unpriced.add(r.model);
      split[r.kind] += r.costMicros ?? 0;
      outside += r.costMicros ?? 0;
      continue;
    }
    const id = r.interviewId ?? 'unknown';
    let i = byInterview.get(id);
    if (!i) {
      i = {
        interviewId: id,
        at: r.createdAt,
        voiceSeconds: 0,
        sessions: 0,
        responses: 0,
        trimmed: false,
        priced: true,
        cachedShare: null,
        voice: 0,
        transcription: 0,
        scoring: 0,
        chat: 0,
        total: 0,
        input: 0,
        cached: 0,
        sessionIds: new Set()
      };
      byInterview.set(id, i);
    }
    if (r.createdAt < i.at) i.at = r.createdAt;
    if (r.costMicros == null) {
      unpriced.add(r.model);
      if (r.kind === 'voice' || r.kind === 'transcription') i.priced = false;
    }
    const cost = r.costMicros ?? 0;
    i[r.kind] += cost;
    i.total += cost;

    if (r.kind === 'voice') {
      i.voiceSeconds += r.seconds;
      i.responses += r.responses;
      if (r.session != null) i.sessionIds.add(r.session);
      if (r.contextLimit > 0) i.trimmed = true;
      i.input += r.inputText + r.inputAudio;
      i.cached += r.cachedText + r.cachedAudio;
      input += r.inputText + r.inputAudio;
      cached += r.cachedText + r.cachedAudio;
      // Today's prices give the shares; the amount is what was stored when the call happened,
      // so the parts still add up to the total after a price change.
      const parts = costParts(r.model, r);
      const now = parts ? parts.output + parts.freshInput + parts.cachedInput : 0;
      if (parts && now > 0) {
        const scale = cost / now;
        split.voiceOutput += parts.output * scale;
        split.voiceFresh += parts.freshInput * scale;
        split.voiceCached += parts.cachedInput * scale;
      }
    } else {
      split[r.kind] += cost;
    }
  }

  const interviews: InterviewCost[] = [...byInterview.values()]
    .map(({ input, cached, sessionIds, ...i }) => ({
      ...i,
      sessions: sessionIds.size,
      cachedShare: input > 0 ? cached / input : null
    }))
    .sort((a, b) => b.at.getTime() - a.at.getTime());

  const withVoice = interviews.filter((i) => i.voiceSeconds > 0);
  const total = interviews.reduce((s, i) => s + i.total, 0) + outside;
  const scored = interviews.filter((i) => i.scoring > 0);
  const overall = minuteRate(interviews);

  const group = (list: InterviewCost[]) => {
    const g = minuteRate(list);
    return {
      interviews: g.interviews,
      averageMinutes: g.interviews ? g.minutes / g.interviews : null,
      averageCost: g.interviews ? list.reduce((s, i) => s + i.total, 0) / g.interviews : null,
      perMinute: g.perMinute
    };
  };

  return {
    interviews,
    totals: {
      interviews: withVoice.length,
      total,
      averagePerInterview: withVoice.length
        ? withVoice.reduce((s, i) => s + i.total, 0) / withVoice.length
        : null,
      voiceMinutes: overall.minutes,
      /** Voice and transcription, the part that grows with talking time. */
      perVoiceMinute: overall.perMinute,
      /** Scoring is paid once per interview, whatever its length. */
      scoringPerInterview: scored.length
        ? scored.reduce((s, i) => s + i.scoring, 0) / scored.length
        : null,
      cachedShare: input > 0 ? cached / input : null
    },
    split: [
      { key: 'voiceOutput', label: 'Interviewer speaking', micros: split.voiceOutput },
      { key: 'voiceFresh', label: 'Listening to new audio', micros: split.voiceFresh },
      { key: 'voiceCached', label: 'Re-reading the call so far', micros: split.voiceCached },
      { key: 'transcription', label: 'Live transcript', micros: split.transcription },
      { key: 'scoring', label: 'Scoring', micros: split.scoring },
      { key: 'chat', label: 'Coach chat', micros: split.chat },
      { key: 'fit', label: 'Fit checks', micros: split.fit },
      { key: 'redo', label: 'Answer redos', micros: split.redo }
    ].sort((a, b) => b.micros - a.micros),
    buckets: LENGTH_BUCKETS.map((b) => ({
      label: b.label,
      ...group(withVoice.filter((i) => i.voiceSeconds / 60 >= b.from && i.voiceSeconds / 60 < b.to))
    })),
    trimming: {
      off: group(withVoice.filter((i) => !i.trimmed)),
      on: group(withVoice.filter((i) => i.trimmed))
    },
    unpriced: [...unpriced].sort()
  };
}

export type CostReport = ReturnType<typeof buildCostReport>;

// ---------------------------------------------------------------------------
// Showing money
// ---------------------------------------------------------------------------

/** OpenAI bills in dollars; the plans are priced in pounds. Override with USD_PER_GBP. */
export const DEFAULT_USD_PER_GBP = 1.27;

/** 180_000 millionths of a dollar → "£0.14"; small amounts in pence ("1.4p"). */
export function formatCost(micros: number | null | undefined, usdPerGbp = DEFAULT_USD_PER_GBP) {
  if (micros == null || !Number.isFinite(micros)) return '—';
  const pounds = micros / 1_000_000 / usdPerGbp;
  if (pounds === 0) return '£0';
  if (pounds < 0.1) return `${(pounds * 100).toFixed(1)}p`;
  return `£${pounds.toFixed(2)}`;
}

export function formatDollars(micros: number | null | undefined) {
  if (micros == null || !Number.isFinite(micros)) return '—';
  const dollars = micros / 1_000_000;
  return dollars > 0 && dollars < 0.1 ? `$${dollars.toFixed(3)}` : `$${dollars.toFixed(2)}`;
}
