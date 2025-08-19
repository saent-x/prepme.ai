<script lang="ts">
  import { CornerDownRightIcon } from '@lucide/svelte';
  import AvatarGen from '../avatar-gen.svelte';
  import { format } from 'date-fns';

  type Props = {
    name: string;
    startedAt: Date | null;
    agent: {
      name: string;
    };
  };

  let { name, agent, startedAt }: Props = $props();
</script>

<div class="flex flex-col gap-y-1">
  <span class="font-semibold capitalize">{name}</span>

  <div class="flex items-center gap-x-2">
    <div class="flex items-center gap-x-1">
      <CornerDownRightIcon class="text-muted-foreground size-3" />
      <span class="text-muted-foreground max-w-[200px] truncate text-sm capitalize">{name}</span>
    </div>
    <AvatarGen class="size-4" variant="bot" name={agent.name} />
  </div>

  <span class="text-muted-foreground text-sm">
    {startedAt ? format(startedAt, 'MMM d') : ''}
  </span>
</div>
