<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import InterviewRow from '$lib/components/app/interview-row.svelte';
  import InterviewHead from '$lib/components/app/interview-head.svelte';
  import InterviewerAvatar from '$lib/components/app/interviewer-avatar.svelte';
  import { faceColour } from '$lib/avatars';
  import InterviewerDialog from '$lib/components/app/interviewer-dialog.svelte';
  import { ArrowRight, Plus } from '@lucide/svelte';

  let { data } = $props();
  let creating = $state(false);
  const p = $derived(data.progress);
  const first = $derived(data.user.name.split(' ')[0]);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const active = $derived(data.active[0]);
  const ready = $derived(data.recent.find((r) => r.status === 'upcoming'));
  const last = $derived(data.recent.find((r) => r.status === 'completed' && r.overallScore != null));

  // The single next step, picked from what the user has done so far.
  const next = $derived.by(() => {
    if (active)
      return {
        face: active.agent.name,
        label: 'Interview in progress',
        title: active.name,
        sub: 'Your answers so far are saved.',
        cta: 'Rejoin',
        href: `/call/${active.id}`
      };
    if (ready)
      return {
        face: ready.agent.name,
        label: 'Ready to start',
        title: ready.name,
        sub: `${ready.durationMinutes} minutes with ${ready.agent.name}.`,
        cta: 'Start interview',
        href: `/call/${ready.id}`
      };
    if (last)
      return {
        face: last.agent.name,
        label: 'Keep going',
        title: `Another round with ${last.agent.name}`,
        sub: `You scored ${last.overallScore} last time in "${last.name}".`,
        cta: 'Practise again',
        href: `/dashboard/interviews/new?interviewer=${last.agent.id}`
      };
    if (data.interviewers.length)
      return {
        face: data.interviewers[0].name,
        label: 'Ready when you are',
        title: `Do your first interview with ${data.interviewers[0].name}`,
        sub: 'You get a scorecard as soon as it ends.',
        cta: 'Start',
        href: `/dashboard/interviews/new?interviewer=${data.interviewers[0].id}`
      };
    return { face: 'sam', label: 'Start here', title: 'Make your first agent', sub: 'Name the job. It takes a minute.', cta: 'New agent', href: null };
  });
  const hours = $derived(p.minutes >= 60 ? `${Math.floor(p.minutes / 60)}h ${p.minutes % 60}m` : `${p.minutes}m`);
</script>

<svelte:head><title>Home · PrepMe</title></svelte:head>

<div class="flex h-9 items-center justify-between gap-4">
  <h1 class="text-xl font-bold tracking-tight">{greeting}, {first}</h1>
  <Button href="/dashboard/interviews/new" variant="outline"><Plus /> New interview</Button>
</div>

<!-- One "what to do next" strip, in the colour of the interviewer it is about. -->
<section
  class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl px-5 py-4 text-[#18161f]"
  style="background:{faceColour(next.face)}"
  aria-label="Next step"
>
  <InterviewerAvatar name={next.face} size="lg" class="ring-2 ring-white/80" />
  <div class="min-w-0 flex-1">
    <div class="text-xs font-semibold opacity-70">{next.label}</div>
    <div class="truncate text-[17px] font-bold">{next.title}</div>
    <div class="text-[13px] opacity-75">{next.sub}</div>
  </div>
  {#if next.href}
    <Button href={next.href} class="bg-[#18161f] text-white hover:bg-[#18161f]/90">{next.cta} <ArrowRight /></Button>
  {:else}
    <Button onclick={() => (creating = true)} class="bg-[#18161f] text-white hover:bg-[#18161f]/90">{next.cta} <ArrowRight /></Button>
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

<!-- Interviewers: a row of faces. Click one to start an interview with them. -->
<section class="mt-5" aria-label="Your agents">
  <div class="flex items-baseline justify-between">
    <h2 class="text-sm font-bold">Your agents</h2>
    <a href="/dashboard/interviewers" class="text-[13px] font-semibold underline decoration-input underline-offset-4 hover:decoration-foreground">Manage</a>
  </div>
  <div class="stagger mt-2.5 flex gap-5 overflow-x-auto pt-1 pb-1">
    {#each data.interviewers as i (i.id)}
      <a
        href="/dashboard/interviews/new?interviewer={i.id}"
        title="Start an interview with {i.name}"
        class="group flex w-[72px] shrink-0 flex-col items-center gap-1.5 text-center"
      >
        <InterviewerAvatar name={i.name} class="size-14 transition-transform duration-200 ease-out group-hover:-translate-y-1 group-hover:rotate-6" />
        <span class="w-full truncate text-[13px] font-semibold">{i.name}</span>
      </a>
    {/each}
    <button type="button" class="group flex w-[72px] shrink-0 flex-col items-center gap-1.5 text-center" onclick={() => (creating = true)}>
      <span class="grid size-14 place-items-center rounded-full border border-dashed border-input text-faint transition-colors group-hover:border-foreground group-hover:text-foreground">
        <Plus class="size-5" strokeWidth={1.8} />
      </span>
      <span class="text-[13px] font-semibold text-muted-foreground group-hover:text-foreground">New</span>
    </button>
  </div>
</section>

<section class="stagger mt-5 overflow-hidden rounded-xl border bg-card">
  <div class="flex items-baseline justify-between px-4 pt-3.5 pb-2.5">
    <h2 class="text-sm font-bold">Recent interviews</h2>
    <a href="/dashboard/interviews" class="text-[13px] font-semibold underline decoration-input underline-offset-4 hover:decoration-foreground">See all</a>
  </div>
  {#if data.recent.length}
    <InterviewHead />
    {#each data.recent as row (row.id)}<InterviewRow {row} />{/each}
  {:else}
    <p class="border-t px-4 py-6 text-sm text-muted-foreground">Nothing yet. Your interviews and scores will show here.</p>
  {/if}
</section>

<InterviewerDialog bind:open={creating} />
