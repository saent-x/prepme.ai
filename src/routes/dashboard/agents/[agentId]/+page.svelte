<script lang="ts">
  import { page } from '$app/state';
  import AgentViewHeader from '$lib/components/agent-view-header.svelte';
  import AvatarGen from '$lib/components/avatar-gen.svelte';
  import ErrorState from '$lib/components/error-state.svelte';
  import LoadingState from '$lib/components/loading-state.svelte';
  import Badge from '$lib/components/ui/badge/badge.svelte';
  import { VideoIcon } from '@lucide/svelte';
  import { deleteAgent, getAgent } from '../agents.remote';
  import { goto } from '$app/navigation';
  import { useConfirm } from '$lib/components/use-confirm.svelte';
  import UpdateAgentDialog from '$lib/components/update-agent-dialog.svelte';

  let agentQuery = getAgent(page.params?.agentId ?? '');
  let agentName = $derived(agentQuery.current?.name ?? '');

  const [ConfirmationDialog, confirmRemove, getPromise] = useConfirm();

  const removeAgent = async (agentId: string) => {
    const ok = await confirmRemove();
    if (!ok) return;

    const deletedAgent = await deleteAgent(agentId);
    if (deletedAgent) {
      goto('/dashboard/agents');
    }
  };

  let confirmationDialogFlag = $derived(getPromise());
  let openUpdateDialog = $state<boolean>(false);
</script>

<div class="flex flex-1 flex-col gap-y-4 px-4 py-4 md:px-8">
  {#if agentQuery.error}
    <ErrorState title="Failed to load agent" description="Please try again later..." />
  {:else if agentQuery.loading}
    <LoadingState title="Retrieving Agent" description="This shouldn't take too long..." />
  {:else}
    <ConfirmationDialog.component
      bind:promise={confirmationDialogFlag}
      title="Are you sure?"
      description={`The following action will remove ${agentQuery.current?.meetingCount} associated ${(agentQuery.current?.meetingCount ?? 0) === 1 ? 'meeting' : 'meetings'}`}
      {...ConfirmationDialog.props}
    />
    <UpdateAgentDialog
      bind:open={openUpdateDialog}
      initialValues={{
        id: agentQuery.current?.id ?? '',
        name: agentQuery.current?.name ?? '',
        instructions: agentQuery.current?.instructions ?? ''
      }}
    />
    <AgentViewHeader
      agentId={agentQuery.current?.id ?? ''}
      agentName={agentQuery.current?.name ?? ''}
      onUpdate={() => (openUpdateDialog = true)}
      onRemove={async () => await removeAgent(agentQuery.current?.id ?? '')}
    />

    <div class="rounded-lg border bg-white">
      <div class="col-span-5 flex flex-col gap-y-5 px-4 py-5">
        <div class="flex items-center gap-x-3">
          <AvatarGen class="size-10" variant="bot" bind:name={agentName} />
          <h2 class="text-2xl font-medium">{agentName}</h2>
        </div>
        <Badge variant="outline" class="flex items-center gap-x-2 [&>svg]:size-4">
          <VideoIcon class="text-blue-700" />
          {agentQuery.current?.meetingCount ?? 0}
          {(agentQuery.current?.meetingCount ?? 0) === 1 ? 'meeting' : 'meetings'}
        </Badge>
        <div class="flex flex-col gap-y-4">
          <p class="text-lg font-medium">Instructions</p>
          <p class="text-neutral-800">{agentQuery.current?.instructions}</p>
        </div>
      </div>
    </div>
  {/if}
</div>
