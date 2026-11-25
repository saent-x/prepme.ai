<script lang="ts">
    import { Button } from '$lib/components/ui/button';
  import InterviewerAvatar from '$lib/components/app/interviewer-avatar.svelte';
  import InterviewerDialog from '$lib/components/app/interviewer-dialog.svelte';
  import InterviewHead from '$lib/components/app/interview-head.svelte';
  import InterviewRow from '$lib/components/app/interview-row.svelte';
  import { TABLE_HEAD, TABLE_ROW } from '$lib/components/app/table';
  import { cn } from '$lib/utils';
  import { Plus } from '@lucide/svelte';

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
    <div class="mt-2">
      {#if data.recent.length}
        <InterviewHead cols="home" />
        <div class="stagger">
          {#each data.recent.slice(0, 6) as row (row.id)}<InterviewRow {row} cols="home" />{/each}
        </div>
      {:else}
        <p class="border-y px-3 py-4 text-sm text-muted-foreground">Nothing yet. Your interviews and scores will show here.</p>
      {/if}
    </div>
  </section>

  <section aria-label="Agents" class="min-w-0">
    <div class="flex h-8 items-center justify-between">
      <h2 class="text-base font-bold">Agents</h2>
      <a href="/dashboard/interviewers" class="text-sm font-semibold text-muted-foreground hover:text-foreground">Manage</a>
    </div>
    <div class={cn(TABLE_HEAD, 'mt-2 flex justify-between')}><span>Agent</span><span>Style</span></div>
    <div class="stagger">
      {#each data.interviewers as i (i.id)}
        <a
          href="/dashboard/interviews/new?interviewer={i.id}"
          title="Start an interview with {i.name}"
          class={cn(TABLE_ROW, 'flex gap-3')}
        >
          <InterviewerAvatar name={i.name} class="size-7 transition-transform duration-200 group-hover:-rotate-6" />
          <span class="min-w-0 flex-1 truncate font-bold">{i.name}</span>
          {#if i.style}<span class="text-muted-foreground">{i.style}</span>{/if}
        </a>
      {/each}
      <button type="button" class={cn(TABLE_ROW, 'flex w-full gap-3 text-muted-foreground hover:text-foreground')} onclick={() => (creating = true)}>
        <span class="grid size-7 place-items-center rounded-full border border-input"><Plus class="size-4" strokeWidth={1.6} /></span>
        New agent
      </button>
    </div>
  </section>
</div>

<InterviewerDialog bind:open={creating} />
