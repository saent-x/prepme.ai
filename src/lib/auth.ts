import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { env } from '$env/dynamic/private';
import { checkout, polar, portal } from '@polar-sh/better-auth';
import { db } from '$lib/db/index.server';
import * as schema from '$lib/db/schema';
import { polarCore } from '$lib/server/polar';

const socialProviders = {
  ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
    ? { github: { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET } }
    : {}),
  ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } }
    : {}),
  ...(env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET
    ? {
        microsoft: {
          clientId: env.MICROSOFT_CLIENT_ID,
          clientSecret: env.MICROSOFT_CLIENT_SECRET,
          tenantId: 'common',
          prompt: 'select_account' as const
        }
      }
    : {})
};

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  // Unset on branch previews, where Better Auth reads the URL from the request.
  baseURL: env.BETTER_AUTH_URL || undefined,
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification
    }
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8
  },
  socialProviders,
  plugins: [
    ...(polarCore
      ? [
          polar({
            client: polarCore,
            createCustomerOnSignUp: true,
            use: [
              checkout({ successUrl: '/dashboard/billing?upgraded=1', authenticatedUsersOnly: true }),
              portal()
            ]
          })
        ]
      : []),
    // Must be last: lets server actions set auth cookies.
    sveltekitCookies(getRequestEvent)
  ]
});

export type AuthSession = typeof auth.$Infer.Session;
