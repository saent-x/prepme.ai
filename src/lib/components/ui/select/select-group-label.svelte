<script lang="ts">
  import { SelectGroupLabel } from '@ui-sdk/svelte/select';
  import type { ComponentProps } from 'svelte';
  import { cn } from '$lib/utils';

  type Props = ComponentProps<typeof SelectGroupLabel>;

  let { class: className, ...rest }: Props = $props();
</script>

<SelectGroupLabel class={cn('px-2 py-1.5 text-xs font-medium text-faint', className)} {...rest} />
