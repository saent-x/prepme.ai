import { query, form, getRequestEvent } from '$app/server';
import { auth } from '$lib/auth';
import {
  listAll,
  createOne,
  getOne,
  PaginationSchema,
  deleteOne,
  updateOne,
  generateToken,
  getTranscript as getInterviewTranscript,
  generateChatToken
} from '$lib/server/interviews';
import { authGuard } from '$lib/server/utils';
import type { Session } from '$lib/utils';
import { error } from '@sveltejs/kit';
import { z } from 'zod/v4';

const getContext = async (): Promise<{ session: Session }> => {
  const currentSession = await auth.api.getSession({
    headers: getRequestEvent().request.headers
  });

  return { session: currentSession };
};

export const getTranscript = query(z.string(), async (interviewId: string) => {
  let { request } = getRequestEvent();
  await authGuard(request.headers);

  return await getInterviewTranscript({ id: interviewId }, await getContext());
});

export const getChatToken = query(async () => {
  let { request } = getRequestEvent();
  await authGuard(request.headers);

  return await generateChatToken(await getContext());
});

export const getToken = query(async () => {
  let { request } = getRequestEvent();
  await authGuard(request.headers);

  return await generateToken(await getContext());
});

export const updateInterview = form(async (data: FormData) => {
  let { request } = getRequestEvent();
  await authGuard(request.headers);

  const id = data.get('id') as string;
  const name = data.get('name') as string;
  const agentId = data.get('agentId') as string;

  await updateOne(
    {
      name,
      id,
      agentId
    },
    await getContext()
  );

  await getInterview(id).refresh();

  return {
    name // Not necessary?
  };
});

export const deleteInterview = query(z.string(), async (id) => {
  let { request } = getRequestEvent();
  await authGuard(request.headers);

  let deletedInterview = await deleteOne({ id }, await getContext());

  return deletedInterview;
});

export const getInterview = query(z.string(), async (id) => {
  let { request } = getRequestEvent();
  await authGuard(request.headers);

  return await getOne({ id }, await getContext());
});

export const listInterviews = query(PaginationSchema.or(z.void()), async (schema) => {
  let reqEvt = getRequestEvent();
  await authGuard(reqEvt.request.headers);

  return listAll(PaginationSchema.parse(schema ?? {}), await getContext()); // since its void would the default values be set??
});

export const createInterview = form(async (data: FormData) => {
  let { request } = getRequestEvent();
  await authGuard(request.headers);

  const name = data.get('name') as string;
  const agentId = data.get('agentId') as string;

  const newInterview = await createOne(
    {
      name,
      agentId
    },
    await getContext()
  );

  return {
    interviewId: newInterview.id
  };
});
