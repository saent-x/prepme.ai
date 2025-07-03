import { createAuthClient } from "better-auth/svelte";

export const authClient = createAuthClient();

export const signInGithub = async () => {
  const data = await authClient.signIn.social({
    provider: 'github',
    callbackURL: '/dashboard'
  })
}

export const signInGoogle = async () => {
  const data = await authClient.signIn.social({
    provider: 'google',
    callbackURL: '/dashboard'
  })
}

export const signInMicrosoft = async () => {
  const data = await authClient.signIn.social({
    provider: 'microsoft',
    callbackURL: '/dashboard'
  })
}