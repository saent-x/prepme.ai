import { auth } from '$lib/auth';
import { error } from '@sveltejs/kit';

export const authGuard = async (headers: Headers) => {
  const session = await auth.api.getSession({
    headers
  });

  if (!session) {
    throw error(401, 'UNAUTHORIZED');
  }

  return session;
};
