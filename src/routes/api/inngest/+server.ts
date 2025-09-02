import { inngest } from '$lib/inngest';
import { interviewsProcessing } from '$lib/inngest/functions';
import { serve } from 'inngest/sveltekit';

const inngestServe = serve({ client: inngest, functions: [interviewsProcessing] });
export const GET = inngestServe.GET;
export const POST = inngestServe.POST;
export const PUT = inngestServe.PUT;
