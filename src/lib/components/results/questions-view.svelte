<script lang="ts">
  import type { Scorecard } from '$lib/interview-types';
  let { questions }: { questions: Scorecard['questions'] } = $props();
  const tone = (s: number) =>
    s >= 4 ? 'bg-success-soft text-success' : s >= 3 ? 'bg-warning-soft text-warning' : 'bg-destructive/10 text-destructive';
</script>

{#if questions.length}
  <ol class="divide-y rounded-xl border bg-card">
    {#each questions as q, i}
      <li class="px-5 py-4">
        <div class="flex items-start gap-3">
          <span class="tabular w-6 shrink-0 text-sm font-semibold text-faint">{i + 1}</span>
          <p class="flex-1 font-semibold">{q.question}</p>
          <span class="tabular shrink-0 rounded-md px-2 py-0.5 text-[13px] font-bold {tone(q.score)}">{q.score}/5</span>
        </div>
        <div class="mt-3 grid gap-4 pl-9 md:grid-cols-2">
          <div class="text-sm leading-relaxed">
            <div class="text-xs font-semibold text-faint">You said</div>
            <p class="mt-0.5 text-muted-foreground">{q.answer_summary}</p>
            <p class="mt-2">{q.feedback}</p>
          </div>
          <div class="border-l-[3px] border-success pl-3.5 text-sm leading-relaxed">
            <div class="text-xs font-semibold text-success">Try this</div>
            <p class="mt-0.5">{q.stronger_answer}</p>
          </div>
        </div>
      </li>
    {/each}
  </ol>
{:else}
  <p class="rounded-xl border bg-card p-5 text-sm text-muted-foreground">No main questions were identified in this interview.</p>
{/if}
