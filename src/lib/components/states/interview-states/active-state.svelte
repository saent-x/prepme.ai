<script lang="ts">
  import { VideoIcon } from '@lucide/svelte';
  import EmptyState from '../empty-state.svelte';
  import { Button } from '../../ui/button';

  type Props = {
    interviewId: string;
  };

  let { interviewId }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center gap-y-8 rounded-lg bg-white px-4 py-5">
  <EmptyState
    src="/active.svg"
    title="Interview is active"
    description="Interview would end once all participants have left"
  />

  <div class="flex w-full flex-col-reverse items-center gap-2 lg:flex-row lg:justify-center">

    <Button
      class="w-full lg:w-auto"
      href={`/call/${interviewId}`}
    >
      <VideoIcon />
      Join Interview
    </Button>
  </div>
</div>
