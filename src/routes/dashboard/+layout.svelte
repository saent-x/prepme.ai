<script lang="ts">
  import '../../app.css';
  import * as Sidebar from '$lib/components/ui/sidebar/index';
  import AppSidebar from '$lib/components/app-sidebar.svelte';
  import DashboardNavbar from '$lib/components/dashboard-navbar.svelte';
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
  import { browser } from '$app/environment';
  import type { LayoutProps } from './$types';
  import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';

  // const queryClient = new QueryClient({
  //   defaultOptions: {
  //     queries: {
  //       enabled: browser
  //     }
  //   }
  // });

  const { data, children }: LayoutProps = $props();
</script>

<QueryClientProvider client={data.queryClient}>
  <Sidebar.Provider>
    <AppSidebar />
    <main class="bg-muted flex h-screen w-screen flex-col">
      <DashboardNavbar />
      {@render children?.()}
    </main>
  </Sidebar.Provider>
  <SvelteQueryDevtools />
</QueryClientProvider>
