<script lang="ts">
  import { SearchIcon } from '@lucide/svelte';
  import { Input } from '../ui/input';
  import { useInterviewsFilters } from '$lib/hooks/use-interviews-filters';

  const filters = useInterviewsFilters();
</script>

<div class="relative">
  <Input
    placeholder="Filter by name"
    class="h-9 w-[200px] bg-white pl-7"
    bind:value={filters.search.current}
  />
  <SearchIcon class="text-muted-foreground absolute top-1/2 left-2 size-4 -translate-y-1/2" />
</div>
