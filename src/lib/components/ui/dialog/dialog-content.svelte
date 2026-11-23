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

<DialogBackdrop class="bg-[#111114]/40 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
<DialogContent
  class={cn(
    'w-full max-w-[calc(100%-2rem)] rounded-[10px] border-0 bg-card p-6 text-foreground shadow-modal sm:max-w-lg',
    'transition-[opacity,scale] duration-150 data-ending-style:scale-97 data-ending-style:opacity-0 data-starting-style:scale-97 data-starting-style:opacity-0 motion-reduce:transition-none',
    className
  )}
  {...rest}
>
  {@render children?.()}
  {#if showCloseButton}
    <DialogClose
      aria-label="Close"
      class="absolute top-3.5 right-4 size-8 rounded-[8px] border-0 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <X class="size-5" strokeWidth={1.6} aria-hidden="true" />
    </DialogClose>
  {/if}
</DialogContent>
