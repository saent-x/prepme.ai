<script lang="ts">
  import InterviewViewHeader from '$lib/components/interview-view-header.svelte';
  import { page } from '$app/state';
  import { deleteInterview, getInterview } from '../interviews.remote';
  import { useConfirm } from '$lib/components/use-confirm.svelte';
  import { goto } from '$app/navigation';
  import ErrorState from '$lib/components/error-state.svelte';
  import LoadingState from '$lib/components/loading-state.svelte';
  import UpdateInterviewDialog from '$lib/components/update-interview-dialog.svelte';
  import EmptyState from '$lib/components/empty-state.svelte';
  import UpcomingState from '$lib/components/interview-states/upcoming-state.svelte';
  import ActiveState from '$lib/components/interview-states/active-state.svelte';
  import CancelledState from '$lib/components/interview-states/cancelled-state.svelte';
  import ProcessingState from '$lib/components/interview-states/processing-state.svelte';
    import CallCompleted from '$lib/components/call/call-completed.svelte';

  const [ConfirmationDialog, confirmRemove, getPromise] = useConfirm();

  let interviewQuery = getInterview(page.params?.interviewId ?? '');

  const removeInterview = async (interviewId: string) => {
    const ok = await confirmRemove();
    if (!ok) return;

    const deletedAgent = await deleteInterview(interviewId);
    if (deletedAgent) {
      goto('/dashboard/interviews');
    }
  };

  let confirmationDialogFlag = $derived(getPromise());
  let openUpdateDialog = $state<boolean>(false);
</script>

<div class="flex flex-1 flex-col gap-y-4 px-4 py-4 md:px-8">
  {#if interviewQuery.error}
    <ErrorState title="Failed to load interview" description="Please try again later..." />
  {:else if interviewQuery.loading}
    <LoadingState title="Retrieving Interview" description="This shouldn't take too long..." />
  {:else if interviewQuery.ready}
    <ConfirmationDialog.component
      bind:promise={confirmationDialogFlag}
      title="Are you sure?"
      description={`The following action will remove this interview [${interviewQuery.current?.name}]`}
      {...ConfirmationDialog.props}
    />
    <UpdateInterviewDialog
      bind:open={openUpdateDialog}
      initialValues={{
        id: interviewQuery.current?.id ?? '',
        agentId: interviewQuery.current?.agentId ?? '',
        name: interviewQuery.current?.name ?? ''
      }}
    />
    <InterviewViewHeader
      interviewId={interviewQuery.current?.id ?? ''}
      interviewName={interviewQuery.current?.name ?? ''}
      onUpdate={() => (openUpdateDialog = true)}
      onRemove={async () => await removeInterview(interviewQuery.current?.id ?? '')}
    />

    {#if interviewQuery.current?.status === 'cancelled'}
      <CancelledState />
    {:else if interviewQuery.current?.status === 'active'}
      <ActiveState interviewId={interviewQuery.current.id} />
    {:else if interviewQuery.current?.status === 'upcoming'}
      <UpcomingState
        interviewId={interviewQuery.current.id}
        onCancelInterview={() => {}}
        isCancelling={false}
      />
    {:else if interviewQuery.current?.status === 'completed'}
      <CallCompleted data={interviewQuery.current} />
    {:else if interviewQuery.current?.status === 'processing'}
      <ProcessingState />
    {/if}
  {/if}
</div>
