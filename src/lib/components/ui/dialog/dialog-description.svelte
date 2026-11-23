<script lang="ts">
  import { DialogDescription } from '@ui-sdk/svelte/dialog';
  import type { ComponentProps } from 'svelte';
  import { cn } from '$lib/utils';

  type Props = ComponentProps<typeof DialogDescription>;

  let { class: className, ...rest }: Props = $props();
</script>

<DialogDescription class={cn('text-sm text-muted-foreground', className)} {...rest} />
