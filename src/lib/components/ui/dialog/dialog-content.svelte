<script lang="ts">
  import { DialogBackdrop, DialogClose, DialogContent } from '@ui-sdk/svelte/dialog';
  import type { ComponentProps, Snippet } from 'svelte';
  import { X } from '@lucide/svelte';
  import { cn } from '$lib/utils';

  type Props = ComponentProps<typeof DialogContent> & {
    showCloseButton?: boolean;
    children?: Snippet;
  };

  let { class: className, showCloseButton = true, children, ...rest }: Props = $props();
</script>

<DialogBackdrop class="bg-black/40 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
<DialogContent
  class={cn(
    'w-full max-w-[calc(100%-2rem)] rounded-xl border bg-card p-6 text-foreground shadow-lg sm:max-w-lg',
    'transition-[opacity,scale] duration-150 data-ending-style:scale-97 data-ending-style:opacity-0 data-starting-style:scale-97 data-starting-style:opacity-0 motion-reduce:transition-none',
    className
  )}
  {...rest}
>
  {@render children?.()}
  {#if showCloseButton}
    <DialogClose
      aria-label="Close"
      class="absolute top-3 right-3 size-8 border-0 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <X class="size-4" aria-hidden="true" />
    </DialogClose>
  {/if}
</DialogContent>
