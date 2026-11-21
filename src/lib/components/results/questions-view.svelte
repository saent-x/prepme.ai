<script lang="ts">
  import type { Scorecard } from '$lib/interview-types';
  let { questions }: { questions: Scorecard['questions'] } = $props();
  const tone = (s: number) => (s >= 4 ? 'bg-success/12 text-success' : s >= 3 ? 'bg-warning/15' : 'bg-signal-soft text-signal');
</script>

{#if questions.length}
  <ol class="grid gap-3">
    {#each questions as q, i}
      <li class="rounded-3xl border bg-card p-6">
        <div class="flex items-start gap-4">
          <span class="font-mono text-sm text-muted-foreground">Q{i + 1}</span>
          <p class="flex-1 font-medium">{q.question}</p>
          <span class="tabular shrink-0 rounded-full px-2.5 py-1 font-mono text-xs font-semibold {tone(q.score)}">{q.score}/5</span>
        </div>
        <div class="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <div class="eyebrow mb-1.5">What you said</div>
            <p class="text-[15px] leading-relaxed text-muted-foreground">{q.answer_summary}</p>
            <div class="eyebrow mt-4 mb-1.5">Feedback</div>
            <p class="text-[15px] leading-relaxed">{q.feedback}</p>
          </div>
          <div class="rounded-2xl border-l-4 border-success bg-success/8 p-4">
            <div class="eyebrow mb-1.5 text-success">A stronger answer</div>
            <p class="text-[15px] leading-relaxed">{q.stronger_answer}</p>
          </div>
        </div>
      </li>
    {/each}
  </ol>
{:else}
  <p class="rounded-3xl border bg-card p-6 text-muted-foreground">No main questions were identified in this interview.</p>
{/if}
