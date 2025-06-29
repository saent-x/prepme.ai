import { auth } from '$lib/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';

export async function handle({ event, resolve }: {
  event: {
      request: Request;
      url: URL;
  };
  resolve: (event: any) => any;
}) {
  return svelteKitHandler({event, resolve, auth});
}