<script lang="ts">
  import { DialogTitle } from '@ui-sdk/svelte/dialog';
  import type { ComponentProps } from 'svelte';
  import { cn } from '$lib/utils';

  type Props = ComponentProps<typeof DialogTitle>;

  let { class: className, ...rest }: Props = $props();
</script>

<DialogTitle class={cn('text-lg leading-none font-bold', className)} {...rest} />
