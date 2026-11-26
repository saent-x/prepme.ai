<script lang="ts">
  import { TabsList } from '@ui-sdk/svelte/tabs';
  import type { ComponentProps } from 'svelte';
  import { cn } from '$lib/utils';

  type Props = ComponentProps<typeof TabsList>;

  let { class: className, ...rest }: Props = $props();
</script>

<TabsList class={cn('inline-flex w-max max-w-full gap-0.5 self-start overflow-x-auto rounded-full border-0 bg-muted p-[3px] [scrollbar-width:none]', className)} {...rest} />
