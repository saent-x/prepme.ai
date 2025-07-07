<script lang="ts">
  import * as Sidebar from '$lib/components/ui/sidebar/index';
  import { SearchIcon } from '@lucide/svelte';
  import Button from '$lib/components/ui/button/button.svelte';
  import DashboardCommand from '$lib/components/dashboard-command.svelte';

  let openCommand = $state(false);

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      openCommand = !openCommand;
    }
  }
  
</script>

<svelte:document onkeydown={handleKeydown} />

<nav class="bg-background flex items-center gap-x-2 border-b px-4 py-3">
  <DashboardCommand bind:open={openCommand} />
  <Sidebar.Trigger class="size-9" variant="outline" />
  <Button
    class="text-muted-foreground hover:text-muted-foreground h-9 w-[240px] justify-start font-normal"
    variant="outline"
    size="sm"
    onclick={() => (openCommand = !openCommand)}
  >
    <SearchIcon />
    Search
    <kbd
      class="bg-muted text-muted-foreground pointer-events-none ml-auto inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium select-none"
    >
      <span class="text-xs">&#8984;</span>K
    </kbd>
  </Button>
</nav>
