import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { auth } from '$lib/auth';

export const load: PageServerLoad = async ({request, url}) => {
  const session = await auth.api.getSession({
    headers: request.headers
  });
    
  if (!session){
    throw redirect(307, `/auth/sign-in?redirect=${url.pathname}`);
  }
  
  return {}
};