import type { PageServerLoad } from './$types';
import { FREE_LIMITS, PLAN_MINUTES } from '$lib/server/config';

export const load: PageServerLoad = async ({ locals }) => ({ signedIn: !!locals.user, limits: FREE_LIMITS, minutes: PLAN_MINUTES });
