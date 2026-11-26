<script lang="ts">
  import { enhance } from '$app/forms';
  import { toast } from '$lib/components/ui/toast';
  import { Button } from '$lib/components/ui/button';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import InterviewerEditor from '$lib/components/app/interviewer-editor.svelte';
  import InterviewerAvatar from '$lib/components/app/interviewer-avatar.svelte';
  import InterviewHead from '$lib/components/app/interview-head.svelte';
  import InterviewRow from '$lib/components/app/interview-row.svelte';
  import { agentBlurb, agentRole, agentStyle } from '$lib/interviewer-brief';
  import { VOICES } from '$lib/templates';
  import { interviewerFace } from '$lib/avatars';
  import { Mic, Pencil, Trash2 } from '$lib/icons';

  let { data, form } = $props();
  let confirmDelete = $state(false);
  let editing = $state(false);

  const a = $derived(data.interviewer);
  const role = $derived(agentRole(a.instructions) ?? agentBlurb(a.instructions));
  const style = $derived(agentStyle(a.instructions));
  const voice = $derived(VOICES.find((v) => v.id === a.voice));

  $effect(() => {
    if (form?.saved) {
      toast.success('Agent saved');
      editing = false;
    }
  });
</script>

<svelte:head><title>{a.name} · PrepMe</title></svelte:head>

<nav class="text-sm font-semibold text-muted-foreground" aria-label="Breadcrumb">
  <a href="/dashboard/interviewers" class="hover:text-foreground">Agents</a> /
</nav>
<header class="mt-3 flex flex-wrap items-center justify-between gap-4">
  <div class="flex min-w-0 items-center gap-4">
    <InterviewerAvatar name={a.name} class="size-16 animate-pop" />
    <div class="min-w-0">
      <h1 class="page-title truncate">{a.name}</h1>
      <p class="mt-0.5 truncate text-sm text-muted-foreground">
        {[role, style, `${data.total} interview${data.total === 1 ? '' : 's'}`].filter(Boolean).join(' · ')}
      </p>
    </div>
  </div>
  <div class="flex gap-2">
    <Button href="/dashboard/interviews/new?interviewer={a.id}"><Mic /> Start interview</Button>
    {#if !editing}<Button variant="outline" onclick={() => (editing = true)}><Pencil /> Edit</Button>{/if}
    <Button
      variant="outline"
      size="icon"
      class="text-destructive hover:border-destructive/40 hover:bg-destructive-soft hover:text-destructive"
      aria-label="Delete agent"
      title="Delete agent"
      onclick={() => (confirmDelete = true)}><Trash2 /></Button
    >
  </div>
</header>

{#if editing}
  <section class="mt-8 max-w-[720px] animate-rise" aria-label="Edit agent">
    {#key a.updatedAt}
      <InterviewerEditor
        action="?/update"
        values={{ name: a.name, instructions: a.instructions, voice: a.voice, template: a.template }}
        error={form?.error}
        submitLabel="Save changes"
        oncancel={() => (editing = false)}
      />
    {/key}
  </section>
{:else}
  <div class="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
    <section aria-label="Brief" class="min-w-0">
      <h2 class="section-title">Brief</h2>
      <p class="mt-3 max-w-[72ch] text-sm leading-normal whitespace-pre-line">{a.instructions}</p>
      <p class="mt-3 text-xs text-muted-foreground">Pacing, one question at a time and the wrap-up are handled for you.</p>
    </section>
    <aside aria-label="Details">
      <h2 class="section-title">Details</h2>
      <dl class="mt-2 border-t text-sm">
        <div class="flex h-12 items-center justify-between gap-4 border-b px-3">
          <dt class="text-muted-foreground">Voice</dt>
          <dd class="flex items-center gap-2 font-bold">
            <img src={interviewerFace(`voice ${a.voice}`)} alt="" class="size-6 rounded-full" />{voice?.label ?? a.voice}
            {#if voice}<span class="font-normal text-muted-foreground">{voice.note}</span>{/if}
          </dd>
        </div>
        {#if style}
          <div class="flex h-12 items-center justify-between gap-4 border-b px-3">
            <dt class="text-muted-foreground">Style</dt>
            <dd>{style}</dd>
          </div>
        {/if}
        <div class="flex h-12 items-center justify-between gap-4 border-b px-3">
          <dt class="text-muted-foreground">Interviews</dt>
          <dd class="tabular font-bold">{data.total}</dd>
        </div>
      </dl>
    </aside>
  </div>
{/if}

<section class="mt-10" aria-label="Interviews with {a.name}">
  <h2 class="section-title">Interviews with {a.name}</h2>
  <div class="mt-2">
    {#if data.recent.length}
      <InterviewHead cols="agent" />
      <div class="stagger">
        {#each data.recent as row (row.id)}<InterviewRow {row} cols="agent" />{/each}
      </div>
    {:else}
      <p class="border-y px-3 py-4 text-sm text-muted-foreground">No interviews with {a.name} yet.</p>
    {/if}
  </div>
</section>

<AlertDialog.Root bind:open={confirmDelete}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Delete {a.name}?</AlertDialog.Title>
      <AlertDialog.Description>This also deletes its {data.total} interview{data.total === 1 ? '' : 's'} and their feedback. This can't be undone.</AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Close>Cancel</AlertDialog.Close>
      <form method="POST" action="?/delete" use:enhance><Button type="submit" variant="destructive"><Trash2 /> Delete</Button></form>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
