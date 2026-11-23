<script lang="ts">
  import { format } from 'date-fns';
  import InterviewerAvatar from './interviewer-avatar.svelte';
  import StatusBadge from './status-badge.svelte';
  import ScoreChip from './score-chip.svelte';
  import { formatDuration } from '$lib/utils';
  import { AudioLines } from '@lucide/svelte';
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
</script>

<!-- One table-like row. Column widths match InterviewHead. -->
<a
  href="/dashboard/interviews/{row.id}"
  class="group grid grid-cols-[1fr_auto] items-center gap-x-4 border-t px-4 py-2.5 text-sm transition-colors first:border-t-0 hover:bg-muted/60 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_84px_64px_92px]"
>
  <span class="flex min-w-0 items-center gap-2.5">
    <AudioLines class="size-4 shrink-0 text-faint transition-colors group-hover:text-foreground" strokeWidth={1.8} />
    <span class="truncate font-semibold">{row.name}</span>
  </span>
  <span class="hidden min-w-0 items-center gap-2 text-muted-foreground sm:flex">
    <InterviewerAvatar name={row.agent.name} class="size-5" /><span class="truncate">{row.agent.name}</span>
  </span>
  <span class="hidden text-muted-foreground sm:block">{format(new Date(row.createdAt), 'd MMM')}</span>
  <span class="tabular hidden text-muted-foreground sm:block">{formatDuration(row.duration)}</span>
  <span class="flex justify-end">
    {#if row.status === 'completed'}<ScoreChip score={row.overallScore} />{:else}<StatusBadge status={row.status} />{/if}
  </span>
</a>
