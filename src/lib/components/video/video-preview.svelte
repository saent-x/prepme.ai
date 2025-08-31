<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
  };

  const { children }: Props = $props();
</script>

<div
  class="flex h-[250px] w-[350px] items-center justify-center rounded-md border-4 border-blue-500 bg-[#0f172a]"
>
  <div
    class="flex items-center justify-center rounded-full bg-purple-500"
  >
    {@render children()}
  </div>
</div>
