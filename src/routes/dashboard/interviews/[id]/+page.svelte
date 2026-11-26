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
  import { jobName } from '$lib/jobs';
  import { answerScore, gainLabel, nextToRedo, redosByQuestion } from '$lib/redo';
  import AnswerDialog, { type AnswerTarget } from '$lib/components/results/answer-dialog.svelte';
  import KeepStory from '$lib/components/app/keep-story.svelte';
  import { STORY_SCORE } from '$lib/bank';
  import { Check, ChevronDown, ChevronRight, Ellipsis, Mic, Pencil, Redo, RotateCcw, Target, Trash2 } from '$lib/icons';

  let { data, form } = $props();
  const i = $derived(data.interview);
  const transcript = $derived(i.transcript ?? []);
  let confirmDelete = $state(false);
  let renaming = $state(false);
  const sc = $derived(i.status === 'completed' ? i.scorecard : null);

  // Redo an answer: one question at a time, in a pop-up.
  const redone = $derived(redosByQuestion(data.redos));
  const suggested = $derived(sc ? nextToRedo(sc.questions, data.redos) : null);
  let redoOpen = $state(false);
  let redoing = $state<AnswerTarget | null>(null);
  function redo(index: number) {
    const q = sc?.questions[index];
    if (!q) return;
    redoing = {
      endpoint: `/api/interviews/${i.id}/redo`,
      fields: { question: String(index) },
      question: q.question,
      before: { score: answerScore(q), note: q.feedback }
    };
    redoOpen = true;
  }
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
          <h1 class="page-title truncate">{i.name}</h1>
        {/if}
        <p class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <a href="/dashboard/interviewers/{i.agent.id}" class="inline-flex items-center gap-2 hover:text-foreground">
            <InterviewerAvatar name={i.agent.name} class="size-5" />{i.agent.name}
          </a>
          <span>·</span><span>{format(i.startedAt ?? i.createdAt, 'd MMM')}</span>
          {#if i.duration}<span>·</span><span>{formatDuration(i.duration)}</span>{/if}
          {#if data.job}<span>·</span><a href="/dashboard/jobs/{data.job.id}" class="link font-normal">{jobName(data.job)}</a>{/if}
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
        <div class="grid place-items-center border-y py-10 text-center">
          <InterviewerAvatar name={i.agent.name} class="size-14" />
          <h2 class="section-title mt-3">{i.status === 'active' ? 'Still in progress' : 'Ready when you are'}</h2>
          <p class="mt-1 max-w-md text-sm text-muted-foreground">
            {i.status === 'active' ? 'Your answers so far are saved.' : `${i.durationMinutes} min with ${i.agent.name}. Mic check first.`}
          </p>
          <Button href="/call/{i.id}" size="lg" class="mt-4"><Mic /> {i.status === 'active' ? 'Rejoin' : 'Start'}</Button>
        </div>
      {:else if i.status === 'processing'}
        <ScoringState interviewId={i.id} error={i.analysisError} />
      {:else if i.status === 'cancelled'}
        <p class="border-y py-4 text-sm text-muted-foreground">This interview was cancelled.</p>
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
            <h3 class="section-title flex items-center gap-2"><Check class="size-5 text-success" /> Strengths</h3>
            <ul class="mt-3 grid gap-2.5">
              {#each sc.strengths as s}
                <li class="flex items-start gap-2.5 text-sm"><span class="mt-[7px] size-1.5 shrink-0 rounded-full bg-success"></span>{s}</li>
              {/each}
            </ul>
          </div>
          <div>
            <h3 class="section-title flex items-center gap-2"><Target class="size-5 text-warning" /> To improve</h3>
            <ul class="mt-3 grid gap-2.5">
              {#each sc.improvements as imp}
                <li class="flex items-start gap-2.5 text-sm" title={imp.detail}><span class="mt-[7px] size-1.5 shrink-0 rounded-full bg-warning"></span>{imp.title}</li>
              {/each}
            </ul>
          </div>
        </section>

        <!-- Key moments: each question, scored, with a redo -->
        <section class="py-8" aria-label="Key moments">
          <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3 class="section-title">Key moments</h3>
            <p class="text-xs text-muted-foreground">
              Redo any answer out loud in two minutes and see the new score next to the old one.
              {#if data.redosLeft != null}<span class="tabular">{data.redosLeft} free {data.redosLeft === 1 ? 'redo' : 'redos'} left.</span>{/if}
            </p>
          </div>
          <ul class="mt-3 border-t">
            {#each sc.questions as q, n}
              {@const tag = q.score >= 4 ? { label: 'Strong answer', c: 'text-success-text before:bg-success', bar: 'bg-success' } : q.score === 3 ? { label: 'Could be sharper', c: 'text-warning-text before:bg-warning', bar: 'bg-warning' } : { label: 'Weak answer', c: 'text-destructive before:bg-destructive', bar: 'bg-destructive' }}
              {@const r = redone.get(n)}
              <li class="flex items-start gap-2 border-b">
                <details class="group min-w-0 flex-1">
                  <summary class="flex min-h-16 cursor-pointer list-none items-center gap-4 py-3">
                    <span class="h-10 w-[3px] shrink-0 rounded-full {tag.bar}"></span>
                    <span class="w-8 shrink-0 text-xs font-bold text-muted-foreground">Q{n + 1}</span>
                    <span class="min-w-0 flex-1 text-sm leading-snug">
                      “{q.question}”
                      {#if r}
                        {@const up = r.best.score - r.best.previousScore}
                        <span class="tabular mt-0.5 block text-xs font-bold {up > 0 ? 'text-success-text' : 'text-muted-foreground'}">
                          Redo {r.best.score}{#if up !== 0}, {gainLabel(r.best.previousScore, r.best.score)}{/if}
                        </span>
                      {/if}
                    </span>
                    <span class="hidden h-6 shrink-0 items-center gap-1.5 text-xs font-bold before:size-1.5 before:rounded-full sm:inline-flex {tag.c}">{tag.label}</span>
                    <ChevronDown class="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <div class="grid gap-3 pb-4 pl-[60px] text-sm leading-normal">
                    <p><span class="font-bold">You said:</span> <span class="text-muted-foreground">{q.answer_summary}</span></p>
                    <p><span class="font-bold">Feedback:</span> <span class="text-muted-foreground">{q.feedback}</span></p>
                    <p><span class="font-bold">Stronger:</span> <span class="text-muted-foreground">{q.stronger_answer}</span></p>
                    {#if r}
                      <p>
                        <span class="font-bold">{r.attempts === 1 ? 'Your redo' : `Your best of ${r.attempts} redos`}:</span>
                        <span class="tabular font-bold">{r.best.previousScore} to {r.best.score}.</span>
                        <span class="text-muted-foreground">{r.best.feedback} Next time: {r.best.tip}</span>
                      </p>
                      {#if r.best.score >= STORY_SCORE}
                        <p><KeepStory source="redo:{r.best.id}" kept={data.keptStories.includes(`redo:${r.best.id}`)} refresh="app:interview" /></p>
                      {/if}
                    {/if}
                  </div>
                </details>
                <Button
                  variant={suggested === n ? 'default' : 'outline'}
                  size="sm"
                  class="mt-[18px] shrink-0"
                  aria-label="Redo your answer to question {n + 1}"
                  onclick={() => redo(n)}
                >
                  <Redo /> <span class="hidden sm:inline">{r ? 'Redo again' : 'Redo'}</span>
                </Button>
              </li>
            {/each}
          </ul>
        </section>

        <details class="group border-t pt-6">
          <summary class="flex w-fit cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ChevronRight class="size-4 transition-transform group-open:rotate-90" /> Full transcript
          </summary>
          <div class="mt-4"><TranscriptView {transcript} interviewerName={i.agent.name} candidateName="You" title={i.name} /></div>
        </details>
      {:else}
        <!-- Too short to score, or an interview from before v2 (summary only). -->
        <div class="border-y py-5">
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

<AnswerDialog bind:open={redoOpen} kind="redo" target={redoing} left={data.redosLeft} refresh="app:interview" />

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
