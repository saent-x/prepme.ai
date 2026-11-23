<script lang="ts">
  import { format } from 'date-fns';
  import InterviewerAvatar from './interviewer-avatar.svelte';
  import StatusBadge from './status-badge.svelte';
  import ScoreChip from './score-chip.svelte';
  import { formatDuration } from '$lib/utils';
  import { ChevronRight, Mic } from '@lucide/svelte';
  import { splitTitle } from '$lib/interviewer-brief';
  import type { InterviewStatus } from '$lib/db/schema';

  type Row = {
    id: string;
    name: string;
    status: InterviewStatus;
    overallScore: number | null;
    duration: number | null;
    createdAt: Date | string;
    agent: { name: string };
  };
  let { row }: { row: Row } = $props();
  const t = $derived(splitTitle(row.name));
</script>

<!-- One table-like row. Column widths match InterviewHead. -->
<a
  href="/dashboard/interviews/{row.id}"
  class="group grid h-12 grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-x-4 border-b text-sm transition-colors hover:bg-muted sm:grid-cols-[20px_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.8fr)_64px_56px_48px_20px]"
>
  <Mic class="size-5 text-muted-foreground" strokeWidth={1.6} />
  <span class="truncate font-bold">{t.role}</span>
  <span class="hidden truncate text-muted-foreground sm:block">{t.company}</span>
  <span class="hidden min-w-0 items-center gap-2 text-muted-foreground sm:flex">
    <InterviewerAvatar name={row.agent.name} class="size-5" /><span class="truncate">{row.agent.name}</span>
  </span>
  <span class="hidden text-muted-foreground sm:block">{format(new Date(row.createdAt), 'd MMM')}</span>
  <span class="tabular hidden text-muted-foreground sm:block">{formatDuration(row.duration)}</span>
  <span class="flex">
    {#if row.status === 'completed'}<ScoreChip score={row.overallScore} />{:else}<StatusBadge status={row.status} />{/if}
  </span>
  <ChevronRight class="hidden size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:block" strokeWidth={1.6} />
</a>
