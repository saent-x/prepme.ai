<script lang="ts">
  import { cn } from '$lib/utils';
  let { class: className = '', compact = false }: { class?: string; compact?: boolean } = $props();
</script>

<span class={cn('inline-flex items-center gap-2 font-semibold tracking-tight', className)}>
  <span class="relative grid size-6 place-items-center rounded-[7px] bg-foreground">
    <span class="size-2.5 rounded-full bg-signal"></span>
    <span class="absolute inset-[5px] rounded-full border border-signal/40"></span>
  </span>
  {#if !compact}<span class="text-[17px]">PrepMe</span>{/if}
</span>
