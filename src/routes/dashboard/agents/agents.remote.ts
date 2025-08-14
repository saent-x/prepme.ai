import { query, form, getRequestEvent } from '$app/server';
import { auth } from '$lib/auth';
import {
  listAll,
  createOne,
  getOne,
  ListAllSchema,
  deleteOne,
  UpdateOneSchema,
  updateOne
} from '$lib/server/agents';
import { authGuard } from '$lib/server/utils';
import type { Session } from '$lib/utils';
import { z } from 'zod/v4';

let _currentSession: Session;
const getContext = async () => {
  if (!_currentSession) {
    _currentSession = await auth.api.getSession({
      headers: getRequestEvent().request.headers
    });
  }

  return { session: _currentSession };
};

export const updateAgent = form(async (data: FormData) => {
  let { request } = getRequestEvent();

  await authGuard(request.headers);

  let name = data.get('name') as string;
  let instructions = data.get('instructions') as string;
  let id = data.get('id') as string;
  let userId = data.get('userId') as string; // Not Needed??

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
  let { request } = getRequestEvent();
  await authGuard(request.headers);

  return await deleteOne({ id }, await getContext());
});

export const getAgent = query(z.string(), async (id) => {
  let { request } = getRequestEvent();
  await authGuard(request.headers);

  return await getOne({ id }, await getContext());
});

export const listAgents = query(ListAllSchema.or(z.void()), async (schema) => {
  let reqEvt = getRequestEvent();
  await authGuard(reqEvt.request.headers);

  return listAll(ListAllSchema.parse(schema ?? {}), await getContext()); // since its void would the default values be set??
});

export const createAgent = form(async (data: FormData) => {
  let { request } = getRequestEvent();

  await authGuard(request.headers);

  let name = data.get('name') as string;
  let instructions = data.get('instructions') as string;
  let userId = data.get('userId') as string;

  await createOne({
    name,
    instructions,
    userId
  });

  await listAgents({
    search: '', // TODO: this is a temporary workaround
    page: 1
  }).refresh();

  return {
    name,
    instructions
  };
});
