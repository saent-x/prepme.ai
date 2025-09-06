<script lang="ts">
  import { BanIcon, VideoIcon } from '@lucide/svelte';
  import EmptyState from '../empty-state.svelte';
  import { Button } from '../../ui/button';

  type Props = {
    interviewId: string;
  };

  let { interviewId }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center gap-y-8 rounded-lg bg-white px-4 py-5">
  <EmptyState
    src="/src/assets/upcoming.svg"
    title="Interview not started yet"
    description="Interview summary would appear once started"
  />

  <div class="flex w-full flex-col-reverse items-center gap-2 lg:flex-row lg:justify-center">

    <Button
      class="w-full lg:w-auto"
      href={`/call/${interviewId}`}
    >
      <VideoIcon />
      Start Interview
    </Button>
  </div>
</div>
