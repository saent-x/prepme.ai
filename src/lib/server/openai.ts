import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { error } from '@sveltejs/kit';
import { config } from './config';
import { ScorecardSchema, type Scorecard, type TranscriptEntry } from '$lib/interview-types';
import type { Agent, Interview } from '$lib/db/schema';
import { buildAnalysisPrompt } from './prompts';
import { isVoice } from '$lib/templates';

let textClient: OpenAI | null = null;
let directClient: OpenAI | null = null;

function apiKey() {
  const key = config.openai.apiKey();
  if (!key) error(503, { message: 'OpenAI is not configured. Set OPENAI_API_KEY.' });
  return key;
}

/**
 * Client for scoring and the coach chat. Goes through Cloudflare AI Gateway when
 * OPENAI_BASE_URL is set (request logs, caching, rate and spend limits).
 */
export function openai() {
  textClient ??= new OpenAI({ apiKey: apiKey(), baseURL: config.openai.baseURL(), maxRetries: 2 });
  return textClient;
}

/** Direct client for minting realtime keys; the live audio itself never touches our server. */
function openaiDirect() {
  directClient ??= new OpenAI({ apiKey: apiKey(), maxRetries: 2 });
  return directClient;
}

/**
 * Mint a short-lived client secret for one browser realtime session.
 * The browser connects straight to OpenAI over WebRTC with it, so nothing
 * long-running has to live inside a serverless function (the cause of the
 * old "call stops abruptly" bug).
 */
export async function createRealtimeClientSecret(opts: { instructions: string; voice: string }) {
  const model = config.openai.realtimeModel();
  const client = openaiDirect();
  let secret;
  try {
    secret = await client.realtime.clientSecrets.create({
      // Only needs to live long enough for the browser to connect.
      expires_after: { anchor: 'created_at', seconds: 120 },
      session: {
        type: 'realtime',
        model,
        instructions: opts.instructions,
        output_modalities: ['audio'],
        audio: {
          input: {
            noise_reduction: { type: 'near_field' },
            transcription: { model: config.openai.transcribeModel(), language: 'en' },
            // semantic_vad waits for the candidate to finish a thought instead of
            // cutting in on short pauses, which matters in interviews.
            turn_detection: { type: 'semantic_vad', eagerness: 'low' }
          },
          output: { voice: isVoice(opts.voice) ? opts.voice : 'marin' }
        }
      }
    });
  } catch (e) {
    // Log the provider detail server-side; show the candidate something they can act on.
    console.error('[realtime] could not create client secret', e);
    const status = e instanceof OpenAI.APIError ? e.status : undefined;
    error(502, {
      message:
        status === 401 || status === 403
          ? 'The interviewer service is misconfigured (OpenAI key rejected). Please try again later.'
          : status === 429
            ? 'The interviewer service is busy right now. Please try again in a minute.'
            : 'Could not reach the interviewer service. Check your connection and try again.'
    });
  }
  return { value: secret.value, expiresAt: secret.expires_at, model };
}

/** Produce the structured scorecard plus a short markdown summary. */
export async function analyseInterview(opts: {
  agent: Pick<Agent, 'name' | 'instructions'>;
  interview: Pick<Interview, 'name' | 'jobDescription' | 'focus'>;
  candidateName: string;
  transcript: TranscriptEntry[];
}): Promise<{ scorecard: Scorecard; summary: string }> {
  const { system, user } = buildAnalysisPrompt(opts);
  const response = await openai().responses.parse({
    model: config.openai.analysisModel(),
    instructions: system,
    input: user,
    text: { format: zodTextFormat(ScorecardSchema, 'interview_scorecard') }
  });

  const scorecard = response.output_parsed;
  if (!scorecard) throw new Error('The analysis model returned no scorecard.');

  const summary = scorecardToMarkdown(scorecard);
  return { scorecard: normaliseScorecard(scorecard), summary };
}

/** Clamp numbers and make sure every competency appears exactly once. */
export function normaliseScorecard(s: Scorecard): Scorecard {
  const seen = new Set<string>();
  const competencies = s.competencies.filter((c) => {
    if (seen.has(c.key)) return false;
    seen.add(c.key);
    return true;
  });
  return {
    ...s,
    overall_score: Math.max(0, Math.min(100, Math.round(s.overall_score))),
    competencies: competencies.map((c) => ({ ...c, score: Math.max(1, Math.min(5, c.score)) })),
    questions: s.questions.map((q) => ({ ...q, score: Math.max(1, Math.min(5, q.score)) }))
  };
}

export function scorecardToMarkdown(s: Scorecard) {
  const lines = [
    `### Overview`,
    s.overview,
    '',
    `### Strengths`,
    ...s.strengths.map((x) => `- ${x}`)
  ];
  lines.push(
    '',
    '### What to improve',
    ...s.improvements.map((x) => `- **${x.title}.** ${x.detail}`)
  );
  return lines.join('\n');
}
