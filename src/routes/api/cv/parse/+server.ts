import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireUser } from '$lib/server/guard';
import { CvError, readCv } from '$lib/server/cv';

/** Reads an uploaded CV and returns its text. The file itself is not stored. */
export const POST: RequestHandler = async (event) => {
  requireUser(event);
  const form = await event.request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) error(400, { message: 'Choose a file.' });
  try {
    const cv = await readCv(file);
    return json({ name: cv.name, text: cv.text, words: cv.text.split(/\s+/).length });
  } catch (e) {
    if (e instanceof CvError) error(400, { message: e.message });
    throw e;
  }
};
