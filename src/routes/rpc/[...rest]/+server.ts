import { RPCHandler } from '@orpc/server/fetch';
import type { RequestHandler } from '@sveltejs/kit';
import { router } from '$lib/server/procedures';

const handler = new RPCHandler(router);

const handle: RequestHandler = async ({ request }) => {
  const { response } = await handler.handle(request, {
    prefix: '/rpc',
    context: {
      headers: request.headers
    }
  });

  console.log(`req -> ${request.url} | ${request.headers}`); //TODO: Remove
  return response ?? new Response('Not Found', { status: 404 });
};

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
