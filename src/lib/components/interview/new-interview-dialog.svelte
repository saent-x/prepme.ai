<script lang="ts">
  import ResponsiveDialog from '$lib/components/shared/responsive-dialog.svelte';
  import type { InterviewOneSchema } from '$lib/db/schema';
  import InterviewForm from './interview-form.svelte';

  type Props = {
    open: boolean;
  };

  let { open = $bindable() }: Props = $props();
</script>

<ResponsiveDialog bind:open title="New Interview" description="Add a new interview">
  <InterviewForm onCancel={() => (open = false)} />
</ResponsiveDialog>
