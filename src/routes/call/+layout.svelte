<script lang="ts">
  const { children } = $props();
</script>

<svelte:boundary>
  <div class="h-screen bg-black">
    {@render children()}
  </div>
  {#snippet failed(error, reset)}
    <div class="p-4">
      <button onclick={reset}>oops! try again</button>
      <p class="mt-5 text-red-700">
        {error}
      </p>
    </div>
  {/snippet}

  {#snippet pending()}
    <p>loading...</p>
  {/snippet}
</svelte:boundary>
