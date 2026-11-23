<script lang="ts">
  import { page } from '$app/state';
  import { replaceState } from '$app/navigation';
  import { Button } from '$lib/components/ui/button';
  import InterviewerAvatar from '$lib/components/app/interviewer-avatar.svelte';
  import InterviewerDialog from '$lib/components/app/interviewer-dialog.svelte';
  import { VOICES } from '$lib/templates';
  import { Mic, Plus } from '@lucide/svelte';

  let { data } = $props();
  let creating = $state(false);
  let job = $state('');
  const voiceLabel = (v: string) => VOICES.find((x) => x.id === v)?.label ?? v;

  // Old links to /dashboard/interviewers/new and the landing page land here with ?new=1 (and maybe ?job=).
  $effect(() => {
    const u = page.url;
    if (!u.searchParams.has('new')) return;
    const preset = (u.searchParams.get('job') ?? '').slice(0, 120);
    setTimeout(() => {
      replaceState('/dashboard/interviewers', {});
      job = preset;
      creating = true;
    });
  });
</script>

<svelte:head><title>Agents · PrepMe</title></svelte:head>

<div class="flex h-9 items-center justify-between gap-4">
  <h1 class="text-xl font-bold tracking-tight">Agents</h1>
  <Button onclick={() => (creating = true)}><Plus /> New agent</Button>
</div>

{#if data.interviewers.length}
  <div class="stagger mt-4 overflow-hidden rounded-xl border bg-card">
    <div class="hidden grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_80px_90px_110px] gap-x-4 border-b px-4 py-2 text-xs font-medium text-faint md:grid">
      <span>Agent</span><span>Brief</span><span>Voice</span><span>Interviews</span><span></span>
    </div>
    {#each data.interviewers as i (i.id)}
      <div class="grid grid-cols-[1fr_auto] items-center gap-x-4 border-t px-4 py-2.5 text-sm first:border-t-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_80px_90px_110px] md:[&:nth-child(2)]:border-t-0">
        <a href="/dashboard/interviewers/{i.id}" class="flex min-w-0 items-center gap-2.5 hover:underline">
          <InterviewerAvatar name={i.name} size="sm" />
          <span class="truncate font-semibold">{i.name}</span>
        </a>
        <span class="hidden truncate text-muted-foreground md:block">{i.instructions}</span>
        <span class="hidden text-muted-foreground md:block">{voiceLabel(i.voice)}</span>
        <span class="tabular hidden text-muted-foreground md:block">{i.interviewCount}</span>
        <span class="flex justify-end">
          <Button href="/dashboard/interviews/new?interviewer={i.id}" variant="outline" size="sm"><Mic /> Interview</Button>
        </span>
      </div>
    {/each}
  </div>
{:else}
  <div class="mt-4 grid place-items-center rounded-xl border bg-card px-6 py-12 text-center">
    <InterviewerAvatar name="pip" size="lg" />
    <h2 class="mt-3 font-bold">No agents yet</h2>
    <p class="mt-1 max-w-sm text-sm text-muted-foreground">Make one for the job you are going for. It takes a minute.</p>
    <Button class="mt-4" onclick={() => (creating = true)}><Plus /> New agent</Button>
  </div>
{/if}

{#key job}<InterviewerDialog bind:open={creating} {job} />{/key}
