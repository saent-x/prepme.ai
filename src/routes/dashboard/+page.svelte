<script lang="ts">
  import { format } from 'date-fns';
  import { Button } from '$lib/components/ui/button';
  import InterviewerAvatar from '$lib/components/app/interviewer-avatar.svelte';
  import InterviewerDialog from '$lib/components/app/interviewer-dialog.svelte';
  import ScoreChip from '$lib/components/app/score-chip.svelte';
  import StatusBadge from '$lib/components/app/status-badge.svelte';
  import { splitTitle } from '$lib/interviewer-brief';
  import { ChevronRight, Mic, Plus } from '@lucide/svelte';

  let { data } = $props();
  let creating = $state(false);
  const first = $derived(data.user.name.split(' ')[0]);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const active = $derived(data.active[0]);
  const ready = $derived(data.recent.find((r) => r.status === 'upcoming'));
  const last = $derived(data.recent.find((r) => r.status === 'completed' && r.overallScore != null));

  // The single next step, picked from what the user has done so far.
  type Next = { face: string; label: string; title: string; meta: string; cta: string; href: string | null; edit?: string };
  const next = $derived.by((): Next => {
    if (active)
      return {
        face: active.agent.name,
        label: 'In progress',
        title: active.name,
        meta: `${active.agent.name} · your answers so far are saved`,
        cta: 'Rejoin',
        href: `/call/${active.id}`
      };
    if (ready)
      return {
        face: ready.agent.name,
        label: 'Next up',
        title: ready.name,
        meta: `${ready.agent.name} · ${ready.durationMinutes} min`,
        cta: 'Start',
        href: `/call/${ready.id}`,
        edit: `/dashboard/interviews/${ready.id}`
      };
    if (last)
      return {
        face: last.agent.name,
        label: 'Keep going',
        title: `Another round with ${last.agent.name}`,
        meta: `${last.overallScore} last time · ${last.name}`,
        cta: 'Start',
        href: `/dashboard/interviews/new?interviewer=${last.agent.id}`
      };
    if (data.interviewers.length)
      return {
        face: data.interviewers[0].name,
        label: 'Next up',
        title: `First interview with ${data.interviewers[0].name}`,
        meta: 'A score per skill as soon as it ends',
        cta: 'Start',
        href: `/dashboard/interviews/new?interviewer=${data.interviewers[0].id}`
      };
    return { face: 'Maya', label: 'Start here', title: 'Make your first agent', meta: 'Name the job. It takes a minute.', cta: 'New agent', href: null };
  });
</script>

<svelte:head><title>Home · PrepMe</title></svelte:head>

<div class="flex h-10 items-center justify-between gap-4">
  <h1 class="text-[28px] leading-none font-extrabold tracking-[-0.02em]">{greeting}, {first}</h1>
  <Button href="/dashboard/interviews/new"><Plus /> New interview</Button>
</div>

<!-- The one next step. -->
<section class="mt-8 flex min-h-24 flex-wrap items-center gap-x-6 gap-y-3 rounded-[10px] bg-muted px-6 py-6" aria-label="Next step">
  <InterviewerAvatar name={next.face} class="size-12" />
  <div class="min-w-0 sm:w-[260px]">
    <div class="text-xs font-semibold text-muted-foreground">{next.label}</div>
    <div class="truncate text-base font-extrabold">{next.title}</div>
  </div>
  <div class="hidden min-w-0 flex-1 truncate text-sm text-muted-foreground md:block">{next.meta}</div>
  <div class="ml-auto flex gap-2">
    {#if next.edit}<Button href={next.edit} variant="outline">Edit</Button>{/if}
    {#if next.href}
      <Button href={next.href}>{next.cta}</Button>
    {:else}
      <Button onclick={() => (creating = true)}>{next.cta}</Button>
    {/if}
  </div>
</section>

<div class="mt-8 grid gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(280px,320px)]">
  <section aria-label="Recent interviews" class="min-w-0">
    <div class="flex h-8 items-center justify-between">
      <h2 class="text-base font-bold">Recent interviews</h2>
      <a href="/dashboard/interviews" class="text-sm font-semibold text-muted-foreground hover:text-foreground">View all</a>
    </div>
    <div class="stagger mt-2 border-t">
      {#each data.recent.slice(0, 6) as row (row.id)}
        {@const t = splitTitle(row.name)}
        <a
          href="/dashboard/interviews/{row.id}"
          class="group grid h-12 grid-cols-[20px_minmax(0,1fr)_auto_20px] items-center gap-4 border-b text-sm transition-colors hover:bg-muted sm:grid-cols-[20px_minmax(0,1.4fr)_minmax(0,1fr)_64px_48px_20px]"
        >
          <Mic class="size-5 text-muted-foreground" strokeWidth={1.6} />
          <span class="truncate font-bold">{t.role}</span>
          <span class="hidden truncate text-muted-foreground sm:block">{t.company || row.agent.name}</span>
          <span class="hidden text-muted-foreground sm:block">{format(new Date(row.createdAt), 'd MMM')}</span>
          <span class="flex justify-start">
            {#if row.status === 'completed'}<ScoreChip score={row.overallScore} />{:else}<StatusBadge status={row.status} />{/if}
          </span>
          <ChevronRight class="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" strokeWidth={1.6} />
        </a>
      {:else}
        <p class="border-b py-4 text-sm text-muted-foreground">Nothing yet. Your interviews and scores will show here.</p>
      {/each}
    </div>
  </section>

  <section aria-label="Agents" class="min-w-0">
    <div class="flex h-8 items-center justify-between">
      <h2 class="text-base font-bold">Agents</h2>
      <a href="/dashboard/interviewers" class="text-sm font-semibold text-muted-foreground hover:text-foreground">Manage</a>
    </div>
    <div class="stagger mt-2 border-t">
      {#each data.interviewers as i (i.id)}
        <a
          href="/dashboard/interviews/new?interviewer={i.id}"
          title="Start an interview with {i.name}"
          class="group flex h-12 items-center gap-3 border-b text-sm transition-colors hover:bg-muted"
        >
          <InterviewerAvatar name={i.name} class="size-7 transition-transform duration-200 group-hover:-rotate-6" />
          <span class="min-w-0 flex-1 truncate font-bold">{i.name}</span>
          {#if i.style}<span class="text-muted-foreground">{i.style}</span>{/if}
        </a>
      {/each}
      <button type="button" class="group flex h-12 w-full items-center gap-3 border-b text-sm text-muted-foreground hover:text-foreground" onclick={() => (creating = true)}>
        <span class="grid size-7 place-items-center rounded-full border border-input"><Plus class="size-4" strokeWidth={1.6} /></span>
        New agent
      </button>
    </div>
  </section>
</div>

<InterviewerDialog bind:open={creating} />
