<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import EmptyState from '$lib/components/app/empty-state.svelte';
  import JobRow from '$lib/components/app/job-row.svelte';
  import { Plus } from '$lib/icons';

  let { data } = $props();
</script>

<svelte:head><title>Jobs · PrepMe</title></svelte:head>

<div class="flex h-10 items-center justify-between gap-4">
  <h1 class="page-title">Jobs</h1>
  {#if data.jobs.length}<Button href="/dashboard/jobs/new"><Plus /> Add a job</Button>{/if}
</div>

{#if data.jobs.length}
  <p class="mt-1 text-sm text-muted-foreground">The jobs you are preparing for, soonest interview first. The ring is how ready you are.</p>
  <section class="stagger mt-6 border-t" aria-label="Your jobs">
    {#each data.jobs as row (row.job.id)}<JobRow {row} />{/each}
  </section>
{:else}
  <EmptyState title="Add the job you are preparing for" class="mt-10">
    Paste the advert and add your CV. PrepMe checks your fit, plans the rounds and tracks how ready you are.
    {#snippet action()}<Button href="/dashboard/jobs/new"><Plus /> Add a job</Button>{/snippet}
  </EmptyState>
{/if}
