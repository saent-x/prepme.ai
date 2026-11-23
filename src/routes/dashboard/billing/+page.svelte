<script lang="ts">
  import { page } from '$app/state';
  import { toast } from '$lib/components/ui/toast';
  import { authClient } from '$lib/auth-client';
  import { Button } from '$lib/components/ui/button';
  import { Check, LoaderCircle } from '@lucide/svelte';

  let { data } = $props();
  const plan = $derived(data.usage.plan);
  const usage = $derived(data.usage.usage);
  const limits = $derived(data.usage.limits);
  let busy = $state<string | null>(null);

  $effect(() => {
    if (page.url.searchParams.get('upgraded')) toast.success('Thanks for upgrading. Pro is active.');
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
</script>

<svelte:head><title>Plan and billing · PrepMe</title></svelte:head>

<div class="flex h-9 items-center gap-2.5">
  <h1 class="text-xl font-bold tracking-tight">Plan and billing</h1>
  <span class="rounded-md bg-signal-soft px-2 py-0.5 text-xs font-semibold text-primary">{plan.premium ? (plan.productName ?? 'Pro') : 'Free'}</span>
</div>

<section class="mt-4 grid rounded-xl border bg-card sm:grid-cols-2" aria-label="Usage">
  {#each [
    { label: 'interviews', used: usage.interviews, max: limits.interviews },
    { label: 'agents', used: usage.interviewers, max: limits.interviewers }
  ] as u, i}
    <div class="px-5 py-3.5 {i ? 'border-t sm:border-t-0 sm:border-l' : ''}">
      <div class="flex items-baseline gap-2">
        <span class="tabular text-2xl font-extrabold tracking-tight">{u.used}</span>
        <span class="text-[13px] text-muted-foreground">{plan.premium ? `${u.label}, unlimited` : `of ${u.max} ${u.label}`}</span>
      </div>
      {#if !plan.premium}
        <div class="mt-2 h-[5px] overflow-hidden rounded-full bg-muted">
          <div class="h-full rounded-full {u.used >= u.max ? 'bg-warning' : 'bg-primary'}" style="width:{Math.min(100, (u.used / u.max) * 100)}%"></div>
        </div>
      {/if}
    </div>
  {/each}
</section>

{#if plan.premium}
  {#if plan.billingEnabled}
    <Button class="mt-4" variant="outline" onclick={portal} disabled={busy === 'portal'}>
      {#if busy === 'portal'}<LoaderCircle class="animate-spin" />{/if} Manage subscription
    </Button>
  {/if}
{:else if !plan.billingEnabled}
  <p class="mt-4 rounded-xl border bg-card px-5 py-4 text-sm text-muted-foreground">Billing isn't set up on this deployment yet.</p>
{:else if data.products.length}
  <section class="mt-5">
    <h2 class="text-sm font-bold">Upgrade</h2>
    <div class="mt-2 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {#each data.products as p}
        <article class="flex flex-col rounded-xl border bg-card p-5">
          <h3 class="font-bold">{p.name}</h3>
          {#if p.description}<p class="mt-1 text-sm text-muted-foreground">{p.description}</p>{/if}
          <div class="mt-3"><span class="tabular text-3xl font-extrabold tracking-tight">{fmt(p.amount, p.currency)}</span><span class="text-muted-foreground"> / {p.interval}</span></div>
          <ul class="mt-4 flex-1 space-y-1.5 text-sm">
            {#each p.benefits.length ? p.benefits : ['Unlimited interviews', 'Unlimited agents', 'Calls up to 45 minutes'] as b}
              <li class="flex gap-2"><Check class="mt-0.5 size-4 shrink-0 text-success" />{b}</li>
            {/each}
          </ul>
          <Button class="mt-5" onclick={() => checkout(p.id)} disabled={busy === p.id}>
            {#if busy === p.id}<LoaderCircle class="animate-spin" />{/if} Upgrade
          </Button>
        </article>
      {/each}
    </div>
  </section>
{:else}
  <p class="mt-4 rounded-xl border bg-card px-5 py-4 text-sm text-muted-foreground">Plans are loading or unavailable right now. Try again shortly.</p>
{/if}
