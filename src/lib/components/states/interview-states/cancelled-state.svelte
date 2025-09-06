<script lang="ts">
  import EmptyState from '../empty-state.svelte';
</script>

<div class="flex flex-col items-center justify-center gap-y-8 rounded-lg bg-white px-4 py-5">
  <EmptyState
    src="/cancelled.svg"
    title="Interview cancelled"
    description="This interview has been cancelled"
  />
</div>
