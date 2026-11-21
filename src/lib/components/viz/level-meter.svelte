<script lang="ts">
  /** Five-bar mic level meter. level is 0..1. */
  let { level = 0, muted = false, class: className = '' }: { level?: number; muted?: boolean; class?: string } = $props();
  const bars = [0.12, 0.28, 0.45, 0.65, 0.85];
</script>

<span class="inline-flex h-4 items-end gap-[3px] {className}" aria-hidden="true">
  {#each bars as t, i}
    <span
      class="w-[3px] rounded-full transition-colors duration-75 {!muted && level > t ? 'bg-success' : 'bg-current opacity-25'}"
      style="height:{30 + i * 17}%"
    ></span>
  {/each}
</span>
