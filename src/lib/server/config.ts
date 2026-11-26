import { env } from '$env/dynamic/private';
import { DEFAULT_USD_PER_GBP } from '$lib/usage';

/** Central place for env-driven settings, so nothing else reads process env directly. */
export const config = {
  openai: {
    apiKey: () => env.OPENAI_API_KEY ?? '',
    /** Optional Cloudflare AI Gateway URL for scoring and chat (…/openai). Empty = call OpenAI directly. */
    baseURL: () => env.OPENAI_BASE_URL || undefined,
    realtimeModel: () => env.OPENAI_REALTIME_MODEL || 'gpt-realtime-2.1-mini',
    /**
     * Trimming for long calls: once the call so far passes this many tokens, OpenAI
     * drops the oldest half. 0 (the default) leaves trimming off. A minute of talk is
     * very roughly 900 tokens, so 8000 keeps about the last 5 to 9 minutes.
     */
    realtimeContextTokens: () => {
      const n = Math.floor(Number(env.OPENAI_REALTIME_CONTEXT_TOKENS));
      // Under 4000 the interviewer would forget what was said a couple of minutes ago. OpenAI
      // refuses a limit above the model's window less its reply allowance, which would stop
      // every call from starting, so the top is capped too (a limit that high barely trims).
      return Number.isFinite(n) && n > 0 ? Math.min(28_000, Math.max(4000, n)) : 0;
    },
    transcribeModel: () => env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe',
    analysisModel: () => env.OPENAI_ANALYSIS_MODEL || 'gpt-6-luna',
    chatModel: () => env.OPENAI_CHAT_MODEL || 'gpt-6-luna'
  },
  polar: {
    accessToken: () => env.POLAR_ACCESS_TOKEN ?? '',
    server: (): 'sandbox' | 'production' =>
      env.POLAR_SERVER === 'production' ? 'production' : 'sandbox'
  },
  unlimitedUsage: () => env.UNLIMITED_USAGE === 'true',
  /** Who may open the cost page. A secret (comma-separated emails), never a committed value. */
  adminEmails: () =>
    (env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  /** OpenAI bills in dollars; the cost page shows pounds. */
  usdPerGbp: () => {
    const n = Number(env.USD_PER_GBP);
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_USD_PER_GBP;
  }
};

export const FREE_LIMITS = {
  interviews: 5,
  interviewers: 3
} as const;

export { PLAN_MINUTES, callMinutes } from '$lib/plans';


/** Social providers whose credentials are configured. The sign-in page only shows these. */
export function configuredSocialProviders() {
  const out: ('github' | 'google' | 'microsoft')[] = [];
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) out.push('github');
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) out.push('google');
  if (env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET) out.push('microsoft');
  return out;
}
