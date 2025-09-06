<script lang="ts">
  import {
    createAgent,
    listAgents,
    updateAgent
  } from '../../../routes/dashboard/agents/agents.remote';
  import AvatarGen from '../shared/avatar-gen.svelte';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import Textarea from '../ui/textarea/textarea.svelte';
  import { Button } from '../ui/button';
  import { toast } from 'svelte-sonner';
  import { authClient } from '$lib/auth-client';
  import type { AgentOneSchema } from '$lib/db/schema';
  import { getFreeUsageStats } from '$lib/remote/premium.remote';
    import type { HttpError } from '@sveltejs/kit';

  type Props = {
    onCancel: () => void;
    onAction?: () => void;
    initialValues?: AgentOneSchema;
    actionType?: 'update' | 'create';
  };

  let { onCancel, onAction, initialValues, actionType = 'create' }: Props = $props();
  let name = $state<string>(actionType === 'update' ? initialValues!.name : '');
  let instructions = $state<string>(actionType === 'update' ? initialValues!.instructions : '');
  let pending = $state<boolean>(false);
  const session = authClient.useSession();

  let formEnhance = async ({ submit }: { submit: any }) => {
    try {
      pending = true;
      await submit().updates(
        listAgents({
          search: '',
          page: 1
        }),
        listAgents({
          search: '',
          page: 100
        }),
        getFreeUsageStats()
      );

      toast.success(
        actionType === 'update' ? 'Agent updated successfully!' : 'Agent created successfully!'
      );

      onAction?.();
      onCancel();
    } catch (error) {
      const e = error as HttpError;
      toast.error(e ? e.body.message : 'An error occurred');
    } finally {
      pending = false;
    }
  };

  let action = actionType === 'create' ? createAgent : updateAgent;
</script>

<form class="space-y-7" {...action.enhance(formEnhance)}>
  <AvatarGen class="size-16 border" variant="bot" bind:name />
  <input type="hidden" name="userId" value={$session.data?.user.id} />

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
      placeholder="Software Engineer Tutor, C# Interview bot"
    />
  </div>
  <div class="flex w-full flex-col gap-1.5">
    <Label for="instructions">Instructions</Label>
    <Textarea
      id="instructions"
      name="instructions"
      placeholder="you're a helpful agent very knowledgeable in software development and its latest technological trends."
      bind:value={instructions}
    />
  </div>

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
