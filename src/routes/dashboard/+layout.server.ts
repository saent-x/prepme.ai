import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/auth';

export const load = async ({ url, request }) => {
  const session = await auth.api.getSession({
    headers: request.headers
  });

  if (!session) {
    throw redirect(307, `/auth/sign-in?redirect=${url.pathname}`);
  }

  return {};
};
