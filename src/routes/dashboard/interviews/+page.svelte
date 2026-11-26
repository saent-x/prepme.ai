<script lang="ts">
  import EmptyState from '$lib/components/app/empty-state.svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Select from '$lib/components/ui/select';
  import { Segmented } from '$lib/components/ui/segmented';
  import InterviewRow from '$lib/components/app/interview-row.svelte';
  import InterviewHead from '$lib/components/app/interview-head.svelte';
  import { Plus, Search } from '$lib/icons';
  import { untrack } from 'svelte';

  let { data } = $props();
  let q = $state(untrack(() => data.filters.q));
  // Keep the box in sync when the URL changes (back/forward, chips).
  $effect(() => {
    q = data.filters.q;
  });

  const ALL = 'all';
  const agentItems = $derived([{ value: ALL, label: 'All agents' }, ...data.interviewers.map((i) => ({ value: i.id, label: i.name }))]);

  const statuses = [
    { v: '', label: 'All' },
    { v: 'completed', label: 'Scored' },
    { v: 'upcoming', label: 'Ready' },
    { v: 'active', label: 'In progress' },
    { v: 'processing', label: 'Scoring' }
  ];

  function update(params: Record<string, string | null>) {
    const u = new URL(page.url);
    for (const [k, v] of Object.entries(params)) {
      if (v) u.searchParams.set(k, v);
      else u.searchParams.delete(k);
    }
    if (!('page' in params)) u.searchParams.delete('page');
    goto(u, { keepFocus: true, noScroll: true, replaceState: true });
  }

  let t: ReturnType<typeof setTimeout>;
  function onSearch() {
    clearTimeout(t);
    t = setTimeout(() => update({ q: q.trim() || null }), 250);
  }
</script>

<svelte:head><title>Interviews · PrepMe</title></svelte:head>

<div class="flex h-10 items-center justify-between gap-4">
  <h1 class="page-title">Interviews</h1>
  <Button href="/dashboard/interviews/new"><Plus /> New interview</Button>
</div>

<div class="mt-8 flex flex-wrap items-center gap-2">
  <div class="relative w-full sm:w-64">
    <Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
    <Input placeholder="Search by name" class="pl-9" bind:value={q} oninput={onSearch} aria-label="Search interviews" />
  </div>
  <Segmented
    bind:value={() => data.filters.status ?? '', (v) => update({ status: v || null })}
    aria-label="Filter by status"
    options={statuses.map((x) => ({ value: x.v, label: x.label }))}
  />
  {#if data.interviewers.length > 1}
    <Select.Root
      items={agentItems}
      bind:value={() => data.filters.interviewer ?? ALL, (v) => update({ interviewer: !v || v === ALL ? null : v })}
    >
      <Select.Trigger aria-label="Filter by agent"><Select.Value /></Select.Trigger>
      <Select.Content>
        {#each agentItems as a (a.value)}<Select.Item value={a.value}>{a.label}</Select.Item>{/each}
      </Select.Content>
    </Select.Root>
  {/if}
</div>

<section class="stagger mt-6">
  {#if data.result.items.length}
    <InterviewHead />
    {#each data.result.items as row (row.id)}<InterviewRow {row} />{/each}
  {:else}
    {@const filtered = !!(data.filters.q || data.filters.status)}
    <EmptyState title={filtered ? 'Nothing matches' : 'No interviews yet'}>
      {filtered ? 'Try a different search or filter.' : 'Your first one takes under a minute to set up.'}
      {#snippet action()}
        {#if !filtered}<Button href="/dashboard/interviews/new"><Plus /> New interview</Button>{/if}
      {/snippet}
    </EmptyState>
  {/if}
</section>

{#if data.result.totalPages > 1}
  <nav class="mt-3 flex items-center justify-between text-[13px]" aria-label="Pagination">
    <span class="text-muted-foreground">Page {data.result.page} of {data.result.totalPages}</span>
    <div class="flex gap-2">
      <Button variant="outline" size="sm" disabled={data.result.page <= 1} onclick={() => update({ page: String(data.result.page - 1) })}>Previous</Button>
      <Button variant="outline" size="sm" disabled={data.result.page >= data.result.totalPages} onclick={() => update({ page: String(data.result.page + 1) })}>Next</Button>
    </div>
  </nav>
{/if}
