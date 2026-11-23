<script lang="ts">
  import { enhance } from '$app/forms';
  import { toast } from '$lib/components/ui/toast';
  import { Button } from '$lib/components/ui/button';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import InterviewerEditor from '$lib/components/app/interviewer-editor.svelte';
  import InterviewerAvatar from '$lib/components/app/interviewer-avatar.svelte';
  import InterviewHead from '$lib/components/app/interview-head.svelte';
  import InterviewRow from '$lib/components/app/interview-row.svelte';
  import { Mic, Trash2 } from '@lucide/svelte';

  let { data, form } = $props();
  let confirmDelete = $state(false);

  $effect(() => {
    if (form?.saved) toast.success('Agent saved');
  });
</script>

<svelte:head><title>{data.interviewer.name} · PrepMe</title></svelte:head>

<a href="/dashboard/interviewers" class="text-[13px] text-muted-foreground hover:text-foreground">← Agents</a>
<header class="mt-2 mb-4 flex flex-wrap items-center justify-between gap-4">
  <div class="flex items-center gap-3">
    <InterviewerAvatar name={data.interviewer.name} size="lg" />
    <div>
      <h1 class="text-xl font-bold tracking-tight">{data.interviewer.name}</h1>
      <p class="text-[13px] text-muted-foreground">{data.total} interview{data.total === 1 ? '' : 's'}</p>
    </div>
  </div>
  <div class="flex gap-2">
    <Button href="/dashboard/interviews/new?interviewer={data.interviewer.id}" ><Mic /> Start interview</Button>
    <Button variant="outline" size="icon" aria-label="Delete agent" onclick={() => (confirmDelete = true)}><Trash2 /></Button>
  </div>
</header>

{#key data.interviewer.updatedAt}
  <InterviewerEditor
      action="?/update"
      values={{ name: data.interviewer.name, instructions: data.interviewer.instructions, voice: data.interviewer.voice, template: data.interviewer.template }}
      error={form?.error}
      submitLabel="Save changes"
    />
{/key}

{#if data.recent.length}
  <section class="mt-4 overflow-hidden rounded-xl border bg-card">
    <h2 class="px-4 pt-3.5 pb-2.5 text-sm font-bold">Interviews with {data.interviewer.name}</h2>
    <InterviewHead />
    {#each data.recent as row (row.id)}<InterviewRow {row} />{/each}
  </section>
{/if}

<AlertDialog.Root bind:open={confirmDelete}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Delete {data.interviewer.name}?</AlertDialog.Title>
      <AlertDialog.Description>This also deletes its {data.total} interview{data.total === 1 ? '' : 's'} and their feedback. This can't be undone.</AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Close>Cancel</AlertDialog.Close>
      <form method="POST" action="?/delete" use:enhance><Button type="submit" variant="destructive">Delete</Button></form>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
