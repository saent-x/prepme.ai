<script lang="ts">
  import { cn, hueFrom, initials } from '$lib/utils';
  let {
    name,
    class: className = '',
    size = 'md'
  }: { name: string; class?: string; size?: 'sm' | 'md' | 'lg' } = $props();
  const hue = $derived(hueFrom(name));
</script>

<span
  aria-hidden="true"
  class={cn(
    'inline-grid shrink-0 place-items-center rounded-xl font-mono font-semibold text-white',
    size === 'sm' && 'size-7 rounded-lg text-[11px]',
    size === 'md' && 'size-10 text-sm',
    size === 'lg' && 'size-14 rounded-2xl text-lg',
    className
  )}
  style="background: linear-gradient(140deg, oklch(0.55 0.13 {hue}), oklch(0.35 0.08 {hue + 40}));"
>
  {initials(name)}
</span>
