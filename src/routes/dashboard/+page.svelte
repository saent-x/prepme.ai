<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import TrendChart from '$lib/components/viz/trend-chart.svelte';
  import CompetencyBars from '$lib/components/viz/competency-bars.svelte';
  import InterviewRow from '$lib/components/app/interview-row.svelte';
  import { TEMPLATES } from '$lib/templates';
  import { ArrowRight, Mic, PhoneCall } from '@lucide/svelte';

  let { data } = $props();
  const p = $derived(data.progress);
  const first = $derived(data.user.name.split(' ')[0]);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const weakest = $derived([...p.competencies].sort((a, b) => a.avg - b.avg)[0]);
</script>

<svelte:head><title>Overview · PrepMe</title></svelte:head>

<div class="flex flex-wrap items-end justify-between gap-4">
  <div>
    <p class="eyebrow">Overview</p>
    <h1 class="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{greeting}, {first}.</h1>
  </div>
  <Button href="/dashboard/interviews/new" variant="signal" size="lg"><Mic /> New interview</Button>
</div>

{#each data.active as a}
  <a
    href="/call/{a.id}"
    class="mt-6 flex items-center gap-4 rounded-2xl border border-signal/30 bg-signal-soft/60 p-4 transition-colors hover:bg-signal-soft"
  >
    <span class="grid size-10 place-items-center rounded-full bg-signal text-white"><PhoneCall class="size-4" /></span>
    <div class="flex-1">
      <div class="font-medium">“{a.name}” is still in progress</div>
      <div class="text-sm text-muted-foreground">Your transcript is saved. Rejoin to carry on where you left off.</div>
    </div>
    <ArrowRight class="size-5" />
  </a>
{/each}

<!-- Stats -->
<section class="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Your stats">
  {#each [
    { label: 'Interviews scored', value: p.completedCount },
    { label: 'Average score', value: p.averageScore ?? '—' },
    { label: 'Best score', value: p.best ?? '—' },
    { label: 'Minutes practised', value: p.minutes }
  ] as s}
    <div class="rounded-3xl border bg-card p-5">
      <div class="eyebrow">{s.label}</div>
      <div class="tabular mt-3 text-4xl font-semibold tracking-tight">{s.value}</div>
    </div>
  {/each}
</section>

{#if p.completedCount === 0}
  <!-- First run -->
  <section class="mt-8 rounded-3xl border bg-card p-6 sm:p-8">
    <h2 class="text-xl font-semibold">Start with an interviewer</h2>
    <p class="mt-1 text-muted-foreground">Pick one and you'll be talking in under a minute. You can edit it later.</p>
    <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {#each TEMPLATES.slice(0, 6) as t}
        <a
          href="/dashboard/interviews/new?template={t.id}"
          class="group rounded-2xl border bg-background p-4 transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-sm"
        >
          <div class="eyebrow">{t.category}</div>
          <div class="mt-2 font-semibold">{t.name}</div>
          <div class="mt-1 text-sm text-muted-foreground">{t.tagline}</div>
          <div class="mt-4 inline-flex items-center gap-1 text-sm font-medium text-signal">
            Start <ArrowRight class="size-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </a>
      {/each}
    </div>
  </section>
{:else}
  <section class="mt-3 grid gap-3 lg:grid-cols-[1.6fr_1fr]">
    <div class="rounded-3xl border bg-card p-6">
      <div class="flex items-baseline justify-between">
        <h2 class="font-semibold">Score trend</h2>
        <span class="text-sm text-muted-foreground">{p.trend.length} scored</span>
      </div>
      <div class="mt-4"><TrendChart points={p.trend} /></div>
    </div>
    <div class="rounded-3xl border bg-card p-6">
      <h2 class="font-semibold">Competencies</h2>
      <p class="text-sm text-muted-foreground">Average across all interviews</p>
      <div class="mt-5">
        <CompetencyBars items={p.competencies.map((c) => ({ key: c.key, score: c.avg }))} />
      </div>
      {#if weakest}
        <Button href="/dashboard/interviews/new?focus={encodeURIComponent(weakest.key.replace('_', ' '))}" variant="outline" class="mt-6 w-full">
          Practise your weakest area
        </Button>
      {/if}
    </div>
  </section>
{/if}

<section class="mt-3 rounded-3xl border bg-card p-3 sm:p-4">
  <div class="flex items-center justify-between px-3 pt-2 pb-3">
    <h2 class="font-semibold">Recent interviews</h2>
    <a href="/dashboard/interviews" class="text-sm text-muted-foreground hover:text-foreground">View all</a>
  </div>
  {#if data.recent.length}
    <div class="grid">
      {#each data.recent as row (row.id)}<InterviewRow {row} />{/each}
    </div>
  {:else}
    <p class="px-3 pb-4 text-sm text-muted-foreground">No interviews yet.</p>
  {/if}
</section>
