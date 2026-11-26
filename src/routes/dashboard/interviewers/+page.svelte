<script lang="ts">
  import { page } from '$app/state';
  import { replaceState } from '$app/navigation';
  import { Button } from '$lib/components/ui/button';
  import { cn } from '$lib/utils';
  import { AGENT_GRID, TABLE_HEAD, TABLE_ROW } from '$lib/components/app/table';
  import InterviewerAvatar from '$lib/components/app/interviewer-avatar.svelte';
  import InterviewerDialog from '$lib/components/app/interviewer-dialog.svelte';
  import { agentBlurb, agentRole, agentStyle } from '$lib/interviewer-brief';
  import { ChevronRight, Plus } from '$lib/icons';

  let { data } = $props();
  let creating = $state(false);
  let job = $state('');

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

<div class="flex h-10 items-center justify-between gap-4">
  <h1 class="page-title">Agents</h1>
  <Button onclick={() => (creating = true)}><Plus /> New agent</Button>
</div>

{#if data.interviewers.length}
  <div class="mt-8">
    <div class={cn('hidden md:grid', TABLE_HEAD, AGENT_GRID)}>
      <span>Name</span><span>Role</span><span>Style</span><span>Interviews</span><span></span>
    </div>
    <div class="stagger">
      {#each data.interviewers as i (i.id)}
        {@const style = agentStyle(i.instructions)}
        <a href="/dashboard/interviewers/{i.id}" class={cn(TABLE_ROW, 'grid-cols-[minmax(0,1fr)_20px]', AGENT_GRID)}>
          <span class="flex min-w-0 items-center gap-3">
            <InterviewerAvatar name={i.name} class="size-7 transition-transform duration-200 group-hover:-rotate-6" />
            <span class="truncate font-bold">{i.name}</span>
          </span>
          <span class="hidden truncate text-muted-foreground md:block">{agentRole(i.instructions) ?? agentBlurb(i.instructions)}</span>
          <span class="hidden md:block">
            {#if style}<span class="text-sm text-muted-foreground">{style}</span>{/if}
          </span>
          <span class="tabular hidden text-muted-foreground md:block">{i.interviewCount}</span>
          <ChevronRight class="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </a>
      {/each}
    </div>
  </div>
{:else}
  <div class="mt-8 grid place-items-center py-10 text-center">
    <InterviewerAvatar name="Lea" class="size-14" />
    <h2 class="section-title mt-3">No agents yet</h2>
    <p class="mt-1 max-w-sm text-sm text-muted-foreground">Make one for the job you're going for. It takes a minute.</p>
    <Button class="mt-4" onclick={() => (creating = true)}><Plus /> New agent</Button>
  </div>
{/if}

{#key job}<InterviewerDialog bind:open={creating} {job} />{/key}
