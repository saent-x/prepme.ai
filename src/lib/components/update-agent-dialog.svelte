<script lang="ts">
  import ResponsiveDialog from '$lib/components/responsive-dialog.svelte';
  import type { AgentUpdateSchema } from '$lib/db/schema';
  import AgentForm from './agent-form.svelte';

  type Props = {
    open: boolean;
    initialValues: AgentUpdateSchema;
  };

  let { open = $bindable(), initialValues }: Props = $props();
</script>

<ResponsiveDialog bind:open title="Update Agent" description="Edit the agent's details">
  <AgentForm onCancel={() => (open = false)} {initialValues} actionType="update" />
</ResponsiveDialog>
