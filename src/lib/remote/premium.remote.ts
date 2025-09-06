import { query, getRequestEvent } from '$app/server';
import { auth } from '$lib/auth';
import { getCurrentSubscription, getFreeUsage, getProducts } from '$lib/server/premium';
import { authGuard } from '$lib/server/utils';
import type { Session } from '$lib/utils';

const getContext = async (): Promise<{ session: Session }> => {
  const currentSession = await auth.api.getSession({
    headers: getRequestEvent().request.headers
  });

  return { session: currentSession };
};

export const getFreeUsageStats = query(async () => {
  const { request } = getRequestEvent();
  await authGuard(request.headers);

  return getFreeUsage(await getContext());
});

export const getUserProducts = query(async () => {
  const { request } = getRequestEvent();
  await authGuard(request.headers);

  return getProducts();
});

export const getUserCurrentSubscription = query(async () => {
  const { request } = getRequestEvent();
  await authGuard(request.headers);

  return getCurrentSubscription(await getContext());
});
