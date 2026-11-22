<script lang="ts">
  import Logo from '$lib/components/brand/logo.svelte';
  import InterviewerAvatar from '$lib/components/app/interviewer-avatar.svelte';
  const { children } = $props();
</script>

<div class="grid min-h-svh lg:grid-cols-[1fr_1fr]">
  <div class="flex flex-col px-6 py-5 sm:px-10">
    <a href="/" aria-label="PrepMe home" class="w-fit"><Logo /></a>
    <div class="flex flex-1 items-center justify-center py-8">
      <div class="w-full max-w-[340px]">
        {@render children()}
      </div>
    </div>
  </div>
  <aside class="hidden flex-col items-center justify-center gap-8 bg-primary p-12 text-primary-foreground lg:flex">
    <div class="flex items-end gap-3">
      {#each ['rex', 'sam', 'juno', 'ivy', 'nova'] as n, i}
        <InterviewerAvatar name={n} class="{i === 2 ? 'size-24' : i % 2 ? 'size-16' : 'size-12'} ring-4 ring-white/25" />
      {/each}
    </div>
    <div class="text-center">
      <p class="text-3xl leading-tight font-extrabold tracking-tight">Name the interview.<br />Nail it.</p>
      <p class="mx-auto mt-3 max-w-xs text-sm opacity-80">Make an interviewer for the job you want, talk it through out loud, and get a scorecard.</p>
    </div>
  </aside>
</div>
