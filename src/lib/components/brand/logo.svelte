<script lang="ts">
  import { cn } from '$lib/utils';
  let { class: className = '' }: { class?: string } = $props();
</script>

<span class={cn('text-[21px] leading-none font-extrabold tracking-[-0.04em]', className)}>PrepMe</span>
