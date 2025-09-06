<script lang="ts">
  import ResponsiveDialog from '$lib/components/shared/responsive-dialog.svelte';
  import type { UpdateInterviewSchema } from '$lib/db/schema';
  import InterviewForm from './interview-form.svelte';

  type Props = {
    open: boolean;
    initialValues: UpdateInterviewSchema;
  };

  let { open = $bindable(), initialValues }: Props = $props();
</script>

<ResponsiveDialog bind:open title="Edit Interview" description="Edit interview details">
  <InterviewForm onCancel={() => (open = false)} actionType="update" {initialValues} />
</ResponsiveDialog>
