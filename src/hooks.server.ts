import { auth } from '$lib/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';

/**
 * Handles incoming SvelteKit server requests with integrated authentication.
 *
 * Delegates the request to `svelteKitHandler`, providing authentication support for the request lifecycle.
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