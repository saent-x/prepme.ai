import type { PageServerLoad } from './$types';
import { listProducts } from '$lib/server/billing';

export const load: PageServerLoad = async () => ({ products: await listProducts() });
