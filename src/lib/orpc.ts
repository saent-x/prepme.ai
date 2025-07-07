import type { RouterClient } from '@orpc/server';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { router } from '$lib/server/procedures/index';
import { browser } from '$app/environment';
import { PUBLIC_RPC_URL } from '$env/static/public';
import { createTanstackQueryUtils, type ProcedureUtils, type RouterUtils } from '@orpc/tanstack-query';

const link = new RPCLink({
  url: browser ? `${window.location.origin}/rpc` : PUBLIC_RPC_URL || 'http://localhost:5173/rpc',
  headers: { Authorization: 'Bearer token' }
});

export const client: RouterClient<typeof router> = createORPCClient(link)
export const orpc = createTanstackQueryUtils(client)