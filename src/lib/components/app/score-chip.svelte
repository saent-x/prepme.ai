<script lang="ts">
  import { scoreTone } from '$lib/utils';
  let { score }: { score: number | null | undefined } = $props();
  const tone = $derived(scoreTone(score));
</script>

{#if score == null}
  <span class="text-[13px] text-faint">—</span>
{:else}
  <span
    class="tabular rounded-md px-2 py-0.5 text-[13px] font-bold {tone === 'good'
      ? 'bg-success-soft text-success'
      : tone === 'ok'
        ? 'bg-warning-soft text-warning'
        : 'bg-destructive/10 text-destructive'}">{score}</span
  >
{/if}
