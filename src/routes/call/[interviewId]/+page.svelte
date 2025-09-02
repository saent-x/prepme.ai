<script lang="ts">
  import { page } from '$app/state';
  import CallProvider from '$lib/components/call/call-provider.svelte';
  import ErrorState from '$lib/components/error-state.svelte';
  import { getInterview } from '../../dashboard/interviews/interviews.remote';

  const interviewId = page.params?.interviewId;

  let interviewQuery = getInterview(interviewId ?? '');
</script>

{#if interviewQuery.error}
  <ErrorState title="Failed to load interview" description="Please try again later..." />
{:else if interviewQuery.ready}
  <div class="h-full">
    {#if interviewQuery.current?.status === 'completed'}
      <div class="flex h-screen items-center justify-center">
        <ErrorState
          title="Interview concluded"
          description="Interview cannot be rejoined when completed"
        />
      </div>
    {/if}

    <CallProvider
      interviewId={interviewQuery.current?.id ?? ''}
      interviewName={interviewQuery.current?.name ?? ''}
    />
  </div>
{/if}
