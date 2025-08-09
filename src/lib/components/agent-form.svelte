<script lang="ts">
  import { createAgents, listAgents } from '../../routes/dashboard/agents/agents.remote';
  import AvatarGen from './avatar-gen.svelte';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import Textarea from './ui/textarea/textarea.svelte';
  import { Button } from './ui/button';
  import { toast } from 'svelte-sonner';
  import { authClient } from '$lib/auth-client';

  type Props = {
    onCancel: () => void;
  };

  let { onCancel }: Props = $props();
  let name = $state<string>('');
  let creating = $state<boolean>(false);
  const session = authClient.useSession();

  let formEnhance = async ({ submit }: { submit: any }) => {
    try {
      creating = true;
      await submit();
      console.log('submitted...');
      toast.success(`Agent created successfully!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      creating = false;
    }
  };
</script>

<form class="space-y-7" {...createAgents.enhance(formEnhance)}>
  <AvatarGen class="size-16 border" variant="bot" bind:name />
  <input type="hidden" name="userId" value={$session.data?.user.id} />

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
    />
  </div>

  <div class="flex justify-between">
    <Button
      variant="ghost"
      type="button"
      onclick={(e) => {
        onCancel();
      }}>Cancel</Button
    >

    <Button disabled={creating} style={creating ? 'bg-gray-800' : ''} type="submit">Create</Button>
  </div>
</form>
