<script lang="ts">
  import ResponsiveDialog from '$lib/components/shared/responsive-dialog.svelte';
  import type { AgentOneSchema } from '$lib/db/schema';
  import AgentForm from './agent-form.svelte';

  type Props = {
    open: boolean;
    initialValues: AgentOneSchema;
  };

  let { open = $bindable(), initialValues }: Props = $props();
</script>

<ResponsiveDialog bind:open title="Update Agent" description="Edit the agent's details">
  <AgentForm onCancel={() => (open = false)} {initialValues} actionType="update" />
</ResponsiveDialog>
