<script lang="ts">
  import { AlertDialogBackdrop, AlertDialogContent } from '@ui-sdk/svelte/alert-dialog';
  import type { ComponentProps } from 'svelte';
  import { cn } from '$lib/utils';

  type Props = ComponentProps<typeof AlertDialogContent>;

  let { class: className, ...rest }: Props = $props();
</script>

<AlertDialogBackdrop class="bg-black/40 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
<AlertDialogContent
  class={cn(
    'grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-xl border bg-card p-6 text-foreground shadow-lg sm:max-w-md',
    'transition-[opacity,scale] duration-150 data-ending-style:scale-97 data-ending-style:opacity-0 data-starting-style:scale-97 data-starting-style:opacity-0 motion-reduce:transition-none',
    className
  )}
  {...rest}
/>
