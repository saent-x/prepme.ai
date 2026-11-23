<script lang="ts">
  import { enhance } from '$app/forms';
  import { format } from 'date-fns';
  import Markdown from 'svelte-exmarkdown';
  import { gfmPlugin } from 'svelte-exmarkdown/gfm';
  import { Button, buttonVariants } from '$lib/components/ui/button';
  import * as Tabs from '$lib/components/ui/tabs';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import * as Menu from '$lib/components/ui/menu';
  import InterviewerAvatar from '$lib/components/app/interviewer-avatar.svelte';
  import StatusBadge from '$lib/components/app/status-badge.svelte';
  import ScorecardView from '$lib/components/results/scorecard-view.svelte';
  import QuestionsView from '$lib/components/results/questions-view.svelte';
  import TranscriptView from '$lib/components/results/transcript-view.svelte';
  import CoachChat from '$lib/components/results/coach-chat.svelte';
  import ScoringState from '$lib/components/results/scoring-state.svelte';
  import { formatDuration } from '$lib/utils';
  import ScoreRing from '$lib/components/viz/score-ring.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { VERDICT_LABELS } from '$lib/interview-types';
  import { Ellipsis, Mic, RotateCcw, Trash2, Pencil } from '@lucide/svelte';

  let { data, form } = $props();
  const i = $derived(data.interview);
  const transcript = $derived(i.transcript ?? []);
  let confirmDelete = $state(false);
  let renaming = $state(false);
  let tab = $state<string | null>('scorecard');
  const verdictVariant = $derived(
    !i.scorecard ? 'outline' : ['strong_hire', 'hire'].includes(i.scorecard.verdict) ? 'success' : i.scorecard.verdict === 'lean_hire' ? 'warning' : 'destructive'
  );
</script>

<svelte:head><title>{i.name} · PrepMe</title></svelte:head>

<a href="/dashboard/interviews" class="text-[13px] text-muted-foreground hover:text-foreground">← Interviews</a>

<header class="mt-2 flex flex-wrap items-center justify-between gap-4">
  <div class="flex min-w-0 items-center gap-4">
    {#if i.status === 'completed' && i.scorecard}
      <ScoreRing score={i.scorecard.overall_score} size={76} stroke={7} label="" />
    {:else}
      <InterviewerAvatar name={i.agent.name} size="lg" />
    {/if}
    <div class="min-w-0">
      {#if renaming}
        <form method="POST" action="?/rename" use:enhance={() => async ({ update }) => { await update(); renaming = false; }} class="flex gap-2">
          <input name="name" value={i.name} class="h-9 rounded-md border border-input bg-card px-2.5 font-semibold" aria-label="Interview name" />
          <Button type="submit" size="sm">Save</Button>
        </form>
      {:else}
        <h1 class="truncate text-xl font-bold tracking-tight">{i.name}</h1>
      {/if}
      <p class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground">
        {#if i.status === 'completed' && i.scorecard}
          <Badge variant={verdictVariant}>{VERDICT_LABELS[i.scorecard.verdict]}</Badge>
        {:else}
          <StatusBadge status={i.status} />
        {/if}
        <a href="/dashboard/interviewers/{i.agent.id}" class="inline-flex items-center gap-1.5 hover:text-foreground">
          <InterviewerAvatar name={i.agent.name} class="size-4" />{i.agent.name}
        </a>
        <span>·</span>
        <span>{format(i.startedAt ?? i.createdAt, 'd MMM yyyy, HH:mm')}</span>
        {#if i.duration}<span>·</span><span>{formatDuration(i.duration)}</span>{/if}
      </p>
    </div>
  </div>
  <div class="flex items-center gap-2">
    {#if i.status === 'completed'}
      <form method="POST" action="?/again" use:enhance>
        <Button type="submit"><RotateCcw /> Practise again</Button>
      </form>
    {/if}
    <Menu.Root>
      <Menu.Trigger aria-label="More actions" class={buttonVariants({ variant: 'outline', size: 'icon' })}><Ellipsis /></Menu.Trigger>
      <Menu.Content align="end">
        <Menu.Item onSelect={() => (renaming = true)}><Pencil /> Rename</Menu.Item>
        <Menu.Item variant="destructive" onSelect={() => (confirmDelete = true)}><Trash2 /> Delete</Menu.Item>
      </Menu.Content>
    </Menu.Root>
  </div>
</header>
{#if i.status === 'completed' && i.scorecard}
  <p class="mt-3 max-w-3xl text-[17px] leading-snug font-bold text-balance">{i.scorecard.headline}</p>
{/if}

{#if form?.error}
  <p class="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
    {form.error}
    {#if form.limit}<a href="/dashboard/billing" class="ml-1 font-medium underline">See plans</a>{/if}
  </p>
{/if}

<div class="mt-4">
  {#if i.status === 'upcoming' || i.status === 'active'}
    <div class="grid place-items-center rounded-xl border bg-card px-6 py-12 text-center">
      <InterviewerAvatar name={i.agent.name} size="xl" />
      <h2 class="mt-3 font-bold">{i.status === 'active' ? 'This interview is still in progress' : 'Ready when you are'}</h2>
      <p class="mt-1 max-w-md text-sm text-muted-foreground">
        {i.status === 'active'
          ? 'Your answers so far are saved. Rejoin and the interviewer picks up where you left off.'
          : `${i.durationMinutes} minutes with ${i.agent.name}. You check your microphone first.`}
      </p>
      <Button href="/call/{i.id}" size="lg" class="mt-4">
        <Mic /> {i.status === 'active' ? 'Rejoin interview' : 'Start interview'}
      </Button>
    </div>
  {:else if i.status === 'processing'}
    <ScoringState interviewId={i.id} error={i.analysisError} />
  {:else if i.status === 'cancelled'}
    <p class="rounded-xl border bg-card p-5 text-sm text-muted-foreground">This interview was cancelled.</p>
  {:else}
    <Tabs.Root bind:value={tab}>
      <Tabs.List class="mb-4" aria-label="Interview results">
        <Tabs.Tab value="scorecard">Scorecard</Tabs.Tab>
        {#if i.scorecard}<Tabs.Tab value="questions">Question by question</Tabs.Tab>{/if}
        <Tabs.Tab value="transcript">Transcript</Tabs.Tab>
        <Tabs.Tab value="coach">Ask the coach</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="scorecard">
        {#if i.scorecard}
          <ScorecardView scorecard={i.scorecard} {transcript} />
        {:else}
          <!-- Too short to score, or an interview from before v2 (summary only). -->
          <div class="rounded-xl border bg-card p-5">
            {#if i.summary}
              <div class="prose-lite max-w-prose"><Markdown md={i.summary} plugins={[gfmPlugin()]} /></div>
            {:else}
              <p class="text-muted-foreground">No scorecard for this interview.</p>
            {/if}
          </div>
        {/if}
      </Tabs.Panel>
      {#if i.scorecard}
        <Tabs.Panel value="questions"><QuestionsView questions={i.scorecard.questions} /></Tabs.Panel>
      {/if}
      <Tabs.Panel value="transcript">
        <TranscriptView {transcript} interviewerName={i.agent.name} candidateName="You" title={i.name} />
        {#if !transcript.length && i.transcriptUrl}
          <p class="mt-3 text-sm text-muted-foreground">This interview was recorded with the previous version of PrepMe, so its transcript isn't available here.</p>
        {/if}
      </Tabs.Panel>
      <Tabs.Panel value="coach"><CoachChat interviewId={i.id} initial={data.messages} /></Tabs.Panel>
    </Tabs.Root>
  {/if}
</div>

<AlertDialog.Root bind:open={confirmDelete}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Delete this interview?</AlertDialog.Title>
      <AlertDialog.Description>“{i.name}”, its transcript, scorecard and coach chat will be removed. This can't be undone.</AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Close>Cancel</AlertDialog.Close>
      <form method="POST" action="?/delete" use:enhance>
        <Button type="submit" variant="destructive">Delete</Button>
      </form>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
