<script lang="ts">
  import '../../app.css';
  import * as Sidebar from '$lib/components/ui/sidebar/index';
  import AppSidebar from '$lib/components/dashboard/app-sidebar.svelte';
  import DashboardNavbar from '$lib/components/dashboard/dashboard-navbar.svelte';
  import { openSidebarCommand } from '$lib/global.svelte';

  const { children } = $props();
</script>

<Sidebar.Provider bind:open={openSidebarCommand.open}>
  <AppSidebar />
  <main class="bg-muted flex h-screen w-screen flex-col">
    <DashboardNavbar />
    {@render children?.()}
  </main>
</Sidebar.Provider>
