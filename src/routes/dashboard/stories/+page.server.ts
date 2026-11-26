import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { MAX_STORY_CHARS } from '$lib/bank';
import { deleteStory, listStories, updateStory } from '$lib/server/bank';

export const load: PageServerLoad = async ({ locals }) => {
  return { stories: await listStories(locals.user!.id) };
};

const Id = z.string().min(1).max(40);
const Change = z.object({
  id: Id,
  title: z.string().trim().min(1, 'Give the story a name').max(80),
  text: z.string().trim().min(1, 'A story needs some words').max(MAX_STORY_CHARS)
});

export const actions: Actions = {
  update: async ({ request, locals }) => {
    const parsed = Change.safeParse(Object.fromEntries(await request.formData()));
    if (!parsed.success)
      return fail(400, { error: parsed.error.issues[0]?.message ?? 'Check the story' });
    const { id, ...change } = parsed.data;
    await updateStory(locals.user!.id, id, change);
    return { ok: true };
  },

  delete: async ({ request, locals }) => {
    const id = Id.safeParse((await request.formData()).get('id'));
    if (!id.success) return fail(400, { error: 'That story could not be found.' });
    await deleteStory(locals.user!.id, id.data);
    return { ok: true };
  }
};
