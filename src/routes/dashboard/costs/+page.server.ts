import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { requireUserPage } from '$lib/server/guard';
import { config } from '$lib/server/config';
import { getCostReport, isAdmin } from '$lib/server/usage';
import { minuteRate } from '$lib/usage';
import { PLAN_MINUTES } from '$lib/plans';

const PERIODS = [7, 30, 90];

/**
 * The plans being considered (not on sale yet), to see what each would cost in
 * AI usage if a customer used all of its voice time. Prices are in pounds.
 */
const PLANNED = [
  {
    name: 'Free',
    allowance: '3 interviews of 10 min',
    price: 0,
    voiceMinutes: 30,
    callMinutes: PLAN_MINUTES.free
  },
  {
    name: 'Sprint',
    allowance: '2 voice hours in 14 days',
    price: 9,
    voiceMinutes: 120,
    callMinutes: PLAN_MINUTES.pro
  },
  {
    name: 'Pro',
    allowance: '4 voice hours a month',
    price: 14,
    voiceMinutes: 240,
    callMinutes: PLAN_MINUTES.pro
  }
];

export const load: PageServerLoad = async (event) => {
  const user = requireUserPage(event);
  // Same answer as a page that does not exist, so the page's address gives nothing away.
  if (!isAdmin(user.email)) error(404, { message: 'Not Found' });

  const asked = Number(event.url.searchParams.get('days'));
  const days = PERIODS.includes(asked) ? asked : 30;
  const report = await getCostReport(days);
  const usdPerGbp = config.usdPerGbp();
  const overall = report.totals.perVoiceMinute;

  const plans = PLANNED.map((p) => {
    // Long calls cost more per minute, so use the rate of calls about as long as the plan allows.
    const similar = minuteRate(report.interviews, p.callMinutes * 0.7, p.callMinutes * 1.3);
    const perMinute = similar.perMinute ?? overall;
    const scoring = (report.totals.scoringPerInterview ?? 0) * (p.voiceMinutes / p.callMinutes);
    return {
      ...p,
      cost: perMinute == null ? null : perMinute * p.voiceMinutes + scoring,
      /** How many measured calls of about this length the rate comes from; 0 means the all-calls rate was used. */
      basedOn: similar.perMinute == null ? 0 : similar.interviews
    };
  });

  return {
    days,
    usdPerGbp,
    trimLimit: config.openai.realtimeContextTokens(),
    plans,
    report: { ...report, interviews: report.interviews.slice(0, 50) }
  };
};
