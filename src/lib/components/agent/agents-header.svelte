<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte';
  import { PlusIcon, XCircleIcon } from '@lucide/svelte';
  import NewAgentDialog from './new-agent-dialog.svelte';
  import { useAgentsFilters } from '$lib/hooks/use-agents-filters';
  import AgentsSearchFilters from './agents-search-filters.svelte';
  import { DEFAULT_PAGE } from '$lib/constant';
  import { ScrollArea, Scrollbar } from '../ui/scroll-area';

  let filters = useAgentsFilters();
  let open = $state(false);

  let isAnyFilterModified = $derived(!!filters.search.current);

  const onClearFilters = () => {
    filters.set({
      search: '',
      page: DEFAULT_PAGE
    });
  };
</script>

<NewAgentDialog bind:open />
<div class="flex flex-col gap-y-4 px-4 py-4 md:px-8">
  <div class="flex items-center justify-between">
    <h5 class="text-xl font-medium">My Agents</h5>
    <Button
      onclick={() => {
        open = !open;
      }}
    >
      <PlusIcon />
      New Agent
    </Button>
  </div>
  <ScrollArea>
    <div class="flex items-center gap-x-2 p-1">
      <AgentsSearchFilters />
      {#if isAnyFilterModified}
        <Button variant="outline" size="sm" onclick={onClearFilters}>
          <XCircleIcon />
          Clear
        </Button>
      {/if}
    </div>
    <Scrollbar orientation="horizontal" />
  </ScrollArea>
</div>
