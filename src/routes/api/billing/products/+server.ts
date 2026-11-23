import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireUser } from '$lib/server/guard';
import { listProducts } from '$lib/server/billing';

export const GET: RequestHandler = async (event) => {
  requireUser(event);
  return json({ products: await listProducts() });
};
