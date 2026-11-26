<script lang="ts">
  import { enhance } from '$app/forms';
  import { format } from 'date-fns';
  import { Button, buttonVariants } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Menu from '$lib/components/ui/menu';
  import CvPicker, { type PickedCv } from '$lib/components/app/cv-picker.svelte';
  import FitView from '$lib/components/app/fit-view.svelte';
  import InterviewHead from '$lib/components/app/interview-head.svelte';
  import InterviewRow from '$lib/components/app/interview-row.svelte';
  import QuestionBank from '$lib/components/app/question-bank.svelte';
  import RoundsPath, { type PathStep } from '$lib/components/app/rounds-path.svelte';
  import Ring from '$lib/components/viz/ring.svelte';
  import { formatDay, jobName, PASS_MARK, whenLine } from '$lib/jobs';
  import { scoreTone } from '$lib/utils';
  import { ChevronRight, Ellipsis, LoaderCircle, Mic, Pencil, Sparkles, Trash2 } from '$lib/icons';

  let { data, form } = $props();
  const job = $derived(data.job);
  const r = $derived(data.readiness);

  let editing = $state(false);
  let rechecking = $state(false);
  let confirmDelete = $state(false);
  let busy = $state(false);
  let error = $state<string | null>(null);
  let cv = $state<PickedCv | null>(null);
  let cvBusy = $state(false);

  const practise = (roundId?: string) => `/dashboard/interviews/new?job=${job.id}${roundId ? `&round=${roundId}` : ''}`;

  const steps = $derived<PathStep[]>([
    ...r.rounds.map((p) => ({
      key: p.round.id,
      title: p.round.name,
      meta:
        p.state === 'done' && p.lastAt
          ? `Practised ${format(p.lastAt, 'd MMM')}${p.count > 1 ? ` · ${p.count} times` : ''}`
          : p.state === 'next'
            ? `Next · ${p.round.focus}`
            : p.round.focus,
      state: p.state === 'done' ? ('done' as const) : p.state === 'next' ? ('current' as const) : ('todo' as const),
      score: p.score,
      href: practise(p.round.id)
    })),
    {
      key: 'goal',
      title: 'The real interview',
      meta: job.interviewDate ? `${formatDay(job.interviewDate)} · the real one` : 'Add the date when you know it',
      state: 'goal'
    }
  ]);

  const readyLine = $derived(
    r.score == null ? 'Practise a round to get a score' : r.toPass ? `${r.toPass} to pass` : `At or above the pass mark of ${PASS_MARK}`
  );
  const toneText = (v: number) => {
    const t = scoreTone(v);
    return t === 'good' ? 'bg-success' : t === 'ok' ? 'bg-warning' : 'bg-destructive';
  };

  /** Closes a pop-up when its form saved, and shows the message when it did not. */
  const submit = (close: () => void) => () => {
    busy = true;
    error = null;
    return async ({ result, update }: { result: { type: string; data?: Record<string, unknown> }; update: () => Promise<void> }) => {
      await update();
      busy = false;
      if (result.type === 'failure') error = String(result.data?.error ?? 'Check the form');
      else close();
    };
  };
</script>

<svelte:head><title>{jobName(job)} · PrepMe</title></svelte:head>

<a href="/dashboard/jobs" class="text-xs text-muted-foreground hover:text-foreground">Jobs /</a>

<header class="mt-1 flex flex-wrap items-start justify-between gap-4">
  <div class="min-w-0">
    <h1 class="page-title truncate">{jobName(job)}</h1>
    <p class="mt-1 text-sm text-muted-foreground">{[whenLine(job.interviewDate), job.location].filter(Boolean).join(' · ')}</p>
  </div>
  <div class="flex items-center gap-2">
    <Button href={practise(r.nextRound?.id)}><Mic /> {r.nextRound ? 'Practise next round' : 'Practise again'}</Button>
    <Menu.Root>
      <Menu.Trigger aria-label="More actions" class={buttonVariants({ variant: 'outline', size: 'icon' })}><Ellipsis /></Menu.Trigger>
      <Menu.Content align="end">
        <Menu.Item onSelect={() => ((error = null), (editing = true))}><Pencil /> Edit details</Menu.Item>
        <Menu.Item variant="destructive" onSelect={() => (confirmDelete = true)}><Trash2 /> Delete</Menu.Item>
      </Menu.Content>
    </Menu.Root>
  </div>
</header>

<!-- The key numbers in one hairline strip. -->
<section class="mt-6 grid grid-cols-2 border-y sm:grid-cols-4" aria-label="Where you stand">
  {#snippet kpi(label: string, value: string, note: string, tone = '')}
    <div class="grid min-w-0 content-start gap-1 py-3 sm:px-5 sm:py-3.5 sm:first:pl-0 sm:[&:not(:first-child)]:border-l max-sm:[&:nth-child(n+3)]:border-t">
      <span class="text-xs text-muted-foreground">{label}</span>
      <b class="tabular truncate text-xl leading-6 font-bold tracking-tight {tone}">{value}</b>
      <span class="truncate text-xs text-muted-foreground" title={note}>{note}</span>
    </div>
  {/snippet}
  <div class="grid min-w-0 content-start gap-1 py-3 sm:py-3.5 sm:pr-5">
    <span class="text-xs text-muted-foreground">Readiness</span>
    <div class="flex items-center gap-2.5">
      <Ring value={r.score} size={40} stroke={4} number={false} />
      <div class="grid min-w-0">
        <b class="tabular text-xl leading-6 font-bold tracking-tight">{r.score ?? '–'}</b>
        <span class="truncate text-xs text-muted-foreground" title={readyLine}>{readyLine}</span>
      </div>
    </div>
  </div>
  {@render kpi('Next round', r.nextRound?.name ?? 'All practised', r.nextRound?.focus ?? 'Keep your scores up until the day')}
  {@render kpi('Practice interviews', String(r.practised), `${r.practisedThisWeek} this week`)}
  {@render kpi(
    'Since first try',
    r.sinceFirst == null ? '–' : `${r.sinceFirst > 0 ? '+' : ''}${r.sinceFirst}`,
    r.sinceFirst == null ? 'Shows after two scored interviews' : 'points',
    r.sinceFirst == null ? 'text-faint' : r.sinceFirst > 0 ? 'text-success-text' : r.sinceFirst < 0 ? 'text-destructive' : ''
  )}
</section>

<div class="mt-8 grid gap-x-10 gap-y-8 lg:grid-cols-2">
  <section aria-label="Rounds" class="min-w-0">
    <h2 class="section-title flex h-8 items-center">Rounds</h2>
    <div class="mt-2"><RoundsPath {steps} /></div>
  </section>

  <section aria-label="Skills" class="min-w-0">
    <div class="flex h-8 items-center justify-between">
      <h2 class="section-title">Skills</h2>
      {#if r.skills.length}<span class="text-xs text-muted-foreground">first → latest</span>{/if}
    </div>
    {#if r.skills.length}
      <ul class="mt-2">
        {#each r.skills as s (s.key)}
          <li class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-b py-2">
            <b class="text-[13px] font-semibold">{s.label}</b>
            <span class="tabular text-xs text-muted-foreground">
              {#if s.first !== s.latest}{s.first} → {/if}<em class="font-bold text-foreground not-italic">{s.latest}</em>
            </span>
            <span class="col-span-2 h-1 overflow-hidden rounded-full bg-track" role="img" aria-label="{s.label}: {s.latest} out of 100">
              <span class="grow-x block h-full rounded-full {toneText(s.latest)}" style="width:{s.latest}%"></span>
            </span>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="mt-2 border-y py-4 text-sm text-muted-foreground">Your score for each skill shows here after your first scored practice, then how it moves.</p>
    {/if}
  </section>

  <section aria-label="Fit check" class="min-w-0">
    {#if job.fit}
      <FitView fit={job.fit} />
    {:else}
      <h2 class="section-title flex h-8 items-center">Fit check</h2>
      <p class="mt-2 border-y py-4 text-sm text-muted-foreground">Add your CV to see what it covers of this advert and where the gaps are.</p>
    {/if}
    <button type="button" class="link mt-4 inline-flex items-center gap-1.5 text-xs" onclick={() => ((error = null), (cv = null), (rechecking = true))}>
      <Sparkles class="size-3.5" />{job.fit ? 'Check again with a new CV' : 'Add your CV'}
    </button>
  </section>

  <section aria-label="Practice interviews" class="min-w-0">
    <div class="flex h-8 items-center justify-between">
      <h2 class="section-title">Practice interviews</h2>
      {#if data.moreInterviews}<a href="/dashboard/interviews" class="link text-xs">View all</a>{/if}
    </div>
    <div class="mt-2">
      {#if data.interviews.length}
        <InterviewHead cols="home" />
        <div class="stagger">
          {#each data.interviews as row (row.id)}<InterviewRow {row} cols="home" />{/each}
        </div>
      {:else}
        <p class="border-y py-4 text-sm text-muted-foreground">Nothing yet. Each practice for this job shows here with its score.</p>
      {/if}
    </div>
  </section>
</div>

<div class="mt-8">
  <QuestionBank jobId={job.id} bank={data.bank} rounds={r.rounds.map((p) => p.round)} left={data.bankAnswersLeft} kept={data.keptStories} error={form?.bankError} />
</div>

<details class="group mt-8 border-t pt-4">
  <summary class="flex w-fit cursor-pointer list-none items-center gap-1 text-[13px] font-semibold text-muted-foreground hover:text-foreground">
    <ChevronRight class="size-4 transition-transform group-open:rotate-90" /> The advert
  </summary>
  <p class="mt-3 max-h-96 max-w-3xl overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{job.advert}</p>
</details>

<Dialog.Root bind:open={editing}>
  <Dialog.Content class="gap-0 p-0 sm:max-w-[480px]">
    <Dialog.Header class="flex h-[52px] justify-center border-b px-6">
      <Dialog.Title class="text-xl font-extrabold tracking-[-0.01em]">Edit details</Dialog.Title>
      <Dialog.Description class="sr-only">Change the job title, company, place and interview date.</Dialog.Description>
    </Dialog.Header>
    <form method="POST" action="?/update" use:enhance={submit(() => (editing = false))}>
      <div class="grid gap-5 p-6">
        <div class="grid gap-2">
          <Label for="ej-title" class="text-xs font-bold">Job title</Label>
          <Input id="ej-title" name="title" value={job.title} maxlength={90} required autocomplete="off" />
        </div>
        <div class="grid gap-5 sm:grid-cols-2">
          <div class="grid gap-2">
            <Label for="ej-company" class="text-xs font-bold">Company</Label>
            <Input id="ej-company" name="company" value={job.company} maxlength={60} autocomplete="off" />
          </div>
          <div class="grid gap-2">
            <Label for="ej-location" class="text-xs font-bold">Place</Label>
            <Input id="ej-location" name="location" value={job.location} maxlength={60} autocomplete="off" />
          </div>
        </div>
        <div class="grid gap-2">
          <Label for="ej-date" class="text-xs font-bold">Interview date</Label>
          <Input id="ej-date" name="interviewDate" type="date" value={job.interviewDate ?? ''} />
        </div>
        {#if error}<p class="rounded-[8px] bg-destructive-soft px-3 py-2 text-sm text-destructive" role="alert">{error}</p>{/if}
      </div>
      <div class="flex justify-end gap-2 border-t px-6 py-4">
        <Button type="button" variant="outline" onclick={() => (editing = false)}>Cancel</Button>
        <Button type="submit" disabled={busy}>{#if busy}<LoaderCircle class="animate-spin" />{/if}Save</Button>
      </div>
    </form>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={rechecking}>
  <Dialog.Content class="gap-0 p-0 sm:max-w-[480px]">
    <Dialog.Header class="flex h-[52px] justify-center border-b px-6">
      <Dialog.Title class="text-xl font-extrabold tracking-[-0.01em]">Check your fit</Dialog.Title>
      <Dialog.Description class="sr-only">Compare a CV with this advert.</Dialog.Description>
    </Dialog.Header>
    <form method="POST" action="?/recheck" use:enhance={submit(() => (rechecking = false))}>
      <div class="grid gap-3 p-6 *:min-w-0">
        <p class="text-sm text-muted-foreground">
          {job.cvName ? `Last checked with ${job.cvName}. Add a newer CV, or check again with the same one.` : 'Add your CV to compare it with this advert.'}
        </p>
        <CvPicker bind:cv bind:busy={cvBusy} id="rj-cv" hint="PDF, Word or text" />
        {#if error}<p class="rounded-[8px] bg-destructive-soft px-3 py-2 text-sm text-destructive" role="alert">{error}</p>{/if}
      </div>
      <div class="flex items-center justify-end gap-2 border-t px-6 py-4">
        <span class="mr-auto hidden text-xs text-muted-foreground sm:block">Takes about 10 seconds</span>
        <Button type="button" variant="outline" onclick={() => (rechecking = false)}>Cancel</Button>
        <Button type="submit" disabled={busy || cvBusy || (!cv && !job.cvName)}>
          {#if busy}<LoaderCircle class="animate-spin" />{:else}<Sparkles />{/if}Check
        </Button>
      </div>
    </form>
  </Dialog.Content>
</Dialog.Root>

<AlertDialog.Root bind:open={confirmDelete}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Delete this job?</AlertDialog.Title>
      <AlertDialog.Description>“{jobName(job)}”, its fit check and readiness will be removed. Your practice interviews are kept. This can't be undone.</AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Close>Cancel</AlertDialog.Close>
      <form method="POST" action="?/delete" use:enhance>
        <Button type="submit" variant="destructive">Delete</Button>
      </form>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
