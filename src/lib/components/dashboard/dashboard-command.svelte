<script lang="ts">
  import { goto } from '$app/navigation';
  import * as Command from '$lib/components/ui/command/index';
  import { listAgents } from '../../../routes/dashboard/agents/agents.remote';
    import { listInterviews } from '../../../routes/dashboard/interviews/interviews.remote';
  import AvatarGen from '../shared/avatar-gen.svelte';
  import ResponsiveCommand from '../shared/responsive-command.svelte';

  type Props = {
    open: boolean;
  };

  let { open = $bindable() }: Props = $props();
  let search = $state('');

  const agentsQuery = $derived(
    listAgents({
      page: 1,
      pageSize: 100,
      search: search
    })
  );

  const interviewsQuery = $derived(
    listInterviews({
      page: 1,
      pageSize: 100,
      search: search
    })
  );
</script>

<ResponsiveCommand shouldFilter={false} bind:open>
  <Command.Input placeholder="Find and interview or agent" bind:value={search} />
  <Command.List class="List">
    <Command.Group heading="Interviews">
      <Command.Empty>
        <span class="text-muted-foreground text-sm"> No interviews found </span>
      </Command.Empty>
      {#if interviewsQuery.ready}
        {#each interviewsQuery.current?.items as interview}
          <Command.Item
            onSelect={() => {
              goto(`/dashboard/interviews/${interview.id}`);
              open = false;
            }}
          >
            <AvatarGen variant="bot" name={interview.name} class="size-5" />
            {interview.name}
          </Command.Item>
        {/each}
      {/if}
    </Command.Group>

    <Command.Group heading="Agents">
      <Command.Empty>
        <span class="text-muted-foreground text-sm"> No agents found </span>
      </Command.Empty>
      {#if agentsQuery.ready}
        {#each agentsQuery.current?.items as agent}
          <Command.Item
            onSelect={() => {
              goto(`/dashboard/agents/${agent.id}`);
              open = false;
            }}
          >
            <AvatarGen variant="bot" name={agent.name} class="size-5" />
            {agent.name}
          </Command.Item>
        {/each}
      {/if}
    </Command.Group>
  </Command.List>
</ResponsiveCommand>
