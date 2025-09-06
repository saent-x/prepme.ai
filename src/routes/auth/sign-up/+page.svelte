<script lang="ts">
  import AuthForm from '$lib/components/auth/auth-form.svelte';
  import { authClient } from '$lib/auth-client';
  import { toast } from 'svelte-sonner';
  import { goto } from '$app/navigation';

  let name = $state('');
  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');

  let signing_up = $state(false);

  function signupHandler() {
    signing_up = true;
    authClient.signUp.email(
      {
        email,
        password,
        name,
        callbackURL: '/dashboard'
      },
      {
        onError: (error_ctx) => {
          signing_up = false;
          toast.error(error_ctx?.error.message || 'An error occurred during sign up');
        },
        onSuccess: () => {
          goto('/dashboard');
          signing_up = false;
          toast.success('Successfully signed up! Please check your email to verify your account.');
        }
      }
    );
  }
</script>

<AuthForm
  authType="sign-up"
  bind:email
  bind:password
  bind:name
  bind:confirmPassword
  bind:processing={signing_up}
  onSubmit={signupHandler}
/>
