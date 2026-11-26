<script lang="ts">
  import { TabsTab } from '@ui-sdk/svelte/tabs';
  import type { ComponentProps } from 'svelte';
  import { cn } from '$lib/utils';

  type Props = ComponentProps<typeof TabsTab>;

  let { class: className, ...rest }: Props = $props();
</script>

<TabsTab
  class={cn(
    'mb-0 h-7 shrink-0 rounded-full border-0 px-3.5 text-[13px] font-semibold whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground data-selected:bg-card data-selected:text-foreground data-selected:shadow-[0_1px_2px_rgb(0_0_0/0.08),0_0_0_1px_var(--border)]',
    className
  )}
  {...rest}
/>
