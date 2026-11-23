<script lang="ts">
  import { AlertDialogDescription } from '@ui-sdk/svelte/alert-dialog';
  import type { ComponentProps } from 'svelte';
  import { cn } from '$lib/utils';

  type Props = ComponentProps<typeof AlertDialogDescription>;

  let { class: className, ...rest }: Props = $props();
</script>

<AlertDialogDescription class={cn('text-sm text-muted-foreground', className)} {...rest} />
