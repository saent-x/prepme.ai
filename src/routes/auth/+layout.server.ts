import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { configuredSocialProviders } from '$lib/server/config';
import { safeRedirect } from '$lib/server/guard';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const next = safeRedirect(url.searchParams.get('redirect'));
  if (locals.user) redirect(303, next);
  return { providers: configuredSocialProviders(), next };
};
