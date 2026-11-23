<script lang="ts">
  import CompetencyBars from '$lib/components/viz/competency-bars.svelte';
  import { transcriptStats, type Scorecard, type TranscriptEntry } from '$lib/interview-types';
  import { ArrowRight, Check } from '@lucide/svelte';

  let { scorecard, transcript }: { scorecard: Scorecard; transcript: TranscriptEntry[] } = $props();
  const stats = $derived(transcriptStats(transcript));
  const [fix, ...others] = $derived(scorecard.improvements);
</script>

<!-- One flat sheet: two columns separated by a line, no nested cards. -->
<div class="grid rounded-xl border bg-card lg:grid-cols-[1.1fr_1fr]">
  <div class="grid content-start gap-5 px-5 py-4">
    <p class="text-sm leading-relaxed text-muted-foreground">{scorecard.overview}</p>

    <section>
      <div class="flex items-baseline gap-2">
        <h3 class="text-sm font-bold">Skills</h3>
        <span class="text-xs text-faint">3 meets the bar, 5 is exceptional</span>
      </div>
      <div class="mt-3"><CompetencyBars items={scorecard.competencies} /></div>
    </section>

    <section class="flex flex-wrap gap-x-6 gap-y-1 border-t pt-3 text-[13px] text-muted-foreground">
      <span><b class="tabular font-bold text-foreground">{Math.round(stats.candidateShare * 100)}%</b> of the talking was you</span>
      <span><b class="tabular font-bold text-foreground">{stats.wordsPerMinute || '—'}</b> words a minute</span>
      <span><b class="tabular font-bold text-foreground">{scorecard.questions.length}</b> questions scored</span>
    </section>
  </div>

  <div class="grid content-start gap-5 border-t px-5 py-4 lg:border-t-0 lg:border-l">
    {#if fix}
      <section class="border-l-[3px] border-warning pl-3.5">
        <h3 class="text-xs font-semibold text-warning">The one fix</h3>
        <div class="mt-0.5 font-bold">{fix.title}</div>
        <p class="mt-1 text-sm leading-relaxed text-muted-foreground">{fix.detail}</p>
      </section>
    {/if}

    {#if others.length}
      <section>
        <h3 class="text-sm font-bold">Also work on</h3>
        <ul class="mt-2 grid gap-2.5">
          {#each others as imp}
            <li class="text-sm">
              <span class="font-semibold">{imp.title}.</span>
              <span class="text-muted-foreground">{imp.detail}</span>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <section>
      <h3 class="text-sm font-bold">What went well</h3>
      <ul class="mt-2 grid gap-1.5">
        {#each scorecard.strengths as s}
          <li class="flex gap-2 text-sm"><Check class="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2.4} />{s}</li>
        {/each}
      </ul>
    </section>

    {#if scorecard.next_practice.length}
      <section class="border-t pt-3">
        <h3 class="text-sm font-bold">Practise next</h3>
        <ul class="mt-2 grid gap-1.5">
          {#each scorecard.next_practice as n}
            <li class="flex gap-2 text-sm"><ArrowRight class="mt-0.5 size-4 shrink-0 text-primary" />{n}</li>
          {/each}
        </ul>
      </section>
    {/if}
  </div>
</div>
