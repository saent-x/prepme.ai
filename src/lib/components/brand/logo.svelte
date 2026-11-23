<script lang="ts">
  import { cn } from '$lib/utils';
  let { class: className = '', mark = false }: { class?: string; mark?: boolean } = $props();
</script>

{#if mark}
  <span
    class={cn('inline-grid size-8 place-items-center rounded-[8px] bg-foreground text-base leading-none font-extrabold text-background', className)}
    aria-label="PrepMe">P</span
  >
{:else}
  <span class={cn('text-xl leading-none font-extrabold tracking-[-0.02em]', className)}>PrepMe</span>
{/if}
