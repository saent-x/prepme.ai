<script lang="ts">
  import { page } from '$app/state';
  import { toast } from 'svelte-sonner';
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

<svelte:head><title>Plan & billing · PrepMe</title></svelte:head>

<p class="eyebrow">Plan & billing</p>
<h1 class="mt-2 text-3xl font-semibold tracking-tight">{plan.premium ? `You're on ${plan.productName ?? 'Pro'}` : "You're on the free plan"}</h1>

<section class="mt-8 grid gap-3 sm:grid-cols-2">
  {#each [
    { label: 'Interviews', used: usage.interviews, max: limits.interviews },
    { label: 'Interviewers', used: usage.interviewers, max: limits.interviewers }
  ] as u}
    <div class="rounded-3xl border bg-card p-6">
      <div class="eyebrow">{u.label}</div>
      <div class="tabular mt-2 text-3xl font-semibold">{u.used}{#if !plan.premium}<span class="text-lg text-muted-foreground"> / {u.max}</span>{/if}</div>
      {#if !plan.premium}
        <div class="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div class="h-full rounded-full {u.used >= u.max ? 'bg-signal' : 'bg-foreground'}" style="width:{Math.min(100, (u.used / u.max) * 100)}%"></div>
        </div>
      {:else}
        <p class="mt-2 text-sm text-muted-foreground">Unlimited</p>
      {/if}
    </div>
  {/each}
</section>

{#if plan.premium}
  {#if plan.billingEnabled}
    <Button class="mt-6" variant="outline" onclick={portal} disabled={busy === 'portal'}>
      {#if busy === 'portal'}<LoaderCircle class="animate-spin" />{/if} Manage subscription
    </Button>
  {/if}
{:else if !plan.billingEnabled}
  <p class="mt-8 rounded-3xl border bg-card p-6 text-muted-foreground">Billing isn't set up on this deployment yet.</p>
{:else if data.products.length}
  <section class="mt-10">
    <h2 class="text-xl font-semibold">Upgrade</h2>
    <div class="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {#each data.products as p}
        <article class="flex flex-col rounded-3xl border bg-card p-6">
          <h3 class="font-semibold">{p.name}</h3>
          {#if p.description}<p class="mt-1 text-sm text-muted-foreground">{p.description}</p>{/if}
          <div class="mt-5"><span class="tabular text-4xl font-semibold">{fmt(p.amount, p.currency)}</span><span class="text-muted-foreground"> / {p.interval}</span></div>
          <ul class="mt-5 flex-1 space-y-2 text-sm">
            {#each p.benefits.length ? p.benefits : ['Unlimited interviews', 'Unlimited interviewers', 'Calls up to 45 minutes'] as b}
              <li class="flex gap-2"><Check class="mt-0.5 size-4 shrink-0 text-success" />{b}</li>
            {/each}
          </ul>
          <Button class="mt-6" variant="signal" onclick={() => checkout(p.id)} disabled={busy === p.id}>
            {#if busy === p.id}<LoaderCircle class="animate-spin" />{/if} Upgrade
          </Button>
        </article>
      {/each}
    </div>
  </section>
{:else}
  <p class="mt-8 rounded-3xl border bg-card p-6 text-muted-foreground">Plans are loading or unavailable right now. Try again shortly.</p>
{/if}
