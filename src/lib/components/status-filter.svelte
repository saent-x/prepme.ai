<script lang="ts">
  import { InterviewStatus, interviewStatus, type InterviewStatusEnum } from '$lib/db/schema';
  import { useInterviewsFilters } from '$lib/hooks/use-interviews-filters';
  import {
    CircleCheckIcon,
    CircleXIcon,
    ClockArrowUpIcon,
    LoaderIcon,
    VideoIcon
  } from '@lucide/svelte';
  import CommandSelect from './command-select.svelte';

  let options = $state([
    {
      id: InterviewStatus.Upcoming,
      value: InterviewStatus.Upcoming
    },
    {
      id: InterviewStatus.Completed,
      value: InterviewStatus.Completed
    },
    {
      id: InterviewStatus.Active,
      value: InterviewStatus.Active
    },
    {
      id: InterviewStatus.Processing,
      value: InterviewStatus.Processing
    },
    {
      id: InterviewStatus.Cancelled,
      value: InterviewStatus.Cancelled
    }
  ]);

  const filters = useInterviewsFilters();
  let selectedStatus = $derived(filters.status.current ?? '');
</script>

{#snippet optionComponent(value: string)}
  <div class="flex items-center gap-x-2 capitalize">
    {#if value === InterviewStatus.Upcoming}
      <ClockArrowUpIcon />
      {InterviewStatus.Upcoming}
    {:else if value === InterviewStatus.Completed}
      <CircleCheckIcon />
      {InterviewStatus.Completed}
    {:else if value === InterviewStatus.Active}
      <VideoIcon />
      {InterviewStatus.Active}
    {:else if value === InterviewStatus.Processing}
      <LoaderIcon />
      {InterviewStatus.Processing}
    {:else if value === InterviewStatus.Cancelled}
      <CircleXIcon />
      {InterviewStatus.Cancelled}
    {/if}
  </div>
{/snippet}

<CommandSelect
  itemSnippet={optionComponent}
  placeholder="Status"
  className="h-9"
  bind:value={selectedStatus}
  bind:options
  queryLoading={false}
  onSelect={(value) => (filters.status.current = value as InterviewStatusEnum)}
/>
