<script lang="ts">
  import { cn } from '$lib/utils';
  import { personFace } from '$lib/avatars';
  // The account photo when there is one, otherwise an open-peeps face drawn from the name (same name, same face).
  let { name, image = null, class: className = '' }: { name: string; image?: string | null; class?: string } = $props();
  let broken = $state(false);
  const src = $derived(image && !broken ? image : personFace(name));
</script>

<img
  {src}
  alt=""
  referrerpolicy="no-referrer"
  onerror={() => (broken = true)}
  class={cn('inline-block size-8 shrink-0 rounded-full bg-track object-cover', className)}
/>
