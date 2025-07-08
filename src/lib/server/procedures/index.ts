import type { IncomingHttpHeaders } from 'node:http';
import { ORPCError, os } from '@orpc/server';
import { z } from 'zod/v4';
import { db } from '$lib/server/db';
import { agents } from '$lib/server/db/schema';

const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  instructions: z.string()
});

export const listAgents = os.handler(async () => {
  const data = await db.select().from(agents);

  await new Promise((resolve) => setTimeout(resolve, 2000));
  // throw new ORPCError('BAD_REQUEST');

  return data;
});

export const router = {
  agents: {
    list: listAgents
  }
};
