<script lang="ts">
  import { enhance } from '$app/forms';
  import { format } from 'date-fns';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import * as Dialog from '$lib/components/ui/dialog';
  import EmptyState from '$lib/components/app/empty-state.svelte';
  import ScoreChip from '$lib/components/app/score-chip.svelte';
  import { MAX_STORY_CHARS, STORY_SCORE, type Story } from '$lib/bank';
  import { jobName } from '$lib/jobs';
  import { Briefcase, ChevronDown, LoaderCircle, Pencil, Trash2 } from '$lib/icons';

  let { data } = $props();

  let editing = $state<Story | null>(null);
  let removing = $state<Story | null>(null);
  let busy = $state(false);
  let error = $state<string | null>(null);

  /** Closes a pop-up when its form saved, and shows the message when it did not. */
  const submit = (close: () => void) => () => {
    busy = true;
    error = null;
    return async ({ result, update }: { result: { type: string; data?: Record<string, unknown> }; update: () => Promise<void> }) => {
      await update();
      busy = false;
      if (result.type === 'failure') error = String(result.data?.error ?? 'Check the story');
      else close();
    };
  };
</script>

<svelte:head><title>Stories · PrepMe</title></svelte:head>

<div class="flex h-10 items-center justify-between gap-4">
  <h1 class="page-title">Stories</h1>
</div>

{#if data.stories.length}
  <p class="mt-1 text-sm text-muted-foreground">Your strongest answers, kept to reuse for any job. Strongest first.</p>
  <ul class="stagger mt-6 border-t" aria-label="Your stories">
    {#each data.stories as s (s.id)}
      <li class="border-b">
        <details class="group">
          <summary class="flex min-h-16 cursor-pointer list-none items-center gap-3 py-3">
            <span class="w-8 shrink-0 text-center"><ScoreChip score={s.score} /></span>
            <span class="min-w-0 flex-1">
              <b class="block truncate text-sm font-semibold">{s.title}</b>
              <span class="block truncate text-xs text-muted-foreground">“{s.question}”</span>
            </span>
            <span class="hidden shrink-0 text-xs text-muted-foreground sm:block">{format(s.createdAt, 'd MMM')}</span>
            <ChevronDown class="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div class="grid gap-3 pb-4 pl-11 text-sm leading-normal">
            <p class="max-w-3xl whitespace-pre-wrap">{s.text}</p>
            <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
              {#if s.job}
                <a href="/dashboard/jobs/{s.job.id}" class="link inline-flex items-center gap-1.5 font-normal"><Briefcase class="size-3.5" />{jobName(s.job)}</a>
              {/if}
              <button type="button" class="inline-flex items-center gap-1.5 font-semibold text-muted-foreground hover:text-foreground" onclick={() => ((error = null), (editing = s))}>
                <Pencil class="size-3.5" /> Edit
              </button>
              <button type="button" class="inline-flex items-center gap-1.5 font-semibold text-muted-foreground hover:text-destructive" onclick={() => (removing = s)}>
                <Trash2 class="size-3.5" /> Remove
              </button>
            </div>
          </div>
        </details>
      </li>
    {/each}
  </ul>
{:else}
  <EmptyState title="Keep your best answers as stories" class="mt-10">
    When a redo or a question bank answer scores {STORY_SCORE} or more, you can keep it here to reuse for any job.
    {#snippet action()}<Button href="/dashboard/jobs">Go to your jobs</Button>{/snippet}
  </EmptyState>
{/if}

<Dialog.Root open={!!editing} onOpenChange={(o) => !o && (editing = null)}>
  <Dialog.Content class="gap-0 p-0 sm:max-w-[560px]">
    <Dialog.Header class="flex h-[52px] justify-center border-b px-6">
      <Dialog.Title class="text-xl font-extrabold tracking-[-0.01em]">Edit story</Dialog.Title>
      <Dialog.Description class="sr-only">Change the story's name or tidy its words.</Dialog.Description>
    </Dialog.Header>
    {#if editing}
      <form method="POST" action="?/update" use:enhance={submit(() => (editing = null))}>
        <input type="hidden" name="id" value={editing.id} />
        <div class="grid gap-5 p-6">
          <div class="grid gap-2">
            <Label for="story-title" class="text-xs font-bold">Name</Label>
            <Input id="story-title" name="title" value={editing.title} maxlength={80} required autocomplete="off" />
          </div>
          <div class="grid gap-2">
            <Label for="story-text" class="text-xs font-bold">The story</Label>
            <Textarea id="story-text" name="text" value={editing.text} rows={10} maxlength={MAX_STORY_CHARS} required />
          </div>
          {#if error}<p class="rounded-[8px] bg-destructive-soft px-3 py-2 text-sm text-destructive" role="alert">{error}</p>{/if}
        </div>
        <div class="flex justify-end gap-2 border-t px-6 py-4">
          <Button type="button" variant="outline" onclick={() => (editing = null)}>Cancel</Button>
          <Button type="submit" disabled={busy}>{#if busy}<LoaderCircle class="animate-spin" />{/if}Save</Button>
        </div>
      </form>
    {/if}
  </Dialog.Content>
</Dialog.Root>

<AlertDialog.Root open={!!removing} onOpenChange={(o) => !o && (removing = null)}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Remove this story?</AlertDialog.Title>
      <AlertDialog.Description>“{removing?.title}” will be removed from your stories. The answer it came from stays where it is.</AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Close>Cancel</AlertDialog.Close>
      <form method="POST" action="?/delete" use:enhance={submit(() => (removing = null))}>
        <input type="hidden" name="id" value={removing?.id} />
        <Button type="submit" variant="destructive" disabled={busy}>Remove</Button>
      </form>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
