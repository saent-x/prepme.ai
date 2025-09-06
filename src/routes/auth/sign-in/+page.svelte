<script lang="ts">
  import AuthForm from '$lib/components/auth/auth-form.svelte';
  import { authClient } from '$lib/auth-client';
  import { toast } from 'svelte-sonner';

  let email = $state('vangerwua@outlook.com');
  let password = $state('johnpaul');

  let signing_in = $state(false);

  function signinHandler() {
    signing_in = true;
    authClient.signIn.email(
      {
        email,
        password,
        callbackURL: '/dashboard'
      },
      {
        onError: (error_ctx) => {
          signing_in = false;
          toast.error(error_ctx?.error.message || 'An error occurred during sign in');
        },
        onSuccess: () => {
          signing_in = false;
          toast.success('Successfully signed in!');
        }
      }
    );
  }
</script>

<AuthForm
  authType="sign-in"
  bind:email
  bind:password
  bind:processing={signing_in}
  onSubmit={signinHandler}
/>
