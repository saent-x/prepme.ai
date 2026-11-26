<script lang="ts">
  // A job's question bank: the questions it is most likely to ask, each with the best answer so far.
  import { enhance } from '$app/forms';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import AnswerDialog, { type AnswerTarget } from '$lib/components/results/answer-dialog.svelte';
  import KeepStory from '$lib/components/app/keep-story.svelte';
  import ScoreChip from '$lib/components/app/score-chip.svelte';
  import { bankProgress, STORY_SCORE, type BankQuestion } from '$lib/bank';
  import type { Round } from '$lib/jobs';
  import { ChevronDown, LoaderCircle, Lock, Mic, Plus, RefreshCw, Sparkles, Trash2 } from '$lib/icons';

  let {
    jobId,
    bank,
    rounds,
    left,
    kept,
    error = null
  }: {
    jobId: string;
    bank: { questions: BankQuestion[]; locked: number; built: boolean };
    rounds: Round[];
    /** Free scored answers left, or null when the plan has no limit. */
    left: number | null;
    /** Sources already kept as stories. */
    kept: string[];
    error?: string | null;
  } = $props();

  const progress = $derived(bankProgress(bank.questions));
  const roundName = (id: string | null) => rounds.find((r) => r.id === id)?.name ?? null;

  let building = $state(false);
  let adding = $state(false);
  let open = $state(false);
  let target = $state<AnswerTarget | null>(null);

  function practise(q: BankQuestion) {
    target = {
      endpoint: `/api/jobs/${jobId}/questions/${q.id}/answer`,
      question: q.question,
      before: q.best ? { score: q.best.score, note: q.best.tip } : null
    };
    open = true;
  }
  const busy = (set: (v: boolean) => void) => () => {
    set(true);
    return async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => {
      await update();
      set(false);
    };
  };
</script>

<section aria-label="Question bank" class="min-w-0">
  <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
    <h2 class="section-title flex h-8 items-center">Question bank</h2>
    {#if bank.built}
      <div class="flex items-center gap-4">
        <span class="tabular text-xs text-muted-foreground">
          {progress.answered} of {progress.total} answered{#if progress.strong}, {progress.strong} strong{/if}
        </span>
        <form method="POST" action="?/bank" use:enhance={busy((v) => (building = v))}>
          <button type="submit" class="link inline-flex items-center gap-1.5 text-xs" disabled={building} title="Your answered questions are kept">
            {#if building}<LoaderCircle class="size-3.5 animate-spin" />{:else}<RefreshCw class="size-3.5" />{/if} Build again
          </button>
        </form>
      </div>
    {/if}
  </div>

  {#if !bank.built}
    <div class="mt-2 grid justify-items-start gap-3 border-y py-5">
      <p class="max-w-xl text-sm text-muted-foreground">
        The questions this job is most likely to ask, worked out from the advert and your CV. Practise each one out loud and your best answer is kept next to it.
      </p>
      <form method="POST" action="?/bank" use:enhance={busy((v) => (building = v))}>
        <Button type="submit" disabled={building}>
          {#if building}<LoaderCircle class="animate-spin" /> Building{:else}<Sparkles /> Build the question bank{/if}
        </Button>
      </form>
    </div>
  {:else}
    <p class="mt-1 text-xs text-muted-foreground">
      The questions this job is most likely to ask. Practise one out loud and your best answer is kept next to it.
      {#if left != null}<span class="tabular">{left} free scored {left === 1 ? 'answer' : 'answers'} left.</span>{/if}
    </p>
    <ul class="mt-3 border-t">
      {#each bank.questions as q (q.id)}
        {@const round = roundName(q.roundId)}
        <li class="flex items-start gap-2 border-b">
          <details class="group min-w-0 flex-1">
            <summary class="flex min-h-14 cursor-pointer list-none items-center gap-3 py-2.5">
              <span class="w-8 shrink-0 text-center"><ScoreChip score={q.best?.score} /></span>
              <span class="min-w-0 flex-1 text-sm leading-snug">
                “{q.question}”
                {#if round}<span class="mt-0.5 block text-xs text-muted-foreground">{round}</span>{/if}
              </span>
              <ChevronDown class="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <div class="grid gap-3 pb-4 pl-11 text-sm leading-normal">
              {#if q.why}<p><span class="font-bold">Why it is likely:</span> <span class="text-muted-foreground">{q.why}</span></p>{/if}
              {#if q.best}
                <p>
                  <span class="font-bold">{q.attempts === 1 ? 'Your answer' : `Your best of ${q.attempts} answers`}:</span>
                  <span class="text-muted-foreground whitespace-pre-wrap">{q.best.answer}</span>
                </p>
                <p><span class="font-bold">Feedback:</span> <span class="text-muted-foreground">{q.best.feedback} Next time: {q.best.tip}</span></p>
              {:else}
                <p class="text-muted-foreground">Not answered yet.</p>
              {/if}
              <div class="flex flex-wrap items-center gap-x-5 gap-y-2">
                {#if q.best && q.best.score >= STORY_SCORE}
                  <KeepStory source="answer:{q.best.id}" kept={kept.includes(`answer:${q.best.id}`)} refresh="app:job" />
                {/if}
                <form method="POST" action="?/removeQuestion" use:enhance>
                  <input type="hidden" name="id" value={q.id} />
                  <button type="submit" class="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive">
                    <Trash2 class="size-3.5" /> Remove{q.best ? ' with its answers' : ''}
                  </button>
                </form>
              </div>
            </div>
          </details>
          <Button variant="outline" size="sm" class="mt-3.5 shrink-0" aria-label="Practise: {q.question}" onclick={() => practise(q)}>
            <Mic /> <span class="hidden sm:inline">{q.best ? 'Again' : 'Practise'}</span>
          </Button>
        </li>
      {/each}
      {#if bank.locked}
        <li class="flex min-h-14 items-center gap-3 border-b py-2.5 text-sm text-muted-foreground">
          <span class="grid w-8 shrink-0 place-items-center"><Lock class="size-4" /></span>
          <span class="min-w-0 flex-1">{bank.locked} more {bank.locked === 1 ? 'question' : 'questions'} on a paid plan.</span>
          <a href="/dashboard/billing" class="link text-xs">See plans</a>
        </li>
      {/if}
    </ul>

    <form method="POST" action="?/addQuestion" class="mt-3 flex items-center gap-2" use:enhance={busy((v) => (adding = v))}>
      <label for="own-question" class="sr-only">Add your own question</label>
      <Input id="own-question" name="question" maxlength={300} required autocomplete="off" placeholder="Add a question you expect, in your own words" class="max-w-xl" />
      <Button type="submit" variant="outline" disabled={adding}><Plus /> Add</Button>
    </form>
    {#if error}<p class="mt-2 text-sm text-destructive" role="alert">{error}</p>{/if}
  {/if}
</section>

<AnswerDialog bind:open kind="answer" {target} {left} refresh="app:job" />
