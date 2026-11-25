import { env } from '$env/dynamic/private';

/** Central place for env-driven settings, so nothing else reads process env directly. */
export const config = {
  openai: {
    apiKey: () => env.OPENAI_API_KEY ?? '',
    /** Optional Cloudflare AI Gateway URL for scoring and chat (…/openai). Empty = call OpenAI directly. */
    baseURL: () => env.OPENAI_BASE_URL || undefined,
    realtimeModel: () => env.OPENAI_REALTIME_MODEL || 'gpt-realtime-mini',
    transcribeModel: () => env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe',
    analysisModel: () => env.OPENAI_ANALYSIS_MODEL || 'gpt-6-luna',
    chatModel: () => env.OPENAI_CHAT_MODEL || 'gpt-6-luna'
  },
  polar: {
    accessToken: () => env.POLAR_ACCESS_TOKEN ?? '',
    server: (): 'sandbox' | 'production' =>
      env.POLAR_SERVER === 'production' ? 'production' : 'sandbox'
  },
  unlimitedUsage: () => env.UNLIMITED_USAGE === 'true'
};

export const FREE_LIMITS = {
  interviews: 5,
  interviewers: 3,
  /** Longest call a free user can start, in minutes. */
  maxMinutes: 20
} as const;

/** Social providers whose credentials are configured. The sign-in page only shows these. */
export function configuredSocialProviders() {
  const out: ('github' | 'google' | 'microsoft')[] = [];
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) out.push('github');
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) out.push('google');
  if (env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET) out.push('microsoft');
  return out;
}
