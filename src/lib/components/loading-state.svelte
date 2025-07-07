<script lang="ts">
  import { Loader2Icon } from '@lucide/svelte';
  
  type Props = {
    title: string;
    description: string;
  }

  let { title, description }: Props = $props();
</script>

<div class="flex flex-1 items-center justify-center px-8 py-4">
  <div
    class="bg-background flex flex-col items-center justify-center gap-y-6 rounded-lg p-10 shadow-sm"
  >
    <Loader2Icon class="text-primary size-6 animate-spin" />
    <div class="flex flex-col gap-y-2 text-center">
      <h6 class="text-lg font-medium">{title}</h6>
      <p class="text-sm">{description}</p>
    </div>
  </div>
</div>
