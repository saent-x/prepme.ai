<script lang="ts">
  import { ClockFadingIcon } from '@lucide/svelte';
  import { Badge } from '../ui/badge';
  import humanizeDuration from 'humanize-duration';

  const { duration }: { duration: number } = $props();

  function formatDuration(seconds: number) {
    return humanizeDuration(seconds * 1000, {
      largest: 1,
      round: true,
      units: ['h', 'm', 's']
    });
  }
</script>

<Badge variant="outline" class="flex items-center gap-x-2 capitalize [&>svg]:size-4">
  <ClockFadingIcon class="text-blue-700" />
  {duration ? formatDuration(duration) : 'No duration'}
</Badge>
