<script lang="ts">
  import Logo from '$lib/components/brand/logo.svelte';
  const { children } = $props();
</script>

<div class="grid min-h-svh lg:grid-cols-[1fr_1.05fr]">
  <div class="flex flex-col px-6 py-6 sm:px-10">
    <a href="/" aria-label="PrepMe home" class="w-fit"><Logo /></a>
    <div class="flex flex-1 items-center justify-center py-10">
      <div class="w-full max-w-sm">
        {@render children()}
      </div>
    </div>
  </div>
  <aside class="relative hidden overflow-hidden bg-[oklch(0.17_0.006_60)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
    <div class="absolute -top-32 -right-32 size-[520px] rounded-full bg-signal/30 blur-3xl"></div>
    <p class="eyebrow relative text-white/50">● On air</p>
    <div class="relative">
      <p class="max-w-md text-3xl leading-tight font-semibold tracking-tight">
        Interviews are a performance. Rehearse them like one.
      </p>
      <p class="mt-6 max-w-sm text-white/55">A live voice interviewer that follows up on vague answers, then a scorecard for every question.</p>
    </div>
    <div class="relative grid grid-cols-3 gap-3 text-sm">
      {#each [['Listen', 'Natural voice'], ['Probe', 'Real follow-ups'], ['Score', 'Per-answer feedback']] as [a, b]}
        <div class="rounded-2xl bg-white/6 p-4"><div class="font-semibold">{a}</div><div class="text-white/50">{b}</div></div>
      {/each}
    </div>
  </aside>
</div>
