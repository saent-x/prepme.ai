<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import InterviewRow from '$lib/components/app/interview-row.svelte';
  import { Mic, Search } from '@lucide/svelte';
  import { untrack } from 'svelte';

  let { data } = $props();
  let q = $state(untrack(() => data.filters.q));
  // Keep the box in sync when the URL changes (back/forward, chips).
  $effect(() => {
    q = data.filters.q;
  });

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

<div class="flex flex-wrap items-end justify-between gap-4">
  <div>
    <p class="eyebrow">Interviews</p>
    <h1 class="mt-2 text-3xl font-semibold tracking-tight">Your sessions</h1>
  </div>
  <Button href="/dashboard/interviews/new" variant="signal" size="lg"><Mic /> New interview</Button>
</div>

<div class="mt-8 flex flex-wrap items-center gap-3">
  <div class="relative w-full sm:w-72">
    <Search class="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
    <Input placeholder="Search by name" class="h-10 rounded-full pl-10" bind:value={q} oninput={onSearch} aria-label="Search interviews" />
  </div>
  <div class="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
    {#each statuses as s}
      <button
        class="rounded-full border px-3.5 py-1.5 text-sm transition-colors aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background"
        aria-pressed={(data.filters.status ?? '') === s.v}
        onclick={() => update({ status: s.v || null })}>{s.label}</button
      >
    {/each}
  </div>
  {#if data.interviewers.length > 1}
    <select
      class="h-10 rounded-full border bg-background px-4 text-sm"
      aria-label="Filter by interviewer"
      value={data.filters.interviewer ?? ''}
      onchange={(e) => update({ interviewer: e.currentTarget.value || null })}
    >
      <option value="">All interviewers</option>
      {#each data.interviewers as i}<option value={i.id}>{i.name}</option>{/each}
    </select>
  {/if}
</div>

<section class="mt-5 rounded-3xl border bg-card p-2 sm:p-3">
  {#if data.result.items.length}
    {#each data.result.items as row (row.id)}<InterviewRow {row} />{/each}
  {:else}
    <div class="grid place-items-center px-6 py-16 text-center">
      <div class="grid size-14 place-items-center rounded-2xl bg-signal-soft text-signal"><Mic /></div>
      <h2 class="mt-4 text-lg font-semibold">{data.filters.q || data.filters.status ? 'Nothing matches' : 'No interviews yet'}</h2>
      <p class="mt-1 max-w-sm text-muted-foreground">
        {data.filters.q || data.filters.status ? 'Try a different search or filter.' : 'Start your first mock interview. It takes under a minute to set up.'}
      </p>
      {#if !data.filters.q && !data.filters.status}
        <Button href="/dashboard/interviews/new" class="mt-6">Set up an interview</Button>
      {/if}
    </div>
  {/if}
</section>

{#if data.result.totalPages > 1}
  <nav class="mt-5 flex items-center justify-between text-sm" aria-label="Pagination">
    <span class="text-muted-foreground">Page {data.result.page} of {data.result.totalPages}</span>
    <div class="flex gap-2">
      <Button variant="outline" size="sm" disabled={data.result.page <= 1} onclick={() => update({ page: String(data.result.page - 1) })}>Previous</Button>
      <Button variant="outline" size="sm" disabled={data.result.page >= data.result.totalPages} onclick={() => update({ page: String(data.result.page + 1) })}>Next</Button>
    </div>
  </nav>
{/if}
