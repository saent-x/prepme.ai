<script lang="ts">
  import { orpc } from '$lib/orpc';
  import { createQuery } from '@tanstack/svelte-query';
  import LoadingState from '$lib/components/loading-state.svelte';
  import ErrorState from '$lib/components/error-state.svelte';
  import ResponsiveDialog from '$lib/components/responsive-dialog.svelte';

  // or maybe if i am using the client i have to return the result of the promise??
  let query = createQuery(
    orpc.agents.list.queryOptions({
      queryKey: ['agents']
    })
  );
</script>

{#if $query.isPending}
  <LoadingState title="Retrieving Agents" description="This shouldn't take too long..." />
{:else if $query.isError}
  <ErrorState title="Failed to load agents" description="Please try again later..." />
{:else if $query.isSuccess}
  <p>{$query.data[0].instructions}</p>
{/if}
