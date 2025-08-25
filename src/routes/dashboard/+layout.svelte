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
    <div class="p-4">
      <button onclick={reset}>oops! try again</button>
      <p class="text-red-700 mt-5">
        {error}
      </p>
    </div>
  {/snippet}

  {#snippet pending()}
    <p>loading...</p>
  {/snippet}
</svelte:boundary>
