<script lang="ts" module>
  import { type VariantProps, tv } from 'tailwind-variants';

  export const buttonVariants = tv({
    base: "inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-transparent px-4 text-sm font-semibold whitespace-nowrap no-underline transition-colors outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/40 data-disabled:pointer-events-none data-disabled:opacity-50 data-pending:cursor-progress [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/85',
        destructive: 'bg-destructive text-white hover:bg-destructive/90',
        outline: 'border-border bg-card text-foreground hover:bg-muted',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'bg-transparent text-foreground hover:bg-muted',
        link: 'h-auto bg-transparent px-0 text-foreground underline decoration-input underline-offset-4 hover:bg-transparent hover:decoration-foreground'
      },
      size: {
        default: 'h-9 px-4 has-[>svg]:px-3',
        sm: 'h-8 gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 px-4 has-[>svg]:px-3.5',
        xl: 'h-11 px-5 text-[15px] has-[>svg]:px-4',
        icon: 'size-9 px-0'
      }
    },
    defaultVariants: { variant: 'default', size: 'default' }
  });

  export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
  export type ButtonSize = VariantProps<typeof buttonVariants>['size'];
</script>

<script lang="ts">
  import { Button as UiButton } from '@ui-sdk/svelte/button';
  import type { ComponentProps, Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  type Props = ComponentProps<typeof UiButton> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    /** Renders a link that looks and behaves like the button. */
    href?: string;
    target?: string;
    rel?: string;
    children?: Snippet;
  };

  let { class: className, variant = 'default', size = 'default', href, target, rel, children, ...rest }: Props = $props();
  const classes = $derived(cn(buttonVariants({ variant, size }), className));
</script>

{#if href}
  <UiButton class={classes} {...rest}>
    {#snippet render({ props })}
      <a {...props} {href} {target} {rel}>{@render children?.()}</a>
    {/snippet}
  </UiButton>
{:else}
  <UiButton class={classes} {...rest}>{@render children?.()}</UiButton>
{/if}
