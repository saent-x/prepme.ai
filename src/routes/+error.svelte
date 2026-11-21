<script lang="ts">
  import { page } from '$app/state';
  import Logo from '$lib/components/brand/logo.svelte';
  import { Button } from '$lib/components/ui/button';
</script>

<svelte:head><title>{page.status} · PrepMe</title></svelte:head>
<div class="grid min-h-svh place-items-center px-6 text-center">
  <div>
    <a href="/" class="inline-block"><Logo /></a>
    <p class="eyebrow mt-10">Error {page.status}</p>
    <h1 class="mt-3 text-3xl font-semibold tracking-tight">
      {page.status === 404 ? "We couldn't find that page" : 'Something went wrong'}
    </h1>
    <p class="mt-3 max-w-md text-muted-foreground">{page.error?.message}</p>
    <div class="mt-8 flex justify-center gap-2">
      <Button href="/dashboard">Go to dashboard</Button>
      <Button href="/" variant="outline">Home</Button>
    </div>
  </div>
</div>
