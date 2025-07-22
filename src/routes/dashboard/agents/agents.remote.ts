import { query, form, getRequestEvent } from '$app/server';
import { AgentInsertSchema } from '$lib/db/schema';
import { api } from '$lib/server/api/agents';
import { authGuard } from '$lib/server/api/utils';
import { z } from 'zod/v4';

export const getAgent = query(z.string(), async (id) => {
  let reqEvt = getRequestEvent();
  await authGuard(reqEvt.request.headers);
  
  return await api.getOne(id);
});

export const listAgents = query(async () => {
  let reqEvt = getRequestEvent();
  await authGuard(reqEvt.request.headers);
  
  return api.listAll();
});

export const createAgents = form(async (data: FormData) => {
  let reqEvt = getRequestEvent();
  await authGuard(reqEvt.request.headers);

  let name = data.get('name') as string;
  let instructions = data.get('instructions') as string;
  let userId = data.get('userId') as string;

  console.log(`name -> ${name}\ninstructions -> ${instructions}\nuser_id -> ${userId}`);

  await api.createOne({
    name,
    instructions,
    userId
  });

  await listAgents().refresh();

  return {
    name,
    instructions
  };
});
