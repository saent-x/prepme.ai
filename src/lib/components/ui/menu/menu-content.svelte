<script lang="ts">
  import { MenuContent } from '@ui-sdk/svelte/menu';
  import type { ComponentProps } from 'svelte';
  import { cn } from '$lib/utils';

  type Props = ComponentProps<typeof MenuContent>;

  let { class: className, sideOffset = 6, ...rest }: Props = $props();
</script>

<MenuContent
  {sideOffset}
  class={cn(
    'min-w-40 rounded-[10px] border bg-card p-1 text-foreground shadow-pop',
    'origin-(--transform-origin) transition-[opacity,scale] duration-100 data-ending-style:scale-97 data-ending-style:opacity-0 data-starting-style:scale-97 data-starting-style:opacity-0 motion-reduce:transition-none',
    className
  )}
  {...rest}
/>
