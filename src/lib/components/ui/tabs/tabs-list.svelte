<script lang="ts">
  import { TabsList } from '@ui-sdk/svelte/tabs';
  import type { ComponentProps } from 'svelte';
  import { cn } from '$lib/utils';

  type Props = ComponentProps<typeof TabsList>;

  let { class: className, ...rest }: Props = $props();
</script>

<TabsList class={cn('flex w-full gap-5 border-b', className)} {...rest} />
