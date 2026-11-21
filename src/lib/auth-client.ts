import { polarClient } from '@polar-sh/better-auth/client';
import { createAuthClient } from 'better-auth/svelte';

export const authClient = createAuthClient({
  plugins: [polarClient()]
});

export type SocialProvider = 'github' | 'google' | 'microsoft';
