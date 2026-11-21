<script lang="ts">
  import ScoreRing from '$lib/components/viz/score-ring.svelte';
  import CompetencyBars from '$lib/components/viz/competency-bars.svelte';
  import { VERDICT_LABELS, transcriptStats, type Scorecard, type TranscriptEntry } from '$lib/interview-types';
  import { Check, ArrowUpRight } from '@lucide/svelte';

  let { scorecard, transcript }: { scorecard: Scorecard; transcript: TranscriptEntry[] } = $props();
  const stats = $derived(transcriptStats(transcript));
  const verdictTone = $derived(
    ['strong_hire', 'hire'].includes(scorecard.verdict)
      ? 'bg-success/12 text-success'
      : scorecard.verdict === 'lean_hire'
        ? 'bg-warning/15'
        : 'bg-signal-soft text-signal'
  );
</script>

<div class="grid gap-3 lg:grid-cols-[1.25fr_1fr]">
  <section class="rounded-3xl border bg-card p-6 sm:p-8">
    <div class="flex flex-col gap-6 sm:flex-row sm:items-center">
      <ScoreRing score={scorecard.overall_score} size={148} />
      <div>
        <span class="inline-block rounded-full px-3 py-1 text-sm font-medium {verdictTone}">{VERDICT_LABELS[scorecard.verdict]}</span>
        <h2 class="mt-3 text-2xl leading-snug font-semibold tracking-tight text-balance">{scorecard.headline}</h2>
      </div>
    </div>
    <p class="mt-6 text-[15px] leading-relaxed text-muted-foreground">{scorecard.overview}</p>

    <div class="mt-8 grid grid-cols-3 gap-3 border-t pt-6">
      <div>
        <div class="eyebrow">You spoke</div>
        <div class="tabular mt-1 text-2xl font-semibold">{Math.round(stats.candidateShare * 100)}%</div>
        <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div class="h-full rounded-full bg-foreground" style="width:{stats.candidateShare * 100}%"></div>
        </div>
      </div>
      <div>
        <div class="eyebrow">Pace</div>
        <div class="tabular mt-1 text-2xl font-semibold">{stats.wordsPerMinute || '—'}</div>
        <div class="text-xs text-muted-foreground">words / min</div>
      </div>
      <div>
        <div class="eyebrow">Questions</div>
        <div class="tabular mt-1 text-2xl font-semibold">{scorecard.questions.length}</div>
        <div class="text-xs text-muted-foreground">scored</div>
      </div>
    </div>
    <p class="mt-4 text-sm text-muted-foreground">{scorecard.talk_ratio_comment}</p>
  </section>

  <section class="rounded-3xl border bg-card p-6 sm:p-8">
    <h3 class="font-semibold">Competencies</h3>
    <p class="text-sm text-muted-foreground">1 = well below the bar · 3 = meets it · 5 = exceptional</p>
    <div class="mt-6"><CompetencyBars items={scorecard.competencies} /></div>
  </section>

  <section class="rounded-3xl border bg-card p-6 sm:p-8">
    <h3 class="font-semibold">What went well</h3>
    <ul class="mt-4 space-y-3">
      {#each scorecard.strengths as s}
        <li class="flex gap-3 text-[15px]">
          <span class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success/15 text-success"><Check class="size-3" /></span>
          {s}
        </li>
      {/each}
    </ul>
  </section>

  <section class="rounded-3xl border bg-card p-6 sm:p-8">
    <h3 class="font-semibold">Three things to change</h3>
    <ol class="mt-4 space-y-4">
      {#each scorecard.improvements as imp, i}
        <li class="flex gap-3">
          <span class="grid size-6 shrink-0 place-items-center rounded-full bg-signal-soft font-mono text-xs font-semibold text-signal">{i + 1}</span>
          <div>
            <div class="font-medium">{imp.title}</div>
            <p class="mt-0.5 text-sm leading-relaxed text-muted-foreground">{imp.detail}</p>
          </div>
        </li>
      {/each}
    </ol>
  </section>

  {#if scorecard.next_practice.length}
    <section class="rounded-3xl bg-foreground p-6 text-background sm:p-8 lg:col-span-2">
      <h3 class="font-semibold">Before your next session</h3>
      <ul class="mt-4 grid gap-3 sm:grid-cols-3">
        {#each scorecard.next_practice as n}
          <li class="flex gap-2 rounded-2xl bg-background/8 p-4 text-[15px]"><ArrowUpRight class="mt-0.5 size-4 shrink-0 text-signal" />{n}</li>
        {/each}
      </ul>
    </section>
  {/if}
</div>
