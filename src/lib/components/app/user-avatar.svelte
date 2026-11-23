<script lang="ts">
  import { cn } from '$lib/utils';
  import { personFace } from '$lib/avatars';
  let { name, image = null, class: className = '' }: { name: string; image?: string | null; class?: string } = $props();
  const src = $derived(image || personFace(name));
</script>

<img {src} alt="" referrerpolicy="no-referrer" class={cn('inline-block size-7 shrink-0 rounded-full object-cover', className)} />
