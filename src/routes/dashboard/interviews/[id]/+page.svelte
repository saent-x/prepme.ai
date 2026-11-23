<script lang="ts">
  import { enhance } from '$app/forms';
  import { format } from 'date-fns';
  import Markdown from 'svelte-exmarkdown';
  import { gfmPlugin } from 'svelte-exmarkdown/gfm';
  import { Button, buttonVariants } from '$lib/components/ui/button';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import * as Menu from '$lib/components/ui/menu';
  import InterviewerAvatar from '$lib/components/app/interviewer-avatar.svelte';
  import StatusBadge from '$lib/components/app/status-badge.svelte';
  import TranscriptView from '$lib/components/results/transcript-view.svelte';
  import CoachChat from '$lib/components/results/coach-chat.svelte';
  import ScoringState from '$lib/components/results/scoring-state.svelte';
  import { formatDuration, scoreTone } from '$lib/utils';
  import ScoreRing from '$lib/components/viz/score-ring.svelte';
  import { COMPETENCY_LABELS } from '$lib/interview-types';
  import { Check, ChevronDown, ChevronRight, Ellipsis, Mic, Pencil, RotateCcw, Target, Trash2 } from '@lucide/svelte';

  let { data, form } = $props();
  const i = $derived(data.interview);
  const transcript = $derived(i.transcript ?? []);
  let confirmDelete = $state(false);
  let renaming = $state(false);
  const sc = $derived(i.status === 'completed' ? i.scorecard : null);
</script>

<svelte:head><title>{i.name} · PrepMe</title></svelte:head>

<div class="grid gap-10 {i.status === 'completed' ? 'xl:grid-cols-[minmax(0,1fr)_360px]' : ''}">
  <div class="min-w-0">
    <a href="/dashboard/interviews" class="text-xs text-muted-foreground hover:text-foreground">Interviews /</a>

    <header class="mt-1 flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        {#if renaming}
          <form method="POST" action="?/rename" use:enhance={() => async ({ update }) => { await update(); renaming = false; }} class="flex gap-2">
            <input name="name" value={i.name} class="h-10 rounded-[8px] border bg-card px-3 font-bold" aria-label="Interview name" />
            <Button type="submit">Save</Button>
          </form>
        {:else}
          <h1 class="truncate text-[28px] leading-tight font-extrabold tracking-[-0.02em]">{i.name}</h1>
        {/if}
        <p class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <a href="/dashboard/interviewers/{i.agent.id}" class="inline-flex items-center gap-2 hover:text-foreground">
            <InterviewerAvatar name={i.agent.name} class="size-5" />{i.agent.name}
          </a>
          <span>·</span><span>{format(i.startedAt ?? i.createdAt, 'd MMM')}</span>
          {#if i.duration}<span>·</span><span>{formatDuration(i.duration)}</span>{/if}
          {#if i.status !== 'completed'}<StatusBadge status={i.status} />{/if}
        </p>
      </div>
      <div class="flex items-center gap-2">
        {#if i.status === 'completed'}
          <form method="POST" action="?/again" use:enhance>
            <Button type="submit" variant="outline"><RotateCcw /> Practise again</Button>
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

    {#if form?.error}
      <p class="mt-4 rounded-[8px] bg-destructive-soft px-3 py-2 text-sm text-destructive">
        {form.error}
        {#if form.limit}<a href="/dashboard/billing" class="ml-1 font-semibold underline">See plans</a>{/if}
      </p>
    {/if}

    <div class="mt-8">
      {#if i.status === 'upcoming' || i.status === 'active'}
        <div class="grid place-items-center rounded-[10px] bg-muted px-6 py-12 text-center">
          <InterviewerAvatar name={i.agent.name} class="size-16" />
          <h2 class="mt-3 text-base font-extrabold">{i.status === 'active' ? 'Still in progress' : 'Ready when you are'}</h2>
          <p class="mt-1 max-w-md text-sm text-muted-foreground">
            {i.status === 'active' ? 'Your answers so far are saved.' : `${i.durationMinutes} min with ${i.agent.name}. Mic check first.`}
          </p>
          <Button href="/call/{i.id}" size="lg" class="mt-4"><Mic /> {i.status === 'active' ? 'Rejoin' : 'Start'}</Button>
        </div>
      {:else if i.status === 'processing'}
        <ScoringState interviewId={i.id} error={i.analysisError} />
      {:else if i.status === 'cancelled'}
        <p class="rounded-[10px] bg-muted p-5 text-sm text-muted-foreground">This interview was cancelled.</p>
      {:else if sc}
        <!-- Score + skills -->
        <section class="flex flex-col gap-8 border-b pb-8 sm:flex-row sm:items-center" aria-label="Score">
          <ScoreRing score={sc.overall_score} size={128} stroke={10} label="/ 100" />
          <ul class="grid flex-1 gap-3">
            {#each sc.competencies as c (c.key)}
              {@const v = c.score * 20}
              {@const tone = scoreTone(v)}
              <li class="grid grid-cols-[140px_minmax(0,1fr)_32px] items-center gap-4" title={c.evidence}>
                <span class="text-sm font-semibold">{COMPETENCY_LABELS[c.key]}</span>
                <span class="h-1.5 rounded-[3px] bg-track">
                  <span class="grow-x block h-full rounded-[3px] {tone === 'good' ? 'bg-success' : tone === 'ok' ? 'bg-warning' : 'bg-destructive'}" style="width:{v}%"></span>
                </span>
                <span class="tabular text-right text-sm font-bold {tone === 'good' ? 'text-success' : tone === 'ok' ? 'text-warning-text' : 'text-destructive'}">{v}</span>
              </li>
            {/each}
          </ul>
        </section>

        <!-- Strengths / To improve -->
        <section class="grid gap-8 border-b py-8 sm:grid-cols-2">
          <div>
            <h3 class="flex items-center gap-2 text-base font-extrabold"><Check class="size-5 text-success" strokeWidth={2} /> Strengths</h3>
            <ul class="mt-3 grid gap-2.5">
              {#each sc.strengths as s}
                <li class="flex items-start gap-2.5 text-sm"><span class="mt-[7px] size-1.5 shrink-0 rounded-full bg-success"></span>{s}</li>
              {/each}
            </ul>
          </div>
          <div>
            <h3 class="flex items-center gap-2 text-base font-extrabold"><Target class="size-5 text-warning" strokeWidth={1.8} /> To improve</h3>
            <ul class="mt-3 grid gap-2.5">
              {#each sc.improvements as imp}
                <li class="flex items-start gap-2.5 text-sm" title={imp.detail}><span class="mt-[7px] size-1.5 shrink-0 rounded-full bg-warning"></span>{imp.title}</li>
              {/each}
            </ul>
          </div>
        </section>

        <!-- Key moments: each question, scored -->
        <section class="py-8" aria-label="Key moments">
          <h3 class="text-base font-extrabold">Key moments</h3>
          <ul class="mt-3 border-t">
            {#each sc.questions as q, n}
              {@const tag = q.score >= 4 ? { label: 'Strong answer', c: 'bg-success-soft text-success', bar: 'bg-success' } : q.score === 3 ? { label: 'Could be sharper', c: 'bg-warning-soft text-warning-text', bar: 'bg-warning' } : { label: 'Weak answer', c: 'bg-destructive-soft text-destructive', bar: 'bg-destructive' }}
              <li class="border-b">
                <details class="group">
                  <summary class="flex min-h-16 cursor-pointer list-none items-center gap-4 py-3">
                    <span class="h-10 w-[3px] shrink-0 rounded-full {tag.bar}"></span>
                    <span class="w-8 shrink-0 text-xs font-bold text-muted-foreground">Q{n + 1}</span>
                    <span class="min-w-0 flex-1 text-sm leading-snug">“{q.question}”</span>
                    <span class="hidden h-6 shrink-0 items-center rounded-full px-2.5 text-xs font-semibold sm:inline-flex {tag.c}">{tag.label}</span>
                    <ChevronDown class="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" strokeWidth={1.6} />
                  </summary>
                  <div class="grid gap-3 pb-4 pl-[60px] text-sm leading-normal">
                    <p><span class="font-bold">You said:</span> <span class="text-muted-foreground">{q.answer_summary}</span></p>
                    <p><span class="font-bold">Feedback:</span> <span class="text-muted-foreground">{q.feedback}</span></p>
                    <p><span class="font-bold">Stronger:</span> <span class="text-muted-foreground">{q.stronger_answer}</span></p>
                  </div>
                </details>
              </li>
            {/each}
          </ul>
        </section>

        <details class="group border-t pt-6">
          <summary class="flex w-fit cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ChevronRight class="size-4 transition-transform group-open:rotate-90" strokeWidth={1.6} /> Full transcript
          </summary>
          <div class="mt-4"><TranscriptView {transcript} interviewerName={i.agent.name} candidateName="You" title={i.name} /></div>
        </details>
      {:else}
        <!-- Too short to score, or an interview from before v2 (summary only). -->
        <div class="rounded-[10px] bg-muted p-6">
          {#if i.summary}
            <div class="prose-lite max-w-prose"><Markdown md={i.summary} plugins={[gfmPlugin()]} /></div>
          {:else}
            <p class="text-muted-foreground">No scores for this interview.</p>
          {/if}
        </div>
        <div class="mt-6"><TranscriptView {transcript} interviewerName={i.agent.name} candidateName="You" title={i.name} /></div>
      {/if}
    </div>
  </div>

  {#if i.status === 'completed'}
    <aside class="xl:sticky xl:top-8 xl:h-[calc(100svh-64px)]">
      <CoachChat interviewId={i.id} initial={data.messages} />
    </aside>
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
