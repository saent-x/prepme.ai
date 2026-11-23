<script lang="ts">
  import { SelectTrigger } from '@ui-sdk/svelte/select';
  import type { ComponentProps } from 'svelte';
  import { cn } from '$lib/utils';

  type Props = ComponentProps<typeof SelectTrigger>;

  let { class: className, ...rest }: Props = $props();
</script>

<SelectTrigger
  class={cn(
    'flex h-9 w-fit min-w-0 items-center justify-between gap-2 rounded-md border-input bg-card px-3 text-left text-sm shadow-xs data-disabled:opacity-50 data-placeholder:text-muted-foreground',
    className
  )}
  {...rest}
/>
