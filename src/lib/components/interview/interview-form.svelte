<script lang="ts">
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Button } from '../ui/button';
  import { toast } from 'svelte-sonner';
  import type { UpdateInterviewSchema } from '$lib/db/schema';
  import {
    createInterview,
    listInterviews,
    updateInterview
  } from '../../../routes/dashboard/interviews/interviews.remote';
  import { listAgents } from '../../../routes/dashboard/agents/agents.remote';
  import CommandSelect from '../shared/command-select.svelte';
  import AvatarGen from '../shared/avatar-gen.svelte';
  import { goto } from '$app/navigation';
  import NewAgentDialog from '../agent/new-agent-dialog.svelte';
  import { getFreeUsageStats } from '$lib/remote/premium.remote';
  import type { HttpError } from '@sveltejs/kit';

  type Props = {
    onCancel: () => void;
    initialValues?: UpdateInterviewSchema;
    actionType?: 'update' | 'create';
  };

  let { onCancel, initialValues, actionType = 'create' }: Props = $props();
  let name = $state<string>(actionType === 'update' ? initialValues!.name : '');
  let pending = $state<boolean>(false);
  let agentSearch = $state<string>('');
  let selectedAgent = $state<string>(actionType === 'update' ? initialValues!.agentId : '');
  let openNewAgentDialog = $state<boolean>(false);

  const agentsQuery = $derived(
    listAgents({
      page: 1,
      pageSize: 100,
      search: agentSearch
    })
  );

  let options = $derived(
    (agentsQuery.current?.items ?? []).map((agent) => ({
      id: agent.id,
      value: agent.id,
      name: agent.name
    }))
  );

  let formEnhance = async ({ submit }: { submit: any }) => {
    try {
      pending = true;

      await submit().updates(listInterviews(), getFreeUsageStats());
      const result = $state.snapshot(action.result!) as { interviewId: string };

      toast.success(
        actionType === 'update'
          ? 'Interview updated successfully!'
          : 'Interview created successfully!'
      );

      onCancel();
      goto(`/dashboard/interviews/${result.interviewId}`);
    } catch (error) {
      const e = error as HttpError;
      toast.error(e ? e.body.message : 'An error occurred');
    } finally {
      pending = false;
    }
  };

  let action = actionType === 'create' ? createInterview : updateInterview;
</script>

<NewAgentDialog bind:open={openNewAgentDialog} onAction={() => agentsQuery.refresh()} />

<form class="space-y-7" {...action.enhance(formEnhance)}>
  <input type="hidden" name="agentId" value={selectedAgent} />

  {#if actionType === 'update'}
    <input type="hidden" name="id" value={initialValues?.id} />
  {/if}

  <div class="flex w-full flex-col gap-1.5">
    <Label for="name">Name</Label>
    <Input
      bind:value={name}
      type="name"
      id="name"
      name="name"
      placeholder="Software Engineer Consultation, C# Interview"
    />
  </div>

  {#snippet selectItem(value: string)}
    <div class="flex items-center gap-x-2">
      <AvatarGen class="size-6 border" variant="bot" name={value} />
      <span>{value}</span>
    </div>
  {/snippet}

  {#if agentsQuery.error}
    <p class="text-red-700">error loading agents...</p>
  {:else}
    <div class="flex w-full flex-col gap-1.5">
      <Label for="agent">Agent</Label>
      <CommandSelect
        itemSnippet={selectItem}
        onSelect={(value) => {
          selectedAgent = value;
          agentSearch = '';
        }}
        bind:search={agentSearch}
        bind:value={selectedAgent}
        bind:queryLoading={agentsQuery.loading}
        placeholder="Select an agent"
        bind:options
      />
      <p class="text-muted-foreground text-sm">
        Can&apos;t find an agent?
        <button
          type="button"
          class="text-primary hover:underline"
          onclick={() => (openNewAgentDialog = true)}>Create new agent</button
        >
      </p>
    </div>
  {/if}

  <div class="flex justify-between">
    <Button
      variant="ghost"
      type="button"
      onclick={() => {
        onCancel();
      }}>Cancel</Button
    >

    <Button disabled={pending} style={pending ? 'bg-gray-800' : ''} type="submit"
      >{actionType === 'update' ? 'Update' : 'Create'}</Button
    >
  </div>
</form>
