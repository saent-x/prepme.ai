<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import InterviewerAvatar from '$lib/components/app/interviewer-avatar.svelte';
  import { getTemplate, VOICES } from '$lib/templates';
  import { Mic, Plus } from '@lucide/svelte';

  let { data } = $props();
  const voiceLabel = (v: string) => VOICES.find((x) => x.id === v)?.label ?? v;
</script>

<svelte:head><title>Interviewers · PrepMe</title></svelte:head>

<div class="flex flex-wrap items-end justify-between gap-4">
  <div>
    <p class="eyebrow">Interviewers</p>
    <h1 class="mt-2 text-3xl font-semibold tracking-tight">Who interviews you</h1>
    <p class="mt-2 max-w-xl text-muted-foreground">Each interviewer has its own brief and voice. Start from a template or write your own.</p>
  </div>
  <Button href="/dashboard/interviewers/new" size="lg"><Plus /> New interviewer</Button>
</div>

{#if data.interviewers.length}
  <div class="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {#each data.interviewers as i (i.id)}
      <article class="group flex flex-col rounded-3xl border bg-card p-5 transition-shadow hover:shadow-sm">
        <a href="/dashboard/interviewers/{i.id}" class="flex items-center gap-3">
          <InterviewerAvatar name={i.name} />
          <div class="min-w-0">
            <h2 class="truncate font-semibold group-hover:underline">{i.name}</h2>
            <p class="text-xs text-muted-foreground">{getTemplate(i.template)?.category ?? 'Custom'} · {voiceLabel(i.voice)} voice</p>
          </div>
        </a>
        <p class="mt-4 line-clamp-3 flex-1 text-sm text-muted-foreground">{i.instructions}</p>
        <div class="mt-5 flex items-center justify-between">
          <span class="text-sm text-muted-foreground">{i.interviewCount} interview{i.interviewCount === 1 ? '' : 's'}</span>
          <Button href="/dashboard/interviews/new?interviewer={i.id}" variant="outline" size="sm"><Mic /> Interview</Button>
        </div>
      </article>
    {/each}
  </div>
{:else}
  <div class="mt-8 grid place-items-center rounded-3xl border bg-card px-6 py-16 text-center">
    <h2 class="text-lg font-semibold">No interviewers yet</h2>
    <p class="mt-1 max-w-sm text-muted-foreground">Pick a template when you start an interview, or write your own brief.</p>
    <div class="mt-6 flex gap-2">
      <Button href="/dashboard/interviews/new">Use a template</Button>
      <Button href="/dashboard/interviewers/new" variant="outline">Write your own</Button>
    </div>
  </div>
{/if}
