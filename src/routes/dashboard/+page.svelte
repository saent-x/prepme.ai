<script lang="ts">
    import { authClient } from "$lib/auth-client";
    import { Button } from "$lib/components/ui/button";

    let session = authClient.useSession();
</script>

<div>
    <p>Logged in as {$session.data?.user.name}</p>
    <Button onclick={() => authClient.signOut()}>Sign out</Button>
</div>
