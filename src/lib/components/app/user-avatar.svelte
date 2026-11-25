<script lang="ts">
  import { cn } from '$lib/utils';
  let { name, image = null, class: className = '' }: { name: string; image?: string | null; class?: string } = $props();
  const initial = $derived((name.trim()[0] ?? '?').toUpperCase());
</script>

{#if image}
  <img src={image} alt="" referrerpolicy="no-referrer" class={cn('inline-block size-8 shrink-0 rounded-full object-cover', className)} />
{:else}
  <span
    aria-hidden="true"
    class={cn('inline-grid size-8 shrink-0 place-items-center rounded-full bg-track text-xs font-bold text-foreground', className)}
    >{initial}</span
  >
{/if}
