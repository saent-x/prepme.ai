import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireUser } from '$lib/server/guard';
import { saveTranscript } from '$lib/server/interviews';
import { TranscriptSchema } from '$lib/interview-types';

/**
 * Save the running transcript. Accepts JSON from fetch and text/plain from
 * navigator.sendBeacon (used when the tab closes mid-call).
 */
export const POST: RequestHandler = async (event) => {
  const user = requireUser(event);
  let body: unknown;
  try {
    body = JSON.parse(await event.request.text());
  } catch {
    error(400, { message: 'Invalid JSON' });
  }
  const parsed = TranscriptSchema.safeParse((body as { transcript?: unknown })?.transcript);
  if (!parsed.success) error(400, { message: 'Invalid transcript' });
  await saveTranscript(user.id, event.params.id, parsed.data);
  return json({ ok: true });
};
