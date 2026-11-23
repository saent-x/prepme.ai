<script lang="ts">
  import { MenuItem } from '@ui-sdk/svelte/menu';
  import type { ComponentProps } from 'svelte';
  import { cn } from '$lib/utils';

  type Props = ComponentProps<typeof MenuItem> & {
    variant?: 'default' | 'destructive';
  };

  let { class: className, variant = 'default', ...rest }: Props = $props();
</script>

<MenuItem
  class={cn(
    "flex cursor-default items-center gap-2 rounded-[6px] px-2 py-2 text-sm outline-none select-none data-disabled:opacity-50 data-highlighted:bg-muted [&_svg]:shrink-0 [&_svg]:text-muted-foreground [&_svg:not([class*='size-'])]:size-4",
    variant === 'destructive' && 'text-destructive [&_svg]:text-destructive',
    className
  )}
  {...rest}
/>
