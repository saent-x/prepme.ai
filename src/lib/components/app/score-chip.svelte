<script lang="ts">
  import { scoreTone } from '$lib/utils';
  let { score }: { score: number | null | undefined } = $props();
  const tone = $derived(scoreTone(score));
</script>

{#if score == null}
  <span class="text-[13px] text-faint">—</span>
{:else}
  <span
    class="tabular inline-flex h-6 min-w-10 items-center justify-center rounded-full px-2 text-xs font-bold {tone === 'good'
      ? 'bg-success-soft text-success'
      : tone === 'ok'
        ? 'bg-warning-soft text-warning-text'
        : 'bg-destructive-soft text-destructive'}">{score}</span
  >
{/if}
