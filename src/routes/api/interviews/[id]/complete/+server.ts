import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Config } from '@sveltejs/adapter-vercel';
import { requireUser } from '$lib/server/guard';
import { completeInterview } from '$lib/server/interviews';
import { TranscriptSchema } from '$lib/interview-types';

// Scoring a long transcript can take a while.
export const config: Config = { maxDuration: 300 };

export const POST: RequestHandler = async (event) => {
  const user = requireUser(event);
  const body = (await event.request.json().catch(() => ({}))) as { transcript?: unknown };
  let transcript = null;
  if (body.transcript !== undefined) {
    const parsed = TranscriptSchema.safeParse(body.transcript);
    if (!parsed.success) error(400, { message: 'Invalid transcript' });
    transcript = parsed.data;
  }
  return json(await completeInterview(user, event.params.id, transcript));
};
