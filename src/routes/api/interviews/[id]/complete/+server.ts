import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireUser } from '$lib/server/guard';
import { completeInterview } from '$lib/server/interviews';
import { TranscriptSchema } from '$lib/interview-types';
import { VoiceUsageListSchema } from '$lib/usage';

// Scoring a long transcript can take a while.

export const POST: RequestHandler = async (event) => {
  const user = requireUser(event);
  const body = (await event.request.json().catch(() => ({}))) as { transcript?: unknown; usage?: unknown };
  let transcript = null;
  if (body.transcript !== undefined) {
    const parsed = TranscriptSchema.safeParse(body.transcript);
    if (!parsed.success) error(400, { message: 'Invalid transcript' });
    transcript = parsed.data;
  }
  const usage = VoiceUsageListSchema.safeParse(body.usage);
  return json(await completeInterview(user, event.params.id, transcript, usage.success ? usage.data : null));
};
