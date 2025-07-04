<script lang="ts">
  import '../../app.css';
  import * as Sidebar from '$lib/components/ui/sidebar/index';
  import AppSidebar from '$lib/components/app-sidebar.svelte';
  import DashboardNavbar from '$lib/components/dashboard-navbar.svelte';
  import { QueryClient, QueryClientProvider} from '@tanstack/svelte-query';
  
  const client = new QueryClient();
  const { children } = $props();
</script>

<QueryClientProvider {client}>
    <Sidebar.Provider>
      <AppSidebar />
      <main class="bg-muted flex h-screen w-screen flex-col">
        <DashboardNavbar />
        {@render children?.()}
      </main>
    </Sidebar.Provider>
</QueryClientProvider>
