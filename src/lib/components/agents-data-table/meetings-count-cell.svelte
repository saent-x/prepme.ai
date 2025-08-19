<script lang="ts">
  import { VideoIcon } from '@lucide/svelte';
  import Badge from '../ui/badge/badge.svelte';

  type Props = {
    meetingCount: number;
  };

  let { meetingCount }: Props = $props();
</script>

<Badge variant="outline" class="flex items-center gap-x-2 [&>svg]:size-4">
  <VideoIcon class="text-blue-700" />
  {meetingCount}
  {meetingCount === 1 ? 'meeting' : 'meetings'}
</Badge>
