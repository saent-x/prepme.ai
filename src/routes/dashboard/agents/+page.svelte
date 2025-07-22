<script lang="ts">
  import LoadingState from '$lib/components/loading-state.svelte';
  import ErrorState from '$lib/components/error-state.svelte';
  import AgentsHeader from '$lib/components/agents-header.svelte';
  import { listAgents } from './agents.remote';

  let agentsList = listAgents();
</script>

<AgentsHeader />

<svelte:boundary>
  {#each await agentsList as agent}
    <p>{agent.name}</p>
    <p>{agent.instructions}</p>
  {/each}   

  {#snippet failed()}
    <ErrorState title="Failed to load agents" description="Please try again later..." />
  {/snippet}

  {#snippet pending()}
    <LoadingState title="Retrieving Agents" description="This shouldn't take too long..." />
  {/snippet}
</svelte:boundary>
