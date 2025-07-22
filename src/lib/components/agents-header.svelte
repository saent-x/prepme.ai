<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte';
  import { PlusIcon } from '@lucide/svelte';
  import NewAgentDialog from './new-agent-dialog.svelte';

  let open = $state(false);
</script>

<NewAgentDialog bind:open />
<div class="flex flex-col gap-y-4 px-4 py-4 md:px-8">
  <div class="flex items-center justify-between">
    <h5 class="text-xl font-medium">My Agents</h5>
    <Button
      onclick={() => {
        console.log('clicked huh??');
        open = !open;
      }}
    >
      <PlusIcon />
      New Agent
    </Button>
  </div>
</div>
