<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Separator } from '$lib/components/ui/separator';
  import { cn } from '$lib/utils';
  import { CircleCheckIcon } from '@lucide/svelte';
  import { cva, type VariantProps } from 'class-variance-authority';

  const pricingCardVariants = cva('rounded-lg p-4 py-6 w-full', {
    variants: {
      variant: {
        default: 'bg-white text-black',
        highlighted: 'bg-linear-to-br from-[#5700ac] to-[#220249] text-white'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  });

  const pricingCardIconVariants = cva('size-5', {
    variants: {
      variant: {
        default: 'fill-primary text-white',
        highlighted: 'fill-white text-black'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  });

  const pricingCardSecondaryTextVariants = cva('text-neutral-700', {
    variants: {
      variant: {
        default: 'text-neutral-700',
        highlighted: 'text-neutral-300'
      }
    }
  });

  const pricingCardBadgeVariants = cva('text-black text-xs font-normal p-1', {
    variants: {
      variant: {
        default: 'bg-primary/20',
        highlighted: 'bg-[#F5B797]'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  });

  type PricingCardVariants = VariantProps<typeof pricingCardVariants>;

  type Props = {
    badge?: string | null;
    price: number;
    features: string[];
    title: string;
    description?: string | null;
    priceSuffix: string;
    class?: string;
    buttonText: string;
    onClick: () => void;
  } & PricingCardVariants;

  const {
    badge,
    price,
    features,
    title,
    description,
    priceSuffix,
    class: className,
    buttonText,
    onClick,
    variant
  }: Props = $props();
</script>

<div class={cn(pricingCardVariants({ variant }), className, 'border')}>
  <div class="flex items-end justify-between gap-x-4">
    <div class="flex flex-col gap-y-2">
      <div class="flex items-center gap-x-2">
        <h6 class="text-xl font-medium">
          {title}
        </h6>
        {#if badge}
          <Badge class={cn(pricingCardBadgeVariants({ variant }))}>
            {badge}
          </Badge>
        {/if}
      </div>
      <p class={cn('text-xs', pricingCardSecondaryTextVariants({ variant }))}>
        {description}
      </p>
    </div>
    <div class="flex shrink-0 items-end gap-x-0.5">
      <h4 class="text-3xl font-medium">
        {Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0
        }).format(price)}
      </h4>
      <span class={cn(pricingCardSecondaryTextVariants({ variant }))}>
        {priceSuffix}
      </span>
    </div>
  </div>
  <div class="py-6">
    <Separator class="text-[#5D6B68] opacity-10" />
  </div>
  <Button
    class="w-full"
    size="lg"
    variant={variant === 'highlighted' ? 'default' : 'outline'}
    onclick={onClick}
  >
    {buttonText}
  </Button>
  <div class="mt-6 flex flex-col gap-y-2">
    <p class="font-medium uppercase">Features</p>
    <ul class={cn('flex flex-col gap-y-2.5', pricingCardSecondaryTextVariants({ variant }))}>
      {#each features as feature}
        <li class="flex items-center gap-x-2.5">
          <CircleCheckIcon class={cn(pricingCardIconVariants({ variant }))} />
          {feature}
        </li>
      {/each}
    </ul>
  </div>
</div>
