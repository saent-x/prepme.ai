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
    'min-h-16 w-full rounded-[8px] border-border bg-card px-3 py-2.5 text-base leading-normal shadow-none placeholder:text-faint focus-visible:border-foreground focus-visible:outline-none focus-visible:ring-[0.5px] focus-visible:ring-foreground md:text-sm',
    'aria-invalid:border-destructive',
    className
  )}
  {...rest}
/>
