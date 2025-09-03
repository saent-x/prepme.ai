<script lang="ts">
  import { ClockFadingIcon } from '@lucide/svelte';
  import { Badge } from '../ui/badge';
  import { formatDuration } from '$lib/utils';

  const { duration }: { duration: number } = $props();
</script>

<Badge variant="outline" class="flex items-center gap-x-2 capitalize [&>svg]:size-4">
  <ClockFadingIcon class="text-blue-700" />
  {duration ? formatDuration(duration) : 'No duration'}
</Badge>
