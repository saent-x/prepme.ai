<script lang="ts">
  import { orpc } from '$lib/orpc';
  import { createQuery } from '@tanstack/svelte-query';
  
  let query = createQuery(orpc.agents.list.queryOptions());
</script>

{#if $query.status === 'pending'}
	<p>loading</p>
{/if}

{#if $query.status === 'error'}
	<p>error</p>
{/if}

{#if $query.status === 'success'}
	<p>{$query.data}</p>
{/if}

<div class="p-4">
  <h2>Welcome to the Dashboard</h2>
</div>
