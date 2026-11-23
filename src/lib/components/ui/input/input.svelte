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
    'h-9 w-full min-w-0 rounded-md border-input bg-card px-3 text-base shadow-xs placeholder:text-faint md:text-sm',
    'aria-invalid:border-destructive',
    className
  )}
  {...rest}
/>
