<script lang="ts">
  import ErrorState from '$lib/components/error-state.svelte';
  import LoadingState from '$lib/components/loading-state.svelte';
  import { listInterviews } from './interviews.remote';

  const interviewsQuery = listInterviews();
</script>

{#if interviewsQuery.loading}
  <LoadingState title="Retrieving Interviews" description="This shouldn't take too long..." />
{:else if interviewsQuery.error}
  <ErrorState title="Failed to load interviews" description="Please try again later..." />
{:else}
  {JSON.stringify(interviewsQuery.current)}
{/if}