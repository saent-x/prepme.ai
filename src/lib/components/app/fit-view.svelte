<script lang="ts">
  // How a CV matches an advert: the score, what is covered and the gaps to practise.
  import Ring from '$lib/components/viz/ring.svelte';
  import { fitHeadline, type Fit } from '$lib/jobs';
  import { CheckCircle, Lightbulb } from '$lib/icons';

  let { fit }: { fit: Fit } = $props();
  const covered = $derived(fit.asks.filter((a) => a.covered));
  const gaps = $derived(fit.asks.filter((a) => !a.covered));
</script>

<div class="flex items-center gap-3.5">
  <Ring value={fit.score} size={56} stroke={5} label="Fit" />
  <div class="min-w-0">
    <div class="text-xs font-semibold text-muted-foreground">Fit check</div>
    <div class="text-base font-bold">{fitHeadline(fit)}</div>
    <div class="text-xs text-muted-foreground">{covered.length} of {fit.asks.length} asks covered by your CV</div>
  </div>
</div>

{#if covered.length}
  <ul class="stagger mt-4 flex flex-wrap gap-1" aria-label="Covered by your CV">
    {#each covered as a (a.ask)}
      <li class="inline-flex h-6 items-center gap-1 rounded-full border px-2 text-xs font-semibold text-success-text" title={a.note}>
        <CheckCircle class="size-3.5" />{a.ask}
      </li>
    {/each}
  </ul>
{/if}

{#if gaps.length}
  <h3 class="section-title mt-6">Gaps to practise</h3>
  <ul class="hair-list mt-2 border-y">
    {#each gaps as a (a.ask)}
      <li class="flex items-start gap-3 py-2.5">
        <Lightbulb class="mt-0.5 size-[18px] shrink-0 text-warning-text" />
        <div class="min-w-0">
          <div class="text-[13px] font-semibold">{a.ask}</div>
          {#if a.note}<div class="text-xs text-muted-foreground">{a.note}</div>{/if}
        </div>
      </li>
    {/each}
  </ul>
{/if}
