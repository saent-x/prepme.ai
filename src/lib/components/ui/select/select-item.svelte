<script lang="ts">
  import { SelectItem, SelectItemIndicator } from '@ui-sdk/svelte/select';
  import type { ComponentProps, Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  type Props = ComponentProps<typeof SelectItem> & {
    children?: Snippet;
  };

  let { class: className, children, ...rest }: Props = $props();
</script>

<SelectItem
  class={cn(
    'flex cursor-default items-center gap-2 rounded-md py-1.5 pr-2 pl-2 text-sm outline-none select-none data-disabled:opacity-50 data-highlighted:bg-muted',
    className
  )}
  {...rest}
>
  {@render children?.()}
  <SelectItemIndicator class="ml-auto shrink-0" />
</SelectItem>
