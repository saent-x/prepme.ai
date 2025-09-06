<script lang="ts">
  import { MAX_FREE_AGENTS, MAX_FREE_INTERVIEWS } from '$lib/constant';
  import { getFreeUsageStats } from '$lib/remote/premium.remote';
  import { RocketIcon } from '@lucide/svelte';
  import { Progress } from '../ui/progress';
  import { Button } from '../ui/button';
  import { openSidebarCommand } from '$lib/global.svelte';

  const freeUsageQuery = getFreeUsageStats();
</script>

{#if freeUsageQuery.ready && freeUsageQuery.current}
  {#if openSidebarCommand.open}
    <div class="border-border/10 flex w-full flex-col gap-y-2 rounded-lg border bg-white/5">
      <div class="flex flex-col gap-y-4 p-3">
        <div class="flex items-center gap-2">
          <RocketIcon class="size-4" />
          <p class="text-sm font-medium">Free Trial</p>
        </div>
        <div class="flex flex-col gap-y-2">
          <p class="text-xs">
            {freeUsageQuery.current?.agentsCount}/{MAX_FREE_AGENTS} Agents
          </p>
          <Progress value={(freeUsageQuery.current?.agentsCount / MAX_FREE_AGENTS) * 100} />
        </div>
        <div class="flex flex-col gap-y-2">
          <p class="text-xs">
            {freeUsageQuery.current?.interviewsCount}/{MAX_FREE_INTERVIEWS} Interviews
          </p>
          <Progress value={(freeUsageQuery.current?.interviewsCount / MAX_FREE_INTERVIEWS) * 100} />
        </div>
      </div>
      <Button
        href="/dashboard/upgrade"
        class="border-border/10 rounded-t-none border-t bg-transparent hover:bg-white/10"
        >Upgrade</Button
      >
    </div>
  {/if}
{/if}
