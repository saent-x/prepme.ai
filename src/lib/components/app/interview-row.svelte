<script lang="ts">
  import { formatDistanceToNow } from 'date-fns';
  import InterviewerAvatar from './interviewer-avatar.svelte';
  import StatusBadge from './status-badge.svelte';
  import { formatDuration, scoreTone } from '$lib/utils';
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
  const tone = $derived(scoreTone(row.overallScore));
</script>

<a
  href="/dashboard/interviews/{row.id}"
  class="group flex items-center gap-4 rounded-2xl px-3 py-3 transition-colors hover:bg-accent/60 sm:px-4"
>
  <InterviewerAvatar name={row.agent.name} />
  <div class="min-w-0 flex-1">
    <div class="truncate font-medium">{row.name}</div>
    <div class="truncate text-sm text-muted-foreground">
      {row.agent.name} · {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}
    </div>
  </div>
  <div class="hidden text-sm text-muted-foreground sm:block">{formatDuration(row.duration)}</div>
  <StatusBadge status={row.status} />
  <div
    class="tabular grid w-12 place-items-center rounded-xl py-1.5 font-mono text-sm font-semibold {tone === 'good'
      ? 'bg-success/12 text-success'
      : tone === 'ok'
        ? 'bg-warning/15'
        : tone === 'low'
          ? 'bg-signal-soft text-signal'
          : 'text-muted-foreground'}"
  >
    {row.overallScore ?? '—'}
  </div>
</a>
