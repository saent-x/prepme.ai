<script lang="ts">
  import { AlertDialogClose } from '@ui-sdk/svelte/alert-dialog';
  import type { ComponentProps } from 'svelte';
  import { cn } from '$lib/utils';
  import { buttonVariants, type ButtonVariant } from '../button';

  type Props = ComponentProps<typeof AlertDialogClose> & {
    variant?: ButtonVariant;
  };

  let { class: className, variant = 'outline', ...rest }: Props = $props();
</script>

<AlertDialogClose class={cn(buttonVariants({ variant }), className)} {...rest} />
