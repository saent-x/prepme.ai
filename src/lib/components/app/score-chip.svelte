<script lang="ts">
  import { scoreTone } from '$lib/utils';
  let { score }: { score: number | null | undefined } = $props();
  const tone = $derived(scoreTone(score));
</script>

{#if score == null}
  <span class="text-[13px] text-faint">—</span>
{:else}
  <span
    class="tabular inline-flex h-6 items-center text-sm font-bold {tone === 'good'
      ? 'text-success-text'
      : tone === 'ok'
        ? 'text-warning-text'
        : 'text-destructive'}">{score}</span
  >
{/if}
