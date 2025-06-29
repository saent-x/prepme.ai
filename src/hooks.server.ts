import { auth } from '$lib/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';

/**
 * Handles incoming server requests by delegating to the authentication-aware SvelteKit handler.
 *
 * Integrates authentication into the request lifecycle, ensuring that requests are processed with user session or access control logic before continuing.
 */
export async function handle({ event, resolve }: {
  event: {
      request: Request;
      url: URL;
  };
  resolve: (event: any) => any;
}) {
  return svelteKitHandler({event, resolve, auth});
}