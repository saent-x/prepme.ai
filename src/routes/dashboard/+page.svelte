<script lang="ts">
    import { goto } from "$app/navigation";
    import { authClient } from "$lib/auth-client";
    import { Button } from "$lib/components/ui/button";

    let session = authClient.useSession();
    
    $effect(() => {
      if (!$session){
        goto('/auth-sign-in')
      }
    })
</script>

<div>
    <h2>Welcome to the Dashboard</h2>
    <p>Logged in as {$session.data?.user.name}</p>
    <Button onclick={() => authClient.signOut()}>Sign out</Button>
</div>
