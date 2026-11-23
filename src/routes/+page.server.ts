import type { PageServerLoad } from './$types';
import { FREE_LIMITS } from '$lib/server/config';

export const load: PageServerLoad = async ({ locals }) => ({ signedIn: !!locals.user, limits: FREE_LIMITS });
