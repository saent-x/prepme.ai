import { query, form, getRequestEvent } from '$app/server';
import { auth } from '$lib/auth';
import type { InterviewStatusEnum } from '$lib/db/schema';
import {
  listAll,
  createOne,
  getOne,
  PaginationSchema,
  deleteOne,
  updateOne
} from '$lib/server/interviews';
import { authGuard } from '$lib/server/utils';
import type { Session } from '$lib/utils';
import { error } from '@sveltejs/kit';
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

export const updateInterview = form(async (data: FormData) => {
  let { request } = getRequestEvent();

  await authGuard(request.headers);

  const id = data.get('id') as string;
  const name = data.get('name') as string;
  const status = data.get('status') as InterviewStatusEnum;
  const transcriptUrl = data.get('transcript_url') as string;
  const recordingUrl = data.get('recording_url') as string;
  const summary = data.get('summary') as string;

  await updateOne(
    {
      name,
      id,

      status,
      transcriptUrl,
      recordingUrl,
      summary
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

  return await deleteOne({ id }, await getContext());
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

  await createOne(
    {
      name,
      agentId
    },
    await getContext()
  );

  await listInterviews({
    search: '', // TODO: this is a temporary workaround
    page: 1
  }).refresh();

  return {
    name // Not necessary?
  };
});
