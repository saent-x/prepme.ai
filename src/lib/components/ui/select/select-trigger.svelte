<script lang="ts">
  import { SelectTrigger } from '@ui-sdk/svelte/select';
  import type { ComponentProps } from 'svelte';
  import { cn } from '$lib/utils';

  type Props = ComponentProps<typeof SelectTrigger>;

  let { class: className, ...rest }: Props = $props();
</script>

<SelectTrigger
  class={cn(
    'flex h-10 w-fit min-w-0 items-center justify-between gap-2 rounded-[8px] border-border bg-card px-3 text-left text-sm shadow-none data-popup-open:border-foreground data-disabled:opacity-50 data-placeholder:text-muted-foreground',
    className
  )}
  {...rest}
/>
