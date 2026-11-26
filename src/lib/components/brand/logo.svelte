<script lang="ts">
  import { cn } from '$lib/utils';
  let { class: className = '', mark = false }: { class?: string; mark?: boolean } = $props();
</script>

{#if mark}
  <!-- No logo mark yet: the collapsed sidebar shows the wordmark's first letter, plain. -->
  <span class={cn('inline-grid size-8 place-items-center text-lg leading-none font-extrabold tracking-[-0.02em]', className)} aria-label="PrepMe">P</span>
{:else}
  <span class={cn('text-[17px] leading-none font-extrabold tracking-[-0.02em]', className)}>PrepMe</span>
{/if}
