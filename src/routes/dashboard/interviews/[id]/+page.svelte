<script lang="ts">
  import { enhance } from '$app/forms';
  import { format } from 'date-fns';
  import Markdown from 'svelte-exmarkdown';
  import { gfmPlugin } from 'svelte-exmarkdown/gfm';
  import { Button } from '$lib/components/ui/button';
  import * as Tabs from '$lib/components/ui/tabs';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import InterviewerAvatar from '$lib/components/app/interviewer-avatar.svelte';
  import StatusBadge from '$lib/components/app/status-badge.svelte';
  import ScorecardView from '$lib/components/results/scorecard-view.svelte';
  import QuestionsView from '$lib/components/results/questions-view.svelte';
  import TranscriptView from '$lib/components/results/transcript-view.svelte';
  import CoachChat from '$lib/components/results/coach-chat.svelte';
  import ScoringState from '$lib/components/results/scoring-state.svelte';
  import { formatDuration } from '$lib/utils';
  import { Ellipsis, Mic, PhoneCall, RotateCcw, Trash2, Pencil } from '@lucide/svelte';

  let { data, form } = $props();
  const i = $derived(data.interview);
  const transcript = $derived(i.transcript ?? []);
  let confirmDelete = $state(false);
  let renaming = $state(false);
  let tab = $state('scorecard');
</script>

<svelte:head><title>{i.name} · PrepMe</title></svelte:head>

<a href="/dashboard/interviews" class="text-sm text-muted-foreground hover:text-foreground">← Interviews</a>

<header class="mt-4 flex flex-wrap items-start justify-between gap-4">
  <div class="flex min-w-0 items-center gap-4">
    <InterviewerAvatar name={i.agent.name} size="lg" />
    <div class="min-w-0">
      {#if renaming}
        <form method="POST" action="?/rename" use:enhance={() => async ({ update }) => { await update(); renaming = false; }} class="flex gap-2">
          <input name="name" value={i.name} class="h-10 rounded-xl border bg-background px-3 text-lg font-semibold" aria-label="Interview name" />
          <Button type="submit" size="sm">Save</Button>
        </form>
      {:else}
        <h1 class="truncate text-2xl font-semibold tracking-tight sm:text-3xl">{i.name}</h1>
      {/if}
      <p class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        <a href="/dashboard/interviewers/{i.agent.id}" class="hover:text-foreground">{i.agent.name}</a>
        <span>·</span>
        <span>{format(i.startedAt ?? i.createdAt, 'd MMM yyyy, HH:mm')}</span>
        {#if i.duration}<span>·</span><span>{formatDuration(i.duration)}</span>{/if}
        <StatusBadge status={i.status} />
      </p>
    </div>
  </div>
  <div class="flex items-center gap-2">
    {#if i.status === 'completed'}
      <form method="POST" action="?/again" use:enhance>
        <Button type="submit" variant="signal"><RotateCcw /> Practise again</Button>
      </form>
    {/if}
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <Button {...props} variant="outline" size="icon" aria-label="More actions"><Ellipsis /></Button>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end">
        <DropdownMenu.Item onclick={() => (renaming = true)}><Pencil /> Rename</DropdownMenu.Item>
        <DropdownMenu.Item variant="destructive" onclick={() => (confirmDelete = true)}><Trash2 /> Delete</DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </div>
</header>

{#if form?.error}
  <p class="mt-6 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
    {form.error}
    {#if form.limit}<a href="/dashboard/billing" class="ml-1 font-medium underline">See plans</a>{/if}
  </p>
{/if}

<div class="mt-8">
  {#if i.status === 'upcoming' || i.status === 'active'}
    <div class="grid place-items-center rounded-3xl border bg-card px-6 py-20 text-center">
      <span class="grid size-14 place-items-center rounded-2xl bg-signal-soft text-signal">
        {#if i.status === 'active'}<PhoneCall />{:else}<Mic />{/if}
      </span>
      <h2 class="mt-5 text-xl font-semibold">{i.status === 'active' ? 'This interview is still in progress' : 'Ready when you are'}</h2>
      <p class="mt-2 max-w-md text-muted-foreground">
        {i.status === 'active'
          ? 'Your transcript so far is saved. Rejoin and the interviewer will pick up where you left off.'
          : `A ${i.durationMinutes}-minute voice interview with ${i.agent.name}. You'll check your microphone first.`}
      </p>
      <Button href="/call/{i.id}" variant="signal" size="xl" class="mt-7">
        <Mic /> {i.status === 'active' ? 'Rejoin interview' : 'Enter the interview room'}
      </Button>
    </div>
  {:else if i.status === 'processing'}
    <ScoringState interviewId={i.id} error={i.analysisError} />
  {:else if i.status === 'cancelled'}
    <p class="rounded-3xl border bg-card p-8 text-muted-foreground">This interview was cancelled.</p>
  {:else}
    <Tabs.Root bind:value={tab}>
      <Tabs.List class="mb-4 h-11 rounded-full p-1">
        <Tabs.Trigger value="scorecard" class="rounded-full px-4">Scorecard</Tabs.Trigger>
        {#if i.scorecard}<Tabs.Trigger value="questions" class="rounded-full px-4">Questions</Tabs.Trigger>{/if}
        <Tabs.Trigger value="transcript" class="rounded-full px-4">Transcript</Tabs.Trigger>
        <Tabs.Trigger value="coach" class="rounded-full px-4">Ask the coach</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="scorecard">
        {#if i.scorecard}
          <ScorecardView scorecard={i.scorecard} {transcript} />
        {:else}
          <!-- Too short to score, or an interview from before v2 (summary only). -->
          <div class="rounded-3xl border bg-card p-6 sm:p-8">
            {#if i.summary}
              <div class="prose-lite max-w-prose"><Markdown md={i.summary} plugins={[gfmPlugin()]} /></div>
            {:else}
              <p class="text-muted-foreground">No scorecard for this interview.</p>
            {/if}
          </div>
        {/if}
      </Tabs.Content>
      {#if i.scorecard}
        <Tabs.Content value="questions"><QuestionsView questions={i.scorecard.questions} /></Tabs.Content>
      {/if}
      <Tabs.Content value="transcript">
        <TranscriptView {transcript} interviewerName={i.agent.name} candidateName="You" title={i.name} />
        {#if !transcript.length && i.transcriptUrl}
          <p class="mt-3 text-sm text-muted-foreground">This interview was recorded with the previous version of PrepMe, so its transcript isn't available here.</p>
        {/if}
      </Tabs.Content>
      <Tabs.Content value="coach"><CoachChat interviewId={i.id} initial={data.messages} /></Tabs.Content>
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
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <form method="POST" action="?/delete" use:enhance>
        <Button type="submit" variant="destructive">Delete</Button>
      </form>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
