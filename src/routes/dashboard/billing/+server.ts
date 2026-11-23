import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Plan and billing is a pop-up on the dashboard. Old links and the checkout return come through here.
export const GET: RequestHandler = ({ url }) => {
  const upgraded = url.searchParams.get('upgraded') ? '&upgraded=1' : '';
  redirect(303, `/dashboard?billing=1${upgraded}`);
};
