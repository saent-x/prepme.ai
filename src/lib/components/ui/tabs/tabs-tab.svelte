<script lang="ts">
  import { TabsTab } from '@ui-sdk/svelte/tabs';
  import type { ComponentProps } from 'svelte';
  import { cn } from '$lib/utils';

  type Props = ComponentProps<typeof TabsTab>;

  let { class: className, ...rest }: Props = $props();
</script>

<TabsTab
  class={cn(
    'h-9 px-0 text-sm font-semibold text-muted-foreground hover:text-foreground data-selected:border-primary data-selected:text-foreground',
    className
  )}
  {...rest}
/>
