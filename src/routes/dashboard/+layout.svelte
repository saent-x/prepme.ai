<script lang="ts">
  import '../../app.css';
  import * as Sidebar from '$lib/components/ui/sidebar/index';
  import AppSidebar from '$lib/components/app-sidebar.svelte';
  import DashboardNavbar from '$lib/components/dashboard-navbar.svelte';

  const { children } = $props();
</script>

<svelte:boundary>
  <Sidebar.Provider>
    <AppSidebar />
    <main class="bg-muted flex h-screen w-screen flex-col">
      <DashboardNavbar />
      {@render children?.()}
    </main>
  </Sidebar.Provider>

  {#snippet failed(error, reset)}
    <button onclick={reset}>oops! try again</button>
  {/snippet}

  {#snippet pending()}
    <p>loading...</p>
  {/snippet}
</svelte:boundary>
