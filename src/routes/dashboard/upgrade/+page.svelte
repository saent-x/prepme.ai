<script lang="ts">
  import { authClient } from '$lib/auth-client';
  import ErrorState from '$lib/components/states/error-state.svelte';
  import LoadingState from '$lib/components/states/loading-state.svelte';
  import PricingCard from '$lib/pricing/pricing-card.svelte';
  import { getUserCurrentSubscription, getUserProducts } from '$lib/remote/premium.remote';
  import type { Product } from '@polar-sh/sdk/models/components/product.js';

  const getProductsQuery = getUserProducts();
  const getCurrentSubscription = getUserCurrentSubscription();

  const processProductDetails = (product: Product) => {
    const isCurrentProduct = getCurrentSubscription.current?.id === product.id;
    const isPremium = !!getCurrentSubscription.current;

    let buttonText = 'Upgrade';
    let onClick = () => authClient.checkout({ products: [product.id] });

    if (isCurrentProduct) {
      buttonText = 'Manage';
      onClick = () => authClient.customer.portal();
    } else if (isPremium) {
      buttonText = 'Change Plan';
      onClick = () => authClient.customer.portal();
    }

    let price = product.prices[0].amountType === 'fixed' ? product.prices[0].priceAmount / 100 : 0;
    let features = product.benefits.map((benefit) => benefit.description);

    return {
      buttonText,
      onClick,
      title: product.name,
      price,
      description: product.description,
      priceSuffix: `/${product.prices[0].recurringInterval}`,
      features,
      badge: product.metadata.badge as string | null
    };
  };
</script>

{#if getProductsQuery.loading || getCurrentSubscription.loading}
  <LoadingState title="Loading" description="This shouldn't take too long..." />
{:else if getProductsQuery.error || getCurrentSubscription.error}
  <ErrorState title="Error" description="Please try again later..." />
{:else if getProductsQuery.ready && getCurrentSubscription.ready}
  <div class="flex flex-1 flex-col gap-y-10 px-4 py-4 md:px-8">
    <div class="mt-4 flex flex-1 flex-col items-center gap-y-10">
      <h5 class="text-2xl font-medium md:text-3xl">
        You are on the{' '}
        <span class="text-primary font-semibold">
          {getCurrentSubscription.current?.name ?? 'Free'}
        </span>{' '}
        plan
      </h5>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        {#each getProductsQuery.current as product}
          <PricingCard
            variant={product.metadata.variant === 'highlighted' ? 'highlighted' : 'default'}
            {...processProductDetails(product)}
          />
        {/each}
      </div>
    </div>
  </div>
{/if}
