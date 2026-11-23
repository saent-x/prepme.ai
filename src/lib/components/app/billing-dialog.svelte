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
  <Dialog.Content class="max-h-[calc(100svh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-[560px]">
    <Dialog.Header class="flex-row items-center gap-2.5 border-b px-5 py-3.5">
      <Dialog.Title class="text-base font-bold">Plan and billing</Dialog.Title>
      <span class="rounded-md bg-signal-soft px-2 py-0.5 text-xs font-semibold text-primary">{plan.premium ? (plan.productName ?? 'Pro') : 'Free'}</span>
      <Dialog.Description class="sr-only">Your plan, what you have used and how to upgrade.</Dialog.Description>
    </Dialog.Header>

    <div class="grid gap-4 px-5 py-4">
      <section class="grid rounded-xl border sm:grid-cols-2" aria-label="Usage">
        {#each meters as u, i (u.label)}
          <div class="px-4 py-3 {i ? 'border-t sm:border-t-0 sm:border-l' : ''}">
            <div class="flex items-baseline gap-2">
              <span class="tabular text-2xl font-extrabold tracking-tight">{u.used}</span>
              <span class="text-[13px] text-muted-foreground">{plan.premium ? `${u.label}, unlimited` : `of ${u.max} ${u.label}`}</span>
            </div>
            {#if !plan.premium}
              <div class="mt-2 h-[5px] overflow-hidden rounded-full bg-muted">
                <div class="grow-x h-full rounded-full {u.used >= u.max ? 'bg-warning' : 'bg-primary'}" style="width:{Math.min(100, (u.used / u.max) * 100)}%"></div>
              </div>
            {/if}
          </div>
        {/each}
      </section>

      {#if plan.premium}
        {#if plan.billingEnabled}
          <Button class="w-fit" variant="outline" onclick={portal} disabled={busy === 'portal'}>
            {#if busy === 'portal'}<LoaderCircle class="animate-spin" />{/if} Manage subscription
          </Button>
        {/if}
      {:else if !plan.billingEnabled}
        <p class="rounded-xl border px-4 py-3 text-sm text-muted-foreground">Billing isn't set up on this deployment yet.</p>
      {:else if products === null}
        <p class="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle class="size-4 animate-spin" /> Loading plans</p>
      {:else if products.length}
        <section aria-label="Upgrade">
          <h3 class="text-sm font-bold">Upgrade</h3>
          <div class="stagger mt-2 grid gap-3 {products.length > 1 ? 'sm:grid-cols-2' : ''}">
            {#each products as p (p.id)}
              <article class="flex flex-col rounded-xl border p-4">
                <h4 class="font-bold">{p.name}</h4>
                {#if p.description}<p class="mt-1 text-sm text-muted-foreground">{p.description}</p>{/if}
                <div class="mt-3"><span class="tabular text-3xl font-extrabold tracking-tight">{fmt(p.amount, p.currency)}</span><span class="text-muted-foreground"> / {p.interval}</span></div>
                <ul class="mt-3 flex-1 space-y-1.5 text-sm">
                  {#each p.benefits.length ? p.benefits : ['Unlimited interviews', 'Unlimited agents', 'Calls up to 45 minutes'] as b (b)}
                    <li class="flex gap-2"><Check class="mt-0.5 size-4 shrink-0 text-success" />{b}</li>
                  {/each}
                </ul>
                <Button class="mt-4" onclick={() => checkout(p.id)} disabled={busy === p.id}>
                  {#if busy === p.id}<LoaderCircle class="animate-spin" />{/if} Upgrade
                </Button>
              </article>
            {/each}
          </div>
        </section>
      {:else}
        <p class="rounded-xl border px-4 py-3 text-sm text-muted-foreground">Plans are unavailable right now. Try again shortly.</p>
      {/if}
    </div>
  </Dialog.Content>
</Dialog.Root>
