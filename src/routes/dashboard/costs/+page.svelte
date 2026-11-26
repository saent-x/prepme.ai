<script lang="ts">
  import { goto } from '$app/navigation';
  import { format } from 'date-fns';
  import { Segmented } from '$lib/components/ui/segmented';
  import { TABLE_HEAD, TABLE_ROW } from '$lib/components/app/table';
  import { cn, formatDuration } from '$lib/utils';
  import { formatCost, formatDollars } from '$lib/usage';

  let { data } = $props();
  const r = $derived(data.report);
  const cost = (micros: number | null | undefined) => formatCost(micros, data.usdPerGbp);
  const percent = (share: number | null | undefined) =>
    share == null ? '—' : share > 0 && share < 0.005 ? '<1%' : `${Math.round(share * 100)}%`;
  const minutes = (m: number | null | undefined) => (m == null ? '—' : `${m.toFixed(1)} min`);

  const splitTotal = $derived(r.split.reduce((s, x) => s + x.micros, 0));
  const splitMax = $derived(Math.max(1, ...r.split.map((x) => x.micros)));

  const stats = $derived([
    { label: 'Interviews measured', value: String(r.totals.interviews), note: `${cost(r.totals.total)} spent in all` },
    {
      label: 'Average per interview',
      value: cost(r.totals.averagePerInterview),
      note: formatDollars(r.totals.averagePerInterview)
    },
    {
      label: 'Per voice minute',
      value: cost(r.totals.perVoiceMinute),
      note: `${Math.round(r.totals.voiceMinutes)} voice minutes`
    },
    { label: 'Input re-read cheaply', value: percent(r.totals.cachedShare), note: 'Higher is cheaper' }
  ]);

  const LENGTH_GRID = 'grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))]';
  const PLAN_GRID = 'grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]';
  const RECENT_GRID = 'grid-cols-[minmax(0,2.4fr)_repeat(7,minmax(0,1fr))]';
</script>

<svelte:head><title>AI cost · PrepMe</title></svelte:head>

<div class="flex min-h-10 flex-wrap items-center justify-between gap-4">
  <h1 class="text-[28px] leading-none font-extrabold tracking-[-0.02em]">AI cost</h1>
  <Segmented
    bind:value={() => String(data.days), (v) => goto(`?days=${v}`, { keepFocus: true, noScroll: true })}
    aria-label="Period"
    class="w-64"
    options={[
      { value: '7', label: '7 days' },
      { value: '30', label: '30 days' },
      { value: '90', label: '90 days' }
    ]}
  />
</div>
<p class="mt-3 max-w-2xl text-sm text-muted-foreground">
  What OpenAI charges for interviews, measured on real calls. Only you can see this page. Shown in pounds at ${data.usdPerGbp} to £1.
</p>

{#if !r.interviews.length}
  <div class="mt-8 grid place-items-center rounded-[10px] bg-muted px-6 py-12 text-center">
    <h2 class="font-bold">Nothing measured yet</h2>
    <p class="mt-1 max-w-sm text-sm text-muted-foreground">
      Costs show here after the next interview. Interviews from before this page existed were not measured.
    </p>
  </div>
{:else}
  {#if r.unpriced.length}
    <p class="mt-6 rounded-[8px] bg-warning-soft px-3 py-2 text-sm text-warning-text">
      No price is set for {r.unpriced.join(', ')}, so its usage counts as £0 here. Add it to the price table in src/lib/usage.ts.
    </p>
  {/if}
  {#if r.truncated}
    <p class="mt-6 rounded-[8px] bg-muted px-3 py-2 text-sm text-muted-foreground">
      This period has more usage than the page reads at once, so the oldest part is left out. Pick a shorter period.
    </p>
  {/if}

  <dl class="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 border-y py-6 lg:grid-cols-4">
    {#each stats as s (s.label)}
      <div class="min-w-0">
        <dt class="text-xs font-semibold text-muted-foreground">{s.label}</dt>
        <dd class="tabular mt-2 text-[28px] leading-none font-extrabold tracking-[-0.02em]">{s.value}</dd>
        <dd class="tabular mt-2 text-xs text-muted-foreground">{s.note}</dd>
      </div>
    {/each}
  </dl>

  <div class="mt-10 grid gap-10 xl:grid-cols-2">
    <section aria-labelledby="split-title" class="min-w-0">
      <h2 id="split-title" class="flex h-8 items-center text-base font-bold">Where the money goes</h2>
      <ul class="mt-2 border-t">
        {#each r.split as part (part.key)}
          <li class="grid h-12 grid-cols-[minmax(0,1fr)_64px_40px] items-center gap-x-4 border-b px-3 text-sm sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_64px_40px]">
            <span class="truncate">{part.label}</span>
            <span class="hidden h-2 rounded-full bg-track sm:block" aria-hidden="true">
              <span class="block h-2 rounded-full bg-foreground" style:width="{(part.micros / splitMax) * 100}%"></span>
            </span>
            <span class="tabular text-right font-bold">{cost(part.micros)}</span>
            <span class="tabular text-right text-muted-foreground">{percent(splitTotal ? part.micros / splitTotal : null)}</span>
          </li>
        {/each}
      </ul>
    </section>

    <section aria-labelledby="length-title" class="min-w-0">
      <h2 id="length-title" class="flex h-8 items-center text-base font-bold">By call length</h2>
      <div class="mt-2 overflow-x-auto">
        <div role="table" aria-labelledby="length-title" class="min-w-[480px]">
          <div role="row" class={cn('grid', TABLE_HEAD, LENGTH_GRID)}>
            <span role="columnheader">Voice time</span>
            <span role="columnheader" class="text-right">Interviews</span>
            <span role="columnheader" class="text-right">Average</span>
            <span role="columnheader" class="text-right">Cost each</span>
            <span role="columnheader" class="text-right">Per minute</span>
          </div>
          {#each r.buckets as b (b.label)}
            <div role="row" class={cn(TABLE_ROW, LENGTH_GRID, !b.interviews && 'text-faint')}>
              <span role="cell">{b.label}</span>
              <span role="cell" class="tabular text-right">{b.interviews}</span>
              <span role="cell" class="tabular text-right">{minutes(b.averageMinutes)}</span>
              <span role="cell" class="tabular text-right font-bold">{cost(b.averageCost)}</span>
              <span role="cell" class="tabular text-right">{cost(b.perMinute)}</span>
            </div>
          {/each}
        </div>
      </div>
    </section>
  </div>

  <section aria-labelledby="plans-title" class="mt-10">
    <h2 id="plans-title" class="flex h-8 items-center text-base font-bold">What the planned plans would cost</h2>
    <p class="text-sm text-muted-foreground">
      AI cost if a customer uses all of the plan's voice time. These plans are not on sale yet, and payment fees are not included.
    </p>
    <div class="mt-2 overflow-x-auto">
      <div role="table" aria-labelledby="plans-title" class="min-w-[560px]">
        <div role="row" class={cn('grid', TABLE_HEAD, PLAN_GRID)}>
          <span role="columnheader">Plan</span>
          <span role="columnheader">Includes</span>
          <span role="columnheader" class="text-right">Price</span>
          <span role="columnheader" class="text-right">AI cost</span>
          <span role="columnheader" class="text-right">Left over</span>
        </div>
        {#each data.plans as p (p.name)}
          {@const left = p.cost == null ? null : p.price * data.usdPerGbp * 1_000_000 - p.cost}
          <div role="row" class={cn(TABLE_ROW, PLAN_GRID)}>
            <span role="cell" class="font-bold">{p.name}</span>
            <span role="cell" class="truncate text-muted-foreground">
              {p.allowance}{p.cost != null && !p.basedOn ? ' · rate from all calls' : ''}
            </span>
            <span role="cell" class="tabular text-right">£{p.price}</span>
            <span role="cell" class="tabular text-right font-bold">{cost(p.cost)}</span>
            <span role="cell" class={cn('tabular text-right', left != null && left < 0 && p.price > 0 && 'font-bold text-destructive')}>
              {left == null || p.price === 0 ? '—' : left < 0 ? `-${cost(-left)}` : cost(left)}
            </span>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <section aria-labelledby="trim-title" class="mt-10">
    <h2 id="trim-title" class="flex h-8 items-center text-base font-bold">Trimming old audio</h2>
    <p class="text-sm text-muted-foreground">
      {#if data.trimLimit}
        On: the oldest half of a call is dropped once it passes {data.trimLimit.toLocaleString('en-GB')} tokens.
      {:else}
        Off. Set OPENAI_REALTIME_CONTEXT_TOKENS (for example 8000) to try it, then compare the two rows.
      {/if}
    </p>
    <div class="mt-2 overflow-x-auto">
      <div role="table" aria-labelledby="trim-title" class="min-w-[480px]">
        <div role="row" class={cn('grid', TABLE_HEAD, LENGTH_GRID)}>
          <span role="columnheader">Calls</span>
          <span role="columnheader" class="text-right">Interviews</span>
          <span role="columnheader" class="text-right">Average</span>
          <span role="columnheader" class="text-right">Cost each</span>
          <span role="columnheader" class="text-right">Per minute</span>
        </div>
        {#each [{ label: 'Not trimmed', g: r.trimming.off }, { label: 'Trimmed', g: r.trimming.on }] as row (row.label)}
          <div role="row" class={cn(TABLE_ROW, LENGTH_GRID, !row.g.interviews && 'text-faint')}>
            <span role="cell">{row.label}</span>
            <span role="cell" class="tabular text-right">{row.g.interviews}</span>
            <span role="cell" class="tabular text-right">{minutes(row.g.averageMinutes)}</span>
            <span role="cell" class="tabular text-right font-bold">{cost(row.g.averageCost)}</span>
            <span role="cell" class="tabular text-right">{cost(row.g.perMinute)}</span>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <section aria-labelledby="recent-title" class="mt-10">
    <h2 id="recent-title" class="flex h-8 items-center text-base font-bold">Recent interviews</h2>
    <div class="mt-2 overflow-x-auto">
      <div role="table" aria-labelledby="recent-title" class="min-w-[760px]">
        <div role="row" class={cn('grid', TABLE_HEAD, RECENT_GRID)}>
          <span role="columnheader">Started</span>
          <span role="columnheader" class="text-right">Voice time</span>
          <span role="columnheader" class="text-right">Re-read</span>
          <span role="columnheader" class="text-right">Voice</span>
          <span role="columnheader" class="text-right">Transcript</span>
          <span role="columnheader" class="text-right">Scoring</span>
          <span role="columnheader" class="text-right">Chat</span>
          <span role="columnheader" class="text-right">Total</span>
        </div>
        {#each r.interviews as i (i.interviewId)}
          <div role="row" class={cn(TABLE_ROW, RECENT_GRID)}>
            <span role="cell" class="truncate">
              {format(i.at, 'd MMM, HH:mm')}
              {#if i.sessions > 1}<span class="text-muted-foreground"> · {i.sessions} connections</span>{/if}
              {#if i.trimmed}<span class="text-muted-foreground"> · trimmed</span>{/if}
            </span>
            <span role="cell" class="tabular text-right">{formatDuration(i.voiceSeconds)}</span>
            <span role="cell" class="tabular text-right text-muted-foreground">{percent(i.cachedShare)}</span>
            <span role="cell" class="tabular text-right">{cost(i.voice)}</span>
            <span role="cell" class="tabular text-right">{cost(i.transcription)}</span>
            <span role="cell" class="tabular text-right">{cost(i.scoring)}</span>
            <span role="cell" class="tabular text-right">{cost(i.chat)}</span>
            <span role="cell" class="tabular text-right font-bold">{cost(i.total)}</span>
          </div>
        {/each}
      </div>
    </div>
  </section>
{/if}
