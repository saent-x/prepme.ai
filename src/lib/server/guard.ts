import { error, redirect, type RequestEvent } from '@sveltejs/kit';

/** For pages: send signed-out visitors to sign-in and bring them back afterwards. */
export function requireUserPage(event: Pick<RequestEvent, 'locals' | 'url'>) {
  const user = event.locals.user;
  if (!user) {
    const back = event.url.pathname + event.url.search;
    redirect(303, `/auth/sign-in?redirect=${encodeURIComponent(back)}`);
  }
  return user;
}

/** For API endpoints and actions. */
export function requireUser(event: Pick<RequestEvent, 'locals'>) {
  const user = event.locals.user;
  if (!user) error(401, { message: 'Please sign in again.' });
  return user;
}

/** Only allow same-site relative redirects (prevents open redirects via ?redirect=). */
export function safeRedirect(target: string | null | undefined, fallback = '/dashboard') {
  if (!target || !target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) {
    return fallback;
  }
  return target;
}
