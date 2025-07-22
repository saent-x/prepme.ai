import { ORPCError, os } from '@orpc/server';
import { z } from 'zod/v4';
import { db } from '$lib/db/index.server';
import { AgentInsertSchema, agents } from '$lib/db/schema';
import { auth } from '$lib/auth';
import { eq } from 'drizzle-orm';

type HeaderContext = {
  headers: Headers;
};

const authGuard = os.$context<HeaderContext>().middleware(async ({ context, next }) => {
  const session = await auth.api.getSession({
    headers: context.headers
  });

  if (!session) {
    throw new ORPCError('UNAUTHORIZED', {
      message: 'UNAUTHORIZED'
    });
  }

  return next({
    context: {
      ...context,
      auth: session
    }
  });
});

export const getOneAgent = os
  .$context<HeaderContext>()
  .use(authGuard)
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const [selectedAgent] = await db.select().from(agents).where(eq(agents.id, input.id));

    return selectedAgent;
  });

export const listAgents = os
  .$context<HeaderContext>()
  .use(authGuard)
  .handler(async ({ context }) => {
    const data = await db.select().from(agents);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // throw new ORPCError('BAD_REQUEST');

    return data;
  });

export const createAgent = os
  .$context<HeaderContext>()
  .input(AgentInsertSchema)
  .use(authGuard)
  .handler(async ({ input, context }) => {
    const [createdAgent] = await db
      .insert(agents)
      .values({
        ...input,
        userId: context.auth.user.id
      })
      .returning();

    return createdAgent;
  });

export const router = {
  agents: {
    list: listAgents,
    create: createAgent,
    getOne: getOneAgent
  }
};
