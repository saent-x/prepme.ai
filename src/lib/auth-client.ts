import { createAuthClient } from 'better-auth/svelte';

export const authClient = createAuthClient();

type SocialProvider = 'github' | 'google' | 'microsoft';

export const signInSocial = async (
  provider: SocialProvider,
  callbackURL: string = '/dashboard'
) => {
  try {
    const data = await authClient.signIn.social({
      provider,
      callbackURL
    });
    return data;
  } catch (error) {
    console.error(`Social sign-in with ${provider} failed:`, error);
    throw error;
  }
};

export const signInGithub = async (callbackURL?: string) => signInSocial('github', callbackURL);
export const signInGoogle = async (callbackURL?: string) => signInSocial('google', callbackURL);
export const signInMicrosoft = async (callbackURL?: string) =>
  signInSocial('microsoft', callbackURL);
