<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { toast } from '$lib/components/ui/toast';
  import { authClient } from '$lib/auth-client';
  import { Check, LoaderCircle } from '@lucide/svelte';

  interface Product {
    id: string;
    name: string;
    description: string;
    amount: number;
    currency: string;
    interval: string;
    benefits: string[];
  }
  interface Usage {
    plan: { premium: boolean; productName: string | null; billingEnabled: boolean };
    usage: { interviews: number; interviewers: number };
    limits: { interviews: number; interviewers: number };
  }
  interface Props {
    open: boolean;
    usage: Usage;
  }

  let { open = $bindable(), usage: summary }: Props = $props();
  const plan = $derived(summary.plan);
  const showPlans = $derived(!plan.premium && plan.billingEnabled);

  let products = $state<Product[] | null>(null);
  let busy = $state<string | null>(null);

  $effect(() => {
    if (!open || !showPlans || products) return;
    fetch('/api/billing/products')
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((d: { products: Product[] }) => (products = d.products))
      .catch(() => (products = []));
  });

  async function checkout(productId: string) {
    busy = productId;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await (authClient as any).checkout({ products: [productId] });
    if (res?.error) {
      busy = null;
      toast.error(res.error.message ?? 'Could not open checkout.');
    }
  }
  async function portal() {
    busy = 'portal';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await (authClient as any).customer.portal();
    if (res?.error) {
      busy = null;
      toast.error(res.error.message ?? 'Could not open the billing portal.');
    }
  }

  const fmt = (amount: number, currency: string) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: amount % 1 ? 2 : 0 }).format(amount);
  const meters = $derived([
    { label: 'interviews', used: summary.usage.interviews, max: summary.limits.interviews },
    { label: 'agents', used: summary.usage.interviewers, max: summary.limits.interviewers }
  ]);
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="max-h-[calc(100svh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-[912px]">
    <Dialog.Header class="flex h-[52px] justify-center border-b px-6">
      <Dialog.Title class="text-xl font-extrabold tracking-[-0.01em]">Plan &amp; billing</Dialog.Title>
      <Dialog.Description class="sr-only">Your plan, what you have used and how to upgrade.</Dialog.Description>
    </Dialog.Header>

    <div class="p-6">
      <div class="stagger grid gap-6 md:grid-cols-3">
        <!-- Free -->
        <article class="flex min-h-[360px] flex-col rounded-[10px] border p-6 {plan.premium ? '' : 'border-foreground/0'}">
          <h3 class="text-base font-extrabold">Free</h3>
          <div class="mt-2"><span class="tabular text-[28px] font-extrabold">£0</span></div>
          <div class="my-4 border-t"></div>
          {@render checks([`${summary.limits.interviews} free interviews`, 'All agents', 'Feedback report'])}
          {#if !plan.premium}
            <div class="mt-auto pt-4">
              <div class="text-xs text-muted-foreground">{meters[0].used} of {meters[0].max} used</div>
              <div class="mt-2 h-1.5 overflow-hidden rounded-[3px] bg-track">
                <div class="grow-x h-full rounded-[3px] bg-foreground" style="width:{Math.min(100, (meters[0].used / meters[0].max) * 100)}%"></div>
              </div>
            </div>
          {/if}
          <Button variant="outline" class="mt-4 w-full text-muted-foreground" disabled>{plan.premium ? 'Free' : 'Current plan'}</Button>
        </article>

        {#if plan.premium}
          <article class="flex min-h-[360px] flex-col rounded-[10px] border-[1.5px] border-foreground p-6 md:col-span-2">
            <h3 class="text-base font-extrabold">{plan.productName ?? 'Pro'}</h3>
            <p class="mt-2 text-sm text-muted-foreground">Your plan. Unlimited interviews and agents.</p>
            <div class="my-4 border-t"></div>
            {@render checks(['Unlimited interviews', 'Coach chat', 'Calls up to 45 minutes'])}
            {#if plan.billingEnabled}
              <Button class="mt-auto w-fit" variant="outline" onclick={portal} disabled={busy === 'portal'}>
                {#if busy === 'portal'}<LoaderCircle class="animate-spin" />{/if} Manage subscription
              </Button>
            {/if}
          </article>
        {:else if products && products.length}
          {#each products.slice(0, 2) as p, i (p.id)}
            <article class="flex min-h-[360px] flex-col rounded-[10px] p-6 {i === 0 ? 'border-[1.5px] border-foreground' : 'border'}">
              <div class="flex items-center justify-between">
                <h3 class="text-base font-extrabold">{p.name}</h3>
                {#if i === 0 && products.length > 1}<span class="inline-flex h-6 items-center rounded-full bg-muted px-2.5 text-xs font-semibold">Most picked</span>{/if}
              </div>
              <div class="mt-2"><span class="tabular text-[28px] font-extrabold">{fmt(p.amount, p.currency)}</span> <span class="text-xs text-muted-foreground">{p.interval === 'one_time' ? 'one-off' : `per ${p.interval}`}</span></div>
              <div class="my-4 border-t"></div>
              {@render checks(p.benefits.length ? p.benefits.slice(0, 3) : ['Unlimited interviews', 'Coach chat', 'Calls up to 45 minutes'])}
              <Button class="mt-auto w-full" variant={i === 0 ? 'default' : 'outline'} onclick={() => checkout(p.id)} disabled={busy === p.id}>
                {#if busy === p.id}<LoaderCircle class="animate-spin" />{/if} Get {p.name}
              </Button>
            </article>
          {/each}
        {:else}
          {#each [{ name: 'Sprint', period: 'one-off · 14 days', items: ['Unlimited interviews', 'Coach chat', 'For one job hunt'] }, { name: 'Pro', period: 'per month', items: ['Unlimited interviews', 'Coach chat', 'Priority voice'] }] as p, i (p.name)}
            <article class="flex min-h-[360px] flex-col rounded-[10px] p-6 {i === 0 ? 'border-[1.5px] border-foreground' : 'border'}">
              <div class="flex items-center justify-between">
                <h3 class="text-base font-extrabold">{p.name}</h3>
                {#if i === 0}<span class="inline-flex h-6 items-center rounded-full bg-muted px-2.5 text-xs font-semibold">Most picked</span>{/if}
              </div>
              <div class="mt-2"><span class="tabular text-[28px] font-extrabold">£—</span> <span class="text-xs text-muted-foreground">{p.period}</span></div>
              <div class="my-4 border-t"></div>
              {@render checks(p.items)}
              <Button class="mt-auto w-full" variant={i === 0 ? 'default' : 'outline'} disabled>
                {#if products === null && plan.billingEnabled}<LoaderCircle class="animate-spin" /> Loading{:else}Coming soon{/if}
              </Button>
            </article>
          {/each}
        {/if}
      </div>
      <p class="mt-4 text-xs text-muted-foreground">Prices in GBP. Cancel any time.</p>
    </div>
  </Dialog.Content>
</Dialog.Root>

{#snippet checks(items: string[])}
  <ul class="grid gap-3 text-sm">
    {#each items as b (b)}
      <li class="flex items-start gap-2"><Check class="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2} />{b}</li>
    {/each}
  </ul>
{/snippet}
