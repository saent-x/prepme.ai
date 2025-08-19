<script lang="ts">
  import DataTable from '$lib/components/data-table.svelte';
  import ErrorState from '$lib/components/error-state.svelte';
  import InterviewHeader from '$lib/components/interview-header.svelte';
  import LoadingState from '$lib/components/loading-state.svelte';
  import { listInterviews } from './interviews.remote';
  import { columns } from '$lib/components/interviews-data-table/interviews-columns';
  import { goto } from '$app/navigation';
  import EmptyState from '$lib/components/empty-state.svelte';

  const interviewsQuery = listInterviews();
</script>

<InterviewHeader />

{#if interviewsQuery.loading}
  <LoadingState title="Retrieving Interviews" description="This shouldn't take too long..." />
{:else if interviewsQuery.error}
  <ErrorState title="Failed to load interviews" description="Please try again later..." />
{:else}
  <div class="flex flex-1 flex-col gap-y-4 px-4 pb-4 md:px-8">
    <DataTable
      data={interviewsQuery.current?.items ?? []}
      {columns}
      onRowClick={(row) => goto(`/dashboard/interviews/${row.id}`)}
    />

    {#if interviewsQuery.current?.items.length === 0}
      <EmptyState
        title="Create your very first interview"
        description="Schedule a meeting to connect with others. Each meeting lets you collaborate, share ideas, and interact with participants in real-time"
      />
    {/if}
  </div>
{/if}
