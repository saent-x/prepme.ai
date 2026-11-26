import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { requireUser } from '$lib/server/guard';
import { keepStory } from '$lib/server/bank';

const Body = z.object({ source: z.string().regex(/^(redo|answer):[\w-]{1,40}$/) });

/** Keep one practised answer as a story. */
export const POST: RequestHandler = async (event) => {
  const user = requireUser(event);
  const parsed = Body.safeParse(await event.request.json().catch(() => null));
  if (!parsed.success) error(400, { message: 'That answer could not be found.' });
  const problem = await keepStory(user.id, parsed.data.source);
  if (problem) error(409, { message: problem });
  return json({ ok: true });
};
