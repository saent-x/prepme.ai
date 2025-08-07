import { query, form, getRequestEvent } from '$app/server';
import { api } from '$lib/server/agents';
import { authGuard } from '$lib/server/utils';
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
