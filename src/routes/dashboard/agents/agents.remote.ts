import { query, form, getRequestEvent } from '$app/server';
import { auth } from '$lib/auth';
import {
  listAll,
  createOne,
  getOne,
  PaginationSchema,
  deleteOne,
  updateOne
} from '$lib/server/agents';
import { authGuard } from '$lib/server/utils';
import type { Session } from '$lib/utils';
import { z } from 'zod/v4';

const getContext = async (): Promise<{ session: Session }> => {
  const currentSession = await auth.api.getSession({
    headers: getRequestEvent().request.headers
  });

  return { session: currentSession };
};

export const updateAgent = form(async (data: FormData) => {
  const { request } = getRequestEvent();
  await authGuard(request.headers);

  const name = data.get('name') as string;
  const instructions = data.get('instructions') as string;
  const id = data.get('id') as string;

  await updateOne(
    {
      name,
      instructions,
      id
    },
    await getContext()
  );

  await getAgent(id).refresh();

  return {
    name,
    instructions
  };
});

export const deleteAgent = query(z.string(), async (id) => {
  const { request } = getRequestEvent();
  await authGuard(request.headers);

  let deletedAgent = await deleteOne({ id }, await getContext());
  
  return deletedAgent;
});

export const getAgent = query(z.string(), async (id) => {
  const { request } = getRequestEvent();
  await authGuard(request.headers);

  return await getOne({ id }, await getContext());
});

export const listAgents = query(PaginationSchema.or(z.void()), async (schema) => {
  const reqEvt = getRequestEvent();
  await authGuard(reqEvt.request.headers);

  return listAll(PaginationSchema.parse(schema ?? {}), await getContext()); // since its void would the default values be set??
});

export const createAgent = form(async (data: FormData) => {
  const { request } = getRequestEvent();

  await authGuard(request.headers);

  const name = data.get('name') as string;
  const instructions = data.get('instructions') as string;

  await createOne(
    {
      name,
      instructions
    },
    await getContext()
  );

  return {
    name,
    instructions
  };
});
