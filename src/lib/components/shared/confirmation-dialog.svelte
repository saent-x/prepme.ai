<script lang="ts">
  import ResponsiveDialog from './responsive-dialog.svelte';
  import { Button } from '../ui/button';

  type Props = {
    promise: { resolve: (value: boolean) => void } | null;
    handleCancel: () => void;
    handleConfirm: () => void;
    title: string;
    description: string;
  };

  const { promise, title, description, handleCancel, handleConfirm }: Props = $props();
  let open = $derived(promise !== null);
</script>

<ResponsiveDialog bind:open {title} {description}>
  <div
    class="flex w-full flex-col-reverse items-center justify-end gap-x-2 gap-y-2 pt-4 lg:flex-row"
  >
    <Button onclick={handleCancel} variant="outline" class="w-full lg:w-auto">Cancel</Button>
    <Button onclick={handleConfirm} class="w-full lg:w-auto">Confirm</Button>
  </div>
</ResponsiveDialog>
