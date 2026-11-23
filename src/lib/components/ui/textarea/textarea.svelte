<script lang="ts">
  import { Textarea as UiTextarea } from '@ui-sdk/svelte/textarea';
  import type { ComponentProps } from 'svelte';
  import { cn } from '$lib/utils';

  type Props = ComponentProps<typeof UiTextarea>;

  let { value = $bindable(), class: className, ...rest }: Props = $props();
</script>

<UiTextarea
  bind:value
  class={cn(
    'min-h-16 w-full rounded-md border-input bg-card px-3 py-2 text-base shadow-xs placeholder:text-faint md:text-sm',
    'aria-invalid:border-destructive',
    className
  )}
  {...rest}
/>
