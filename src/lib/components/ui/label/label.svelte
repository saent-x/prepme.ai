<script lang="ts">
  import { Label as UiLabel } from '@ui-sdk/svelte/label';
  import type { ComponentProps } from 'svelte';
  import { cn } from '$lib/utils';

  type Props = ComponentProps<typeof UiLabel>;

  let { class: className, ...rest }: Props = $props();
</script>

<UiLabel class={cn('flex items-center gap-2 text-sm leading-none font-medium', className)} {...rest} />
