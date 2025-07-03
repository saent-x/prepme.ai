<script lang="ts">
  import { goto } from '$app/navigation';
  import { authClient } from '$lib/auth-client';
  import { Button } from '$lib/components/ui/button';
  import { toast } from 'svelte-sonner';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<div>
  <h2>Welcome to the Dashboard</h2>
  <p>Logged in as {data.session?.user.name}</p>
  <Button
    onclick={() =>
      authClient.signOut({
        fetchOptions: {
          onSuccess: () => goto('/auth/sign-in'),
          onError: (error) => {
            console.error('Sign out failed:', error);
            toast.error("Sign out failed, please try again!");
          }
        }
      })}>Sign out</Button
  >
</div>
