import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { auth } from '$lib/auth';

export const handle: Handle = async ({ event, resolve }) => {
  // Resolve the session once per request so loads and endpoints can read locals.
  if (!building) {
    const result = await auth.api.getSession({ headers: event.request.headers });
    event.locals.session = result?.session ?? null;
    event.locals.user = result?.user ?? null;
  }
  return svelteKitHandler({ event, resolve, auth, building });
};
