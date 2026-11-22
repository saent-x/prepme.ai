<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import CompetencyBars from '$lib/components/viz/competency-bars.svelte';
  import InterviewRow from '$lib/components/app/interview-row.svelte';
  import InterviewHead from '$lib/components/app/interview-head.svelte';
  import InterviewerAvatar from '$lib/components/app/interviewer-avatar.svelte';
  import InterviewerDialog from '$lib/components/app/interviewer-dialog.svelte';
  import { COMPETENCY_LABELS } from '$lib/interview-types';
  import { ArrowRight, Plus } from '@lucide/svelte';

  let { data } = $props();
  let creating = $state(false);
  const p = $derived(data.progress);
  const first = $derived(data.user.name.split(' ')[0]);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const weakest = $derived([...p.competencies].sort((a, b) => a.avg - b.avg)[0]);
  const weakestLabel = $derived(weakest ? (COMPETENCY_LABELS[weakest.key as keyof typeof COMPETENCY_LABELS] ?? weakest.key) : '');
  const active = $derived(data.active[0]);
  const lastInterviewer = $derived(data.recent[0]?.agent.name ?? data.interviewers[0]?.name ?? 'sam');
  const hours = $derived(p.minutes >= 60 ? `${Math.floor(p.minutes / 60)}h ${p.minutes % 60}m` : `${p.minutes}m`);
</script>

<svelte:head><title>Home · PrepMe</title></svelte:head>

<div class="flex h-9 items-center justify-between gap-4">
  <h1 class="text-xl font-bold tracking-tight">{greeting}, {first}</h1>
  <Button href="/dashboard/interviews/new"><Plus /> New interview</Button>
</div>

<!-- One "what to do next" strip. -->
<section class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl bg-primary px-5 py-4 text-primary-foreground" aria-label="Next step">
  {#if active}
    <InterviewerAvatar name={active.agent.name} size="lg" class="ring-2 ring-white/80" />
    <div class="min-w-0 flex-1">
      <div class="text-xs font-medium opacity-80">Interview in progress</div>
      <div class="truncate text-[17px] font-bold">{active.name}</div>
      <div class="text-[13px] opacity-80">Your answers so far are saved.</div>
    </div>
    <Button href="/call/{active.id}" class="bg-white text-[#18161f] hover:bg-white/90">Rejoin <ArrowRight /></Button>
  {:else if p.completedCount > 0 && weakest}
    <InterviewerAvatar name={lastInterviewer} size="lg" class="ring-2 ring-white/80" />
    <div class="min-w-0 flex-1">
      <div class="text-xs font-medium opacity-80">Practise next</div>
      <div class="truncate text-[17px] font-bold">{weakestLabel}</div>
      <div class="text-[13px] opacity-80">Your lowest skill so far, at {weakest.avg} out of 5.</div>
    </div>
    <Button href="/dashboard/interviews/new?focus={encodeURIComponent(weakestLabel)}" class="bg-white text-[#18161f] hover:bg-white/90">
      Start a 10 minute drill <ArrowRight />
    </Button>
  {:else if data.interviewers.length}
    <InterviewerAvatar name={data.interviewers[0].name} size="lg" class="ring-2 ring-white/80" />
    <div class="min-w-0 flex-1">
      <div class="text-xs font-medium opacity-80">Ready when you are</div>
      <div class="truncate text-[17px] font-bold">Do your first interview with {data.interviewers[0].name}</div>
      <div class="text-[13px] opacity-80">You get a scorecard as soon as it ends.</div>
    </div>
    <Button href="/dashboard/interviews/new?interviewer={data.interviewers[0].id}" class="bg-white text-[#18161f] hover:bg-white/90">Start <ArrowRight /></Button>
  {:else}
    <InterviewerAvatar name="sam" size="lg" class="ring-2 ring-white/80" />
    <div class="min-w-0 flex-1">
      <div class="text-xs font-medium opacity-80">Start here</div>
      <div class="truncate text-[17px] font-bold">Make your first interviewer</div>
      <div class="text-[13px] opacity-80">Name the job. It takes a minute.</div>
    </div>
    <Button onclick={() => (creating = true)} class="bg-white text-[#18161f] hover:bg-white/90">New interviewer <ArrowRight /></Button>
  {/if}
</section>

<!-- Stats: one row, no cards. -->
<section class="mt-3 grid grid-cols-2 rounded-xl border bg-card sm:grid-cols-4" aria-label="Your stats">
  {#each [
    { label: 'interviews done', value: p.completedCount },
    { label: 'average score', value: p.averageScore ?? '—' },
    { label: 'best score', value: p.best ?? '—' },
    { label: 'spoken practice', value: hours }
  ] as s, i}
    <div class="flex items-baseline gap-2 px-5 py-3.5 {i ? 'sm:border-l' : ''} {i % 2 ? 'border-l' : ''} {i > 1 ? 'border-t sm:border-t-0' : ''}">
      <span class="tabular text-2xl font-extrabold tracking-tight">{s.value}</span>
      <span class="text-[13px] text-muted-foreground">{s.label}</span>
    </div>
  {/each}
</section>

<div class="mt-3 grid items-start gap-3 lg:grid-cols-[1.55fr_1fr]">
  <section class="overflow-hidden rounded-xl border bg-card">
    <div class="flex items-baseline justify-between px-4 pt-3.5 pb-2.5">
      <h2 class="text-sm font-bold">Recent interviews</h2>
      <a href="/dashboard/interviews" class="text-[13px] font-semibold text-primary hover:underline">See all</a>
    </div>
    {#if data.recent.length}
      <InterviewHead />
      {#each data.recent as row (row.id)}<InterviewRow {row} />{/each}
    {:else}
      <p class="border-t px-4 py-6 text-sm text-muted-foreground">Nothing yet. Your interviews and scores will show here.</p>
    {/if}
  </section>

  <div class="grid gap-3">
    <section class="rounded-xl border bg-card px-4 py-3.5">
      <div class="flex items-baseline gap-2">
        <h2 class="text-sm font-bold">Your skills</h2>
        <span class="text-xs text-faint">
          {p.completedCount ? `average of your ${p.completedCount} scored interview${p.completedCount === 1 ? '' : 's'}` : 'scored out of 5 after each interview'}
        </span>
      </div>
      <div class="mt-3">
        {#if p.competencies.length}
          <CompetencyBars items={p.competencies.map((c) => ({ key: c.key, score: c.avg }))} />
        {:else}
          <CompetencyBars items={Object.keys(COMPETENCY_LABELS).map((key) => ({ key, score: 0 }))} />
        {/if}
      </div>
    </section>

    <section class="overflow-hidden rounded-xl border bg-card">
      <div class="flex items-baseline justify-between px-4 pt-3.5 pb-2.5">
        <h2 class="text-sm font-bold">Your interviewers</h2>
        <button type="button" class="text-[13px] font-semibold text-primary hover:underline" onclick={() => (creating = true)}>New</button>
      </div>
      {#each data.interviewers as i (i.id)}
        <div class="flex items-center gap-2.5 border-t px-4 py-2 text-sm">
          <InterviewerAvatar name={i.name} size="sm" />
          <a href="/dashboard/interviewers/{i.id}" class="min-w-0 flex-1 truncate font-semibold hover:underline">{i.name}</a>
          <span class="tabular text-[13px] text-faint">{i.interviewCount} interview{i.interviewCount === 1 ? '' : 's'}</span>
          <a href="/dashboard/interviews/new?interviewer={i.id}" class="text-[13px] font-semibold text-primary hover:underline">Start</a>
        </div>
      {:else}
        <p class="border-t px-4 py-4 text-sm text-muted-foreground">None yet.</p>
      {/each}
    </section>
  </div>
</div>

<InterviewerDialog bind:open={creating} />
