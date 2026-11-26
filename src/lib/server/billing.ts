import { error } from '@sveltejs/kit';
import { count, eq } from 'drizzle-orm';
import { db } from '$lib/db/index.server';
import { agents, interviews } from '$lib/db/schema';
import { config, FREE_LIMITS, PLAN_MINUTES } from './config';
import { polarClient } from './polar';

export type Plan = {
  premium: boolean;
  /** Product name when subscribed. */
  productName: string | null;
  billingEnabled: boolean;
};

/**
 * Subscription status. Polar outages must not take the dashboard down, so any
 * failure falls back to the free plan and is logged.
 */
export async function getPlan(userId: string): Promise<Plan> {
  if (config.unlimitedUsage()) return { premium: true, productName: 'Unlimited', billingEnabled: false };
  if (!polarClient) return { premium: false, productName: null, billingEnabled: false };
  try {
    const state = await polarClient.customers.getStateExternal(userId);
    const sub = state.active_subscriptions[0];
    if (!sub) return { premium: false, productName: null, billingEnabled: true };
    let productName: string | null = null;
    try {
      productName = (await polarClient.products.get(sub.product_id)).name;
    } catch {
      productName = 'Pro';
    }
    return { premium: true, productName, billingEnabled: true };
  } catch (e) {
    // 404 just means this user has never been a Polar customer.
    if (e instanceof Error && 'statusCode' in e && e.statusCode === 404) {
      return { premium: false, productName: null, billingEnabled: true };
    }
    console.error('[billing] Polar lookup failed, treating user as free', e);
    return { premium: false, productName: null, billingEnabled: true };
  }
}

export async function getUsage(userId: string) {
  const [[i], [a]] = await Promise.all([
    db.select({ n: count() }).from(interviews).where(eq(interviews.userId, userId)),
    db.select({ n: count() }).from(agents).where(eq(agents.userId, userId))
  ]);
  return { interviews: i.n, interviewers: a.n };
}

export async function getUsageSummary(userId: string) {
  const [plan, usage] = await Promise.all([getPlan(userId), getUsage(userId)]);
  return { plan, usage, limits: FREE_LIMITS, minutes: PLAN_MINUTES };
}

/** Returns a user-facing message when the free plan limit is reached, otherwise null. */
export async function limitMessage(userId: string, entity: 'interview' | 'interviewer') {
  const { plan, usage } = await getUsageSummary(userId);
  if (plan.premium) return null;
  if (entity === 'interview' && usage.interviews >= FREE_LIMITS.interviews) {
    return `The free plan includes ${FREE_LIMITS.interviews} interviews. Upgrade to keep practising.`;
  }
  if (entity === 'interviewer' && usage.interviewers >= FREE_LIMITS.interviewers) {
    return `The free plan includes ${FREE_LIMITS.interviewers} agents. Upgrade for more, or reuse one you have.`;
  }
  return null;
}

export async function assertCanCreate(userId: string, entity: 'interview' | 'interviewer') {
  const message = await limitMessage(userId, entity);
  if (message) error(403, { message, code: 'LIMIT' });
}

export async function listProducts() {
  if (!polarClient) return [];
  try {
    const res = await polarClient.products.list({
      is_archived: false,
      is_recurring: true,
      sorting: ['price_amount']
    });
    return res.items.map((p) => {
      const price = p.prices.find((x) => 'price_amount' in x) as
        | { price_amount: number; price_currency: string }
        | undefined;
      return {
        id: p.id,
        name: p.name,
        description: p.description ?? '',
        amount: price ? price.price_amount / 100 : 0,
        currency: price?.price_currency?.toUpperCase() ?? 'USD',
        interval: p.recurring_interval ?? 'month',
        benefits: p.benefits.map((b) => b.description)
      };
    });
  } catch (e) {
    console.error('[billing] could not list Polar products', e);
    return [];
  }
}
