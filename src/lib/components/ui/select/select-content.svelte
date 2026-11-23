<script lang="ts">
  import { SelectContent } from '@ui-sdk/svelte/select';
  import type { ComponentProps } from 'svelte';
  import { cn } from '$lib/utils';

  type Props = ComponentProps<typeof SelectContent>;

  let { class: className, sideOffset = 6, ...rest }: Props = $props();
</script>

<SelectContent
  {sideOffset}
  class={cn(
    'max-h-(--available-height) min-w-(--anchor-width) overflow-y-auto rounded-[10px] border bg-card p-1 text-foreground shadow-pop',
    'origin-(--transform-origin) transition-[opacity,scale] duration-100 data-ending-style:scale-97 data-ending-style:opacity-0 data-starting-style:scale-97 data-starting-style:opacity-0 motion-reduce:transition-none',
    className
  )}
  {...rest}
/>
