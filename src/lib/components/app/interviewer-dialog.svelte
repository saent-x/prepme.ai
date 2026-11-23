<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Segmented } from '$lib/components/ui/segmented';
  import { Chips } from '$lib/components/ui/chips';
  import InterviewerAvatar from './interviewer-avatar.svelte';
  import { VOICES } from '$lib/templates';
  import { composeBrief, FOCUS_AREAS, STYLES, type FocusId, type StyleId } from '$lib/interviewer-brief';
  import { ChevronRight, LoaderCircle } from '@lucide/svelte';
  import { untrack } from 'svelte';

  let { open = $bindable(false), job: presetJob = '' }: { open?: boolean; job?: string } = $props();

  let name = $state('');
  let role = $state(untrack(() => presetJob));
  let job = $state('');
  let style = $state<StyleId>('realistic');
  let focus = $state<string[]>(['experience', 'scenarios']);
  let voice = $state<string>('marin');
  let own = $state(false);
  let ownBrief = $state('');
  let error = $state<string | null>(null);
  let busy = $state<'create' | 'start' | null>(null);

  const brief = $derived(own ? ownBrief : composeBrief({ role, job, style, focus: focus as FocusId[] }));

  function writeOwn() {
    ownBrief = composeBrief({ role, job, style, focus: focus as FocusId[] });
    own = true;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="max-h-[calc(100svh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-[480px]">
    <Dialog.Header class="flex h-[52px] justify-center border-b px-6">
      <Dialog.Title class="text-xl font-extrabold tracking-[-0.01em]">New agent</Dialog.Title>
      <Dialog.Description class="sr-only">Describe who should interview you.</Dialog.Description>
    </Dialog.Header>

    <form
      method="POST"
      action="/dashboard/interviewers/new"
      use:enhance={({ submitter, cancel }) => {
        error = null;
        if (!own && !role.trim() && !job.trim()) {
          error = 'Give the agent a role, e.g. Design manager.';
          cancel();
          return;
        }
        busy = submitter?.getAttribute('value') === 'start' ? 'start' : 'create';
        return async ({ result }) => {
          if (result.type === 'failure') {
            error = String(result.data?.error ?? 'Check the form');
            busy = null;
            return;
          }
          await applyAction(result);
          busy = null;
          open = false;
        };
      }}
    >
      <div class="grid gap-5 p-6">
        <div class="flex items-center gap-4">
          {#key name}<InterviewerAvatar name={name || 'new agent'} class="size-16 animate-pop" />{/key}
          <div class="min-w-0">
            <div class="truncate text-base font-extrabold">{name || 'Your agent'}</div>
            <div class="text-xs text-muted-foreground">Face made from the name</div>
          </div>
        </div>

        <div class="grid gap-2">
          <Label for="iv-name" class="text-xs font-bold">Name</Label>
          <Input id="iv-name" name="name" bind:value={name} placeholder="e.g. Lea" autocomplete="off" />
        </div>

        {#if !own}
          <div class="grid gap-2">
            <Label for="iv-job" class="text-xs font-bold">Role</Label>
            <Input id="iv-job" bind:value={job} placeholder="e.g. Design manager" autocomplete="off" />
          </div>
          <div class="grid gap-2">
            <Label for="iv-role" class="text-xs font-bold">Interviews you for <span class="font-normal text-muted-foreground">(optional)</span></Label>
            <Input id="iv-role" bind:value={role} placeholder="e.g. Staff Nurse, A&E" autocomplete="off" />
          </div>
          <div class="grid gap-2">
            <span class="text-xs font-bold">Style</span>
            <Segmented bind:value={style} aria-label="Style" options={STYLES.map((x) => ({ value: x.id, label: x.label }))} />
          </div>
        {:else}
          <div class="grid gap-2">
            <Label for="iv-brief" class="text-xs font-bold">Brief</Label>
            <Textarea id="iv-brief" bind:value={ownBrief} rows={7} placeholder="Who the interviewer is, which job this is for, what to cover and how hard to push." />
          </div>
        {/if}

        <details class="group">
          <summary class="flex w-fit cursor-pointer list-none items-center gap-1 text-[13px] font-semibold text-muted-foreground hover:text-foreground">
            <ChevronRight class="size-4 transition-transform group-open:rotate-90" strokeWidth={1.6} /> More options
          </summary>
          <div class="mt-3 grid gap-4">
            {#if !own}
              <div class="grid gap-2">
                <span class="text-xs font-bold">Focus on</span>
                <Chips multiple bind:value={focus} aria-label="Focus on" options={FOCUS_AREAS.map((x) => ({ value: x.id, label: x.label }))} />
              </div>
            {/if}
            <div class="grid gap-2">
              <span class="text-xs font-bold">Voice</span>
              <Chips bind:value={() => [voice], (v) => (voice = v[0] ?? voice)} aria-label="Voice" options={VOICES.map((x) => ({ value: x.id, label: x.label, title: x.note }))} />
            </div>
            {#if !own}
              <button type="button" class="w-fit text-[13px] font-semibold text-muted-foreground hover:text-foreground" onclick={writeOwn}>Write the brief yourself</button>
            {/if}
          </div>
        </details>

        <input type="hidden" name="instructions" value={brief} />
        <input type="hidden" name="voice" value={voice} />
        <input type="hidden" name="template" value="" />
        {#if error}<p class="rounded-[8px] bg-destructive-soft px-3 py-2 text-sm text-destructive">{error}</p>{/if}
      </div>

      <div class="flex items-center justify-end gap-2 border-t px-6 py-4">
        <Button type="button" variant="outline" onclick={() => (open = false)}>Cancel</Button>
        <Button type="submit" name="then" value="list" disabled={busy !== null}>
          {#if busy === 'create'}<LoaderCircle class="animate-spin" />{/if}Create
        </Button>
      </div>
    </form>
  </Dialog.Content>
</Dialog.Root>
