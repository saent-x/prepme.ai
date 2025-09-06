<script lang="ts">
  import { Button } from '../ui/button';

  type Props = {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };

  const { page, totalPages, onPageChange }: Props = $props();
</script>

<div class="flex items-center justify-between">
  <div class="text-muted-foreground flex-1 text-sm">
    Page {page} of {totalPages || 1}
  </div>
  <div class="flex items-center justify-end space-x-2 py-4">
    <Button
      disabled={page === 1}
      variant="outline"
      size="sm"
      onclick={() => onPageChange(Math.max(1, page - 1))}>Previous</Button
    >
    <Button
      disabled={page === totalPages || totalPages === 0}
      variant="outline"
      size="sm"
      onclick={() => onPageChange(Math.min(totalPages, page + 1))}>Next</Button
    >
  </div>
</div>
