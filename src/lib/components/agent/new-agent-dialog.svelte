<script lang="ts">
  import ResponsiveDialog from '$lib/components/shared/responsive-dialog.svelte';
  import AgentForm from './agent-form.svelte';

  type Props = {
    open: boolean;
    onAction?: () => void;
  };

  let { open = $bindable(), onAction }: Props = $props();
</script>

<ResponsiveDialog bind:open title="New Agent" description="Add a new agent">
  <AgentForm onCancel={() => (open = false)} {onAction} />
</ResponsiveDialog>
