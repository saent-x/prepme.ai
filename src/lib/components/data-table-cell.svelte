<script lang="ts">
  import { CornerDownRightIcon } from '@lucide/svelte';
  import AvatarGen from './avatar-gen.svelte';

  type Props = {
    name: string;
    instructions: string;
  };

  let { name, instructions }: Props = $props();
</script>

<div class="flex flex-col gap-y-1">
  <div class="flex items-center gap-x-2">
    <AvatarGen class="size-6" variant="bot" bind:name />
    <span class="font-semibold capitalize">{name}</span>
  </div>

  <div class="flex items-center gap-x-2">
    <CornerDownRightIcon class="text-muted-foreground size-3" />
    <span class="text-muted-foreground max-w-[200px] truncate text-sm capitalize"
      >{instructions}</span
    >
  </div>
</div>
