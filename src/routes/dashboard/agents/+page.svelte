<script lang="ts">
  import LoadingState from '$lib/components/loading-state.svelte';
  import ErrorState from '$lib/components/error-state.svelte';
  import AgentsHeader from '$lib/components/agents-header.svelte';
  import { listAgents } from './agents.remote';
  import DataTable from '$lib/components/data-table.svelte';
  import { columns } from '$lib/components/columns';
  import EmptyState from '$lib/components/empty-state.svelte';
  import { useAgentsFilters } from '$lib/hooks/use-agents-filters';
  import DataPagination from '$lib/components/data-pagination.svelte';
  import { goto } from '$app/navigation';

  let filters = useAgentsFilters();
  const agentsQuery = $derived(
    listAgents({
      search: filters.search.current,
      page: filters.page.current
    })
  );
</script>

<AgentsHeader />

{#if agentsQuery.error}
  <ErrorState title="Failed to load agents" description="Please try again later..." />
{:else if agentsQuery.loading}
  <LoadingState title="Retrieving Agents" description="This shouldn't take too long..." />
{:else}
  <div class="flex flex-1 flex-col gap-y-4 px-4 pb-4 md:px-8">
    <DataTable
      data={agentsQuery.current?.items ?? []}
      {columns}
      onRowClick={(row) => goto(`/dashboard/agents/${row.id}`)}
    />
    <DataPagination
      page={filters.page.current}
      totalPages={agentsQuery.current?.totalPages!}
      onPageChange={(page) => filters.set({ page })}
    />
    {#if agentsQuery.current?.items.length === 0}
      <EmptyState
        title="Create your very first agent"
        description="Agents can join your meetings and each agent follows your instructions and can engage with participants during the call"
      />
    {/if}
  </div>
{/if}
