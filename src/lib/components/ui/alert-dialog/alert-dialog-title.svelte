<script lang="ts">
  import { AlertDialogTitle } from '@ui-sdk/svelte/alert-dialog';
  import type { ComponentProps } from 'svelte';
  import { cn } from '$lib/utils';

  type Props = ComponentProps<typeof AlertDialogTitle>;

  let { class: className, ...rest }: Props = $props();
</script>

<AlertDialogTitle class={cn('text-lg font-bold', className)} {...rest} />
