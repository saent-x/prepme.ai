<script lang="ts">
  import ResponsiveDialog from '$lib/components/responsive-dialog.svelte';
  import AgentForm from './agent-form.svelte';

  type Props = {
    open: boolean;
  };

  let { open = $bindable() }: Props = $props();
</script>

<ResponsiveDialog bind:open title="New Agent" description="Add a new agent">
  <AgentForm onCancel={() => (open = false)} />
</ResponsiveDialog>
