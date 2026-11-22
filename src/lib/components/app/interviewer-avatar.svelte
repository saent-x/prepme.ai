<script lang="ts">
  import { cn } from '$lib/utils';
  import { interviewerFace } from '$lib/avatars';
  let {
    name,
    class: className = '',
    size = 'md'
  }: { name: string; class?: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' } = $props();
  const src = $derived(interviewerFace(name));
</script>

<img
  {src}
  alt=""
  class={cn(
    'inline-block shrink-0 rounded-full',
    size === 'xs' && 'size-6',
    size === 'sm' && 'size-7',
    size === 'md' && 'size-9',
    size === 'lg' && 'size-12',
    size === 'xl' && 'size-16',
    className
  )}
/>
