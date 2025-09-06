import { MAX_FREE_AGENTS, MAX_FREE_INTERVIEWS } from '$lib/constant';
import { db } from '$lib/db/index.server';
import { agents, interviews } from '$lib/db/schema';
import { polarClient } from '$lib/polar';
import type { Context } from '$lib/utils';
import type { CustomerState } from '@polar-sh/sdk/models/components/customerstate.js';
import type { Product } from '@polar-sh/sdk/models/components/product.js';
import { error } from '@sveltejs/kit';
import { count, eq } from 'drizzle-orm';

export const getFreeUsage = async (ctx: Context) => {
  if (!ctx.session || !ctx.session.user.id) {
    error(401, {
      message: 'Unauthorized'
    });
  }

  const customer = await polarClient.customers.getStateExternal({
    externalId: ctx.session.user.id
  });

  const subscription = customer.activeSubscriptions[0];

  if (subscription) return null;

  const [userInterviews] = await db
    .select({
      count: count(interviews.id)
    })
    .from(interviews)
    .where(eq(interviews.userId, ctx.session.user.id));

  const [userAgents] = await db
    .select({
      count: count(agents.id)
    })
    .from(agents)
    .where(eq(agents.userId, ctx.session.user.id));

  return {
    interviewsCount: userInterviews.count,
    agentsCount: userAgents.count
  };
};

export const CheckSubscription = async (
  ctx: Context,
  entity: 'agent' | 'interview'
): Promise<CustomerState> => {
  if (!ctx.session || !ctx.session.user.id) {
    error(401, {
      message: 'Unauthorized'
    });
  }

  const customer = await polarClient.customers.getStateExternal({
    externalId: ctx.session.user.id
  });

  const [userInterviews] = await db
    .select({
      count: count(interviews.id)
    })
    .from(interviews)
    .where(eq(interviews.userId, ctx.session.user.id));

  const [userAgents] = await db
    .select({
      count: count(agents.id)
    })
    .from(agents)
    .where(eq(agents.userId, ctx.session.user.id));

  const isPremuim = customer.activeSubscriptions.length > 0;
  const isFreeAgentLimitReached = userAgents.count >= MAX_FREE_AGENTS;
  const isFreeInterviewLimitReached = userInterviews.count >= MAX_FREE_INTERVIEWS;

  const shouldThrowInterviewError =
    entity === 'interview' && isFreeInterviewLimitReached && !isPremuim;
  const shouldThrowAgentError = entity === 'agent' && isFreeAgentLimitReached && !isPremuim;

  if (shouldThrowAgentError) {
    return error(403, {
      message: 'You have reached the max number of free agents'
    });
  }

  if (shouldThrowInterviewError) {
    return error(403, {
      message: 'You have reached the max number of free interviews'
    });
  }

  return customer;
};

export const getProducts = async (): Promise<Product[]> => {
  const products = await polarClient.products.list({
    isArchived: false,
    isRecurring: true,
    sorting: ['price_amount']
  });

  return products.result.items;
};

export const getCurrentSubscription = async (ctx: Context) => {
  if (!ctx.session || !ctx.session.user.id) {
    error(401, {
      message: 'Unauthorized'
    });
  }

  const customer = await polarClient.customers.getStateExternal({
    externalId: ctx.session.user.id
  });

  const subscription = customer.activeSubscriptions[0];
  if (!subscription) return null;

  const product = await polarClient.products.get({
    id: subscription.productId
  });

  return product;
};
