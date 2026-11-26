<script lang="ts">
  // One job in a list (Home, Jobs): readiness ring, the job, when the interview is, what to practise next.
  import Ring from '$lib/components/viz/ring.svelte';
  import { jobName, whenLine } from '$lib/jobs';
  import { ChevronRight } from '$lib/icons';

  type Row = {
    job: { id: string; title: string; company: string; interviewDate: string | null };
    readiness: { score: number | null; practised: number; nextRound: { name: string } | null };
  };
  let { row, detail = true }: { row: Row; detail?: boolean } = $props();
  const next = $derived(
    row.readiness.nextRound ? `Next: ${row.readiness.nextRound.name}` : row.readiness.practised ? 'Every round practised' : ''
  );
</script>

<a href="/dashboard/jobs/{row.job.id}" class="group flex min-h-14 items-center gap-3 border-b px-3 py-2 transition-colors hover:bg-muted">
  <Ring value={row.readiness.score} />
  <span class="grid min-w-0 flex-1">
    <span class="truncate text-sm font-bold">{jobName(row.job)}</span>
    <span class="truncate text-xs text-muted-foreground">{whenLine(row.job.interviewDate)}</span>
  </span>
  {#if detail && next}<span class="hidden shrink-0 text-xs text-muted-foreground md:block">{next}</span>{/if}
  <ChevronRight class="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
</a>
