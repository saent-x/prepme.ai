import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireUser } from '$lib/server/guard';
import { startRealtimeSession } from '$lib/server/interviews';

/** Mint a short-lived OpenAI realtime key for this interview (start or resume). */
export const POST: RequestHandler = async (event) => {
  const user = requireUser(event);
  const session = await startRealtimeSession(user, event.params.id);
  return json(session, { headers: { 'cache-control': 'no-store' } });
};
