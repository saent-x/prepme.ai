import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireUser } from '$lib/server/guard';
import { analyse } from '$lib/server/interviews';


/** Retry scoring after a failure. */
export const POST: RequestHandler = async (event) => {
  const user = requireUser(event);
  return json(await analyse(user, event.params.id));
};
