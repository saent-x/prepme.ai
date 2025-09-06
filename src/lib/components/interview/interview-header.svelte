<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte';
  import { PlusIcon, XCircleIcon } from '@lucide/svelte';
  import { DEFAULT_PAGE } from '$lib/constant';
  import NewInterviewDialog from './new-interview-dialog.svelte';
  import InterviewsSearchFilters from './interviews-search-filters.svelte';
  import { useInterviewsFilters } from '$lib/hooks/use-interviews-filters';
  import StatusFilter from './status-filter.svelte';
  import AgentsIdFilter from '../agent/agentsId-filter.svelte';
  import { ScrollArea, Scrollbar } from '../ui/scroll-area';

  let open = $state(false);
  let filters = useInterviewsFilters();
  let isAnyFilterModified = $derived(
    !!filters.search.current || !!filters.status.current || !!filters.agentId.current
  );

  const onClearFilters = () => {
    filters.set({
      search: '',
      status: null,
      agentId: '',
      page: 1
    });
  };
</script>

<NewInterviewDialog bind:open />
<div class="flex flex-col gap-y-4 px-4 py-4 md:px-8">
  <div class="flex items-center justify-between">
    <h5 class="text-xl font-medium">My Interviews</h5>
    <Button
      onclick={() => {
        open = !open;
      }}
    >
      <PlusIcon />
      New Interview
    </Button>
  </div>
  <ScrollArea>
    <div class="flex items-center gap-x-2 p-1">
      <InterviewsSearchFilters />
      <StatusFilter />
      <AgentsIdFilter />
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
