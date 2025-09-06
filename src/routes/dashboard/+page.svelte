<script lang="ts">
  import { goto } from '$app/navigation';

  $effect(() => {
    goto('/dashboard/agents');
  });
</script>
