import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Config } from '@sveltejs/adapter-vercel';
import { requireUser } from '$lib/server/guard';
import { analyse } from '$lib/server/interviews';

export const config: Config = { maxDuration: 300 };

/** Retry scoring after a failure. */
export const POST: RequestHandler = async (event) => {
  const user = requireUser(event);
  return json(await analyse(user, event.params.id));
};
