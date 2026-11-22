<script lang="ts">
  import { page } from '$app/state';
  import Logo from '$lib/components/brand/logo.svelte';
  import { Button } from '$lib/components/ui/button';
</script>

<svelte:head><title>{page.status} · PrepMe</title></svelte:head>
<div class="grid min-h-svh place-items-center px-6 text-center">
  <div>
    <a href="/" class="inline-block"><Logo /></a>
    <p class="mt-8 text-[13px] font-medium text-faint">Error {page.status}</p>
    <h1 class="mt-1 text-2xl font-extrabold tracking-tight">
      {page.status === 404 ? "We couldn't find that page" : 'Something went wrong'}
    </h1>
    <p class="mt-2 max-w-md text-sm text-muted-foreground">{page.error?.message}</p>
    <div class="mt-5 flex justify-center gap-2">
      <Button href="/dashboard">Go to PrepMe</Button>
      <Button href="/" variant="outline">Home</Button>
    </div>
  </div>
</div>
