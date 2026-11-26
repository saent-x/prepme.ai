<script lang="ts">
  // Spark empty state: a bare illustration (no panel behind it), one line of heading, one of help, one action.
  // Illustrations are unDraw (free for commercial use), recoloured through the --ill-* tokens.
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';
  import empty from '$lib/illustrations/empty.svg?raw';

  // Illustrations are kept rare: empty states only. Add more here when a screen truly needs one.
  const ART = { empty } as const;

  let {
    art = 'empty',
    title,
    children,
    action,
    class: className = ''
  }: { art?: keyof typeof ART; title: string; children?: Snippet; action?: Snippet; class?: string } = $props();
</script>

<div class={cn('grid justify-items-center gap-2 py-10 text-center', className)}>
  <div class="ill mb-2 w-[140px] [&>svg]:h-auto [&>svg]:w-full" aria-hidden="true">{@html ART[art]}</div>
  <h2 class="section-title">{title}</h2>
  {#if children}<div class="max-w-sm text-sm text-muted-foreground">{@render children()}</div>{/if}
  {#if action}<div class="mt-2">{@render action()}</div>{/if}
</div>
