<script lang="ts">
  import '../../app.css';
  import * as Sidebar from '$lib/components/ui/sidebar/index';
  import AppSidebar from '$lib/components/app-sidebar.svelte';

  const { children } = $props();
</script>

<Sidebar.Provider>
  <AppSidebar />
  <main class="flex flex-col h-screen w-screen bg-muted p-5">
    <Sidebar.Trigger />
    {@render children?.()}
  </main>
</Sidebar.Provider>
