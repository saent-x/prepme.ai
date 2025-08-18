<script lang="ts">
  import ErrorState from '$lib/components/error-state.svelte';
  import InterviewHeader from '$lib/components/interview-header.svelte';
  import LoadingState from '$lib/components/loading-state.svelte';
  import { listInterviews } from './interviews.remote';

  const interviewsQuery = listInterviews();
</script>

<InterviewHeader />

{#if interviewsQuery.loading}
  <LoadingState title="Retrieving Interviews" description="This shouldn't take too long..." />
{:else if interviewsQuery.error}
  <ErrorState title="Failed to load interviews" description="Please try again later..." />
{:else}
  <div class="flex flex-1 flex-col gap-y-4 px-4 pb-4 md:px-8">
    {JSON.stringify(interviewsQuery.current)}
  </div>
{/if}
