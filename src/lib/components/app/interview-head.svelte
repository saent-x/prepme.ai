<script lang="ts">
  import { cn } from '$lib/utils';
  import { INTERVIEW_GRID, TABLE_HEAD, type InterviewCols } from './table';
  let { cols = 'full' }: { cols?: InterviewCols } = $props();
</script>

<div class={cn('hidden sm:grid', TABLE_HEAD, INTERVIEW_GRID[cols])}>
  <span></span><span>Interview</span><span>Company</span>
  {#if cols === 'full'}<span>Agent</span>{/if}
  <span>Date</span>
  {#if cols !== 'home'}<span>Length</span>{/if}
  <span>Score</span><span></span>
</div>
