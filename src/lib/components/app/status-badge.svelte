<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import type { InterviewStatus } from '$lib/db/schema';
  let { status }: { status: InterviewStatus } = $props();
  const map = {
    upcoming: { label: 'Ready', variant: 'outline' },
    active: { label: 'In progress', variant: 'signal' },
    processing: { label: 'Scoring', variant: 'warning' },
    completed: { label: 'Scored', variant: 'success' },
    cancelled: { label: 'Cancelled', variant: 'secondary' }
  } as const;
  const s = $derived(map[status]);
</script>

<Badge variant={s.variant} class={status === 'active' ? 'before:animate-onair' : ''}>
  {s.label}
</Badge>
