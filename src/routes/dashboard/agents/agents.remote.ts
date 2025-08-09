import { query, form, getRequestEvent } from '$app/server';
import { auth } from '$lib/auth';
import { listAll, createOne, getOne, ListAllSchema } from '$lib/server/agents';
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

export const getAgent = query(z.string(), async (id) => {
  let { request } = getRequestEvent();
  await authGuard(request.headers);

  return await getOne(id);
});

export const listAgents = query(ListAllSchema.or(z.void()), async (schema) => {
  let reqEvt = getRequestEvent();
  await authGuard(reqEvt.request.headers);

  return listAll(schema ?? ListAllSchema.parse({}), await getContext()); // since its void would the default values be set??
});

export const createAgents = form(async (data: FormData) => {
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

  await listAgents().refresh();

  return {
    name,
    instructions
  };
});
