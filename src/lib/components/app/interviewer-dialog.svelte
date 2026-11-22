<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import * as Dialog from '$lib/components/ui/dialog';
  import InterviewerAvatar from './interviewer-avatar.svelte';
  import { VOICES } from '$lib/templates';
  import { composeBrief, FOCUS_AREAS, STYLES, type FocusId, type StyleId } from '$lib/interviewer-brief';
  import { LoaderCircle } from '@lucide/svelte';
  import { untrack } from 'svelte';

  let { open = $bindable(false), job: presetJob = '' }: { open?: boolean; job?: string } = $props();

  let name = $state('');
  let role = $state(untrack(() => presetJob));
  let job = $state('');
  let style = $state<StyleId>('realistic');
  let focus = $state<FocusId[]>(['experience', 'scenarios']);
  let voice = $state<string>('marin');
  let own = $state(false);
  let ownBrief = $state('');
  let error = $state<string | null>(null);
  let busy = $state<'create' | 'start' | null>(null);

  const brief = $derived(own ? ownBrief : composeBrief({ role, job, style, focus }));
  const toggle = (id: FocusId) => (focus = focus.includes(id) ? focus.filter((f) => f !== id) : [...focus, id]);

  function writeOwn() {
    ownBrief = composeBrief({ role, job, style, focus });
    own = true;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="max-h-[calc(100svh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-[540px]">
    <Dialog.Header class="border-b px-5 py-3.5">
      <Dialog.Title class="text-base font-bold">New agent</Dialog.Title>
      <Dialog.Description class="sr-only">Describe who should interview you.</Dialog.Description>
    </Dialog.Header>

    <form
      method="POST"
      action="/dashboard/interviewers/new"
      use:enhance={({ submitter, cancel }) => {
        error = null;
        if (!own && !role.trim()) {
          error = 'Say which job this agent interviews you for.';
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
      <div class="grid gap-4 px-5 py-4">
        <div class="flex items-center gap-3.5">
          <InterviewerAvatar name={name || 'new agent'} size="xl" />
          <div class="grid flex-1 gap-1.5">
            <Label for="iv-name">Name</Label>
            <Input id="iv-name" name="name" bind:value={name} placeholder="e.g. Pip" autocomplete="off" />
            <p class="text-xs text-faint">The avatar is made from the name. Change the name to get a new one.</p>
          </div>
        </div>

        {#if !own}
          <div class="grid gap-1.5">
            <Label for="iv-role">Interviewing you for</Label>
            <Input id="iv-role" bind:value={role} placeholder="e.g. Staff Nurse, A&E at St Thomas'" autocomplete="off" />
          </div>
          <div class="grid gap-1.5">
            <Label for="iv-job">Their job <span class="font-normal text-faint">(optional)</span></Label>
            <Input id="iv-job" bind:value={job} placeholder="e.g. Ward manager" autocomplete="off" />
          </div>

          <div class="grid gap-1.5">
            <span class="text-sm font-medium">Style</span>
            <div class="grid grid-cols-3 rounded-lg bg-muted p-[3px]" role="radiogroup" aria-label="Style">
              {#each STYLES as s}
                <button
                  type="button"
                  role="radio"
                  aria-checked={style === s.id}
                  onclick={() => (style = s.id)}
                  class="rounded-md py-1.5 text-[13px] font-semibold text-muted-foreground transition-colors aria-checked:bg-card aria-checked:text-foreground aria-checked:shadow-xs"
                  >{s.label}</button
                >
              {/each}
            </div>
          </div>

          <div class="grid gap-1.5">
            <span class="text-sm font-medium">Focus on</span>
            <div class="flex flex-wrap gap-1.5">
              {#each FOCUS_AREAS as a}
                <button
                  type="button"
                  aria-pressed={focus.includes(a.id)}
                  onclick={() => toggle(a.id)}
                  class="rounded-md border px-2.5 py-1 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground aria-pressed:border-primary aria-pressed:bg-signal-soft aria-pressed:text-primary"
                  >{a.label}</button
                >
              {/each}
            </div>
          </div>
        {:else}
          <div class="grid gap-1.5">
            <Label for="iv-brief">Brief</Label>
            <Textarea id="iv-brief" bind:value={ownBrief} rows={7} placeholder="Who the interviewer is, which job this is for, what to cover and how hard to push." />
          </div>
        {/if}

        <div class="grid gap-1.5">
          <span class="text-sm font-medium">Voice</span>
          <div class="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Voice">
            {#each VOICES as v}
              <button
                type="button"
                role="radio"
                aria-checked={voice === v.id}
                title={v.note}
                onclick={() => (voice = v.id)}
                class="rounded-md border px-2.5 py-1 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground aria-checked:border-primary aria-checked:bg-signal-soft aria-checked:text-primary"
                >{v.label}</button
              >
            {/each}
          </div>
        </div>

        <input type="hidden" name="instructions" value={brief} />
        <input type="hidden" name="voice" value={voice} />
        <input type="hidden" name="template" value="" />

        {#if !own}
          <button type="button" class="w-fit text-[13px] font-semibold underline decoration-input underline-offset-4 hover:decoration-foreground" onclick={writeOwn}>Write the brief yourself</button>
        {/if}
        {#if error}<p class="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>{/if}
      </div>

      <div class="flex items-center justify-end gap-2 border-t px-5 py-3">
        <Button type="button" variant="ghost" class="mr-auto" onclick={() => (open = false)}>Cancel</Button>
        <Button type="submit" name="then" value="list" variant="outline" disabled={busy !== null}>
          {#if busy === 'create'}<LoaderCircle class="animate-spin" />{/if}Create
        </Button>
        <Button type="submit" name="then" value="start" disabled={busy !== null}>
          {#if busy === 'start'}<LoaderCircle class="animate-spin" />{/if}Create and start
        </Button>
      </div>
    </form>
  </Dialog.Content>
</Dialog.Root>
