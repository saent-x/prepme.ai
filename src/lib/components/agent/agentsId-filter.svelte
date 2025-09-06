<script lang="ts">
  import { useInterviewsFilters } from '$lib/hooks/use-interviews-filters';
  import { listAgents } from '../../../routes/dashboard/agents/agents.remote';
  import AvatarGen from '../shared/avatar-gen.svelte';
  import CommandSelect from '../shared/command-select.svelte';

  let agentSearch = $state<string>('');
  const filters = $derived(useInterviewsFilters());
  let selectedAgent = $derived(filters.agentId.current ?? '');

  const agentsQuery = $derived(
    listAgents({
      page: 1,
      pageSize: 100,
      search: agentSearch
    })
  );

  let options = $derived(
    (agentsQuery.current?.items ?? []).map((agent) => ({
      id: agent.id,
      value: agent.id,
      name: agent.name
    }))
  );
</script>

{#snippet selectItem(value: string)}
  <div class="flex items-center gap-x-2">
    <AvatarGen class="size-4 border" variant="bot" name={value} />
    <span>{value}</span>
  </div>
{/snippet}

<CommandSelect
  className="h-9"
  itemSnippet={selectItem}
  onSelect={(value) => {
    agentSearch = '';
    filters.agentId.current = value;
  }}
  bind:search={agentSearch}
  bind:value={selectedAgent}
  bind:queryLoading={agentsQuery.loading}
  placeholder="Agent"
  bind:options
/>
