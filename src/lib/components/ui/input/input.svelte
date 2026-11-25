<script lang="ts">
  import { Input as UiInput } from '@ui-sdk/svelte/input';
  import type { ComponentProps } from 'svelte';
  import { cn } from '$lib/utils';

  type Props = ComponentProps<typeof UiInput>;

  let { value = $bindable(), class: className, ...rest }: Props = $props();
</script>

<UiInput
  bind:value
  class={cn(
    'h-10 w-full min-w-0 rounded-[8px] border-border bg-card px-3 text-base shadow-none placeholder:text-faint focus-visible:border-foreground focus-visible:outline-none focus-visible:ring-[0.5px] focus-visible:ring-foreground md:text-sm',
    'aria-invalid:border-destructive',
    className
  )}
  {...rest}
/>
