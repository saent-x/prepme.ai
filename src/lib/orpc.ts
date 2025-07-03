import type { RouterClient } from '@orpc/server';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { router } from '$lib/routes/index';
import { createTanstackQueryUtils, type ProcedureUtils, type RouterUtils } from '@orpc/tanstack-query';

const link = new RPCLink({
  url: 'http://localhost:5173/rpc',
  headers: { Authorization: 'Bearer token' }
});

const client: RouterClient<typeof router> = createORPCClient(link)
export const orpc = createTanstackQueryUtils(client)