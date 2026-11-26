<script lang="ts">
  import { Chips } from '$lib/components/ui/chips';
  import { enhance } from '$app/forms';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import InterviewerAvatar from './interviewer-avatar.svelte';
  import { interviewerFace } from '$lib/avatars';
  import { voiceOptions } from '$lib/templates';
  import { LoaderCircle } from '$lib/icons';
  import { untrack } from 'svelte';

  type Values = { name: string; instructions: string; voice: string; template: string | null };
  let {
    values,
    error,
    submitLabel,
    action,
    oncancel
  }: { values: Values; error?: string | null; submitLabel: string; action?: string; oncancel?: () => void } = $props();

  // The form owns its fields after mount; `values` only seeds them.
  const seed = untrack(() => values);
  let name = $state(seed.name);
  let instructions = $state(seed.instructions);
  let voice = $state(seed.voice);
  const template = seed.template;
  let busy = $state(false);
</script>

<form
  method="POST"
  {action}
  class="grid gap-5"
  use:enhance={() => {
    busy = true;
    return async ({ update }) => {
      await update({ reset: false });
      busy = false;
    };
  }}
>
  <input type="hidden" name="template" value={template ?? ''} />
  <div class="flex items-end gap-4">
    {#key name.trim().toLowerCase()}<InterviewerAvatar name={name || 'new interviewer'} class="size-10 animate-pop" />{/key}
    <div class="grid flex-1 gap-2">
      <Label for="name" class="text-xs font-bold">Name</Label>
      <Input id="name" name="name" bind:value={name} autocomplete="off" />
    </div>
  </div>
  <div class="grid gap-2">
    <Label for="instructions" class="text-xs font-bold">Brief</Label>
    <Textarea
      id="instructions"
      name="instructions"
      bind:value={instructions}
      rows={8}
      class="leading-normal"
      placeholder="Who the interviewer is, which job this is for, what to cover and how hard to push."
    />
    <p class="text-xs text-muted-foreground">Pacing, one question at a time and the wrap-up are handled for you.</p>
  </div>
  <div class="grid gap-2">
    <span class="text-xs font-bold">Voice</span>
    <input type="hidden" name="voice" value={voice} />
    <Chips bind:value={() => [voice], (v) => (voice = v[0] ?? voice)} aria-label="Voice" options={voiceOptions(interviewerFace)} />
  </div>
  {#if error}<p class="rounded-[8px] bg-destructive-soft px-3 py-2 text-sm text-destructive">{error}</p>{/if}
  <div class="flex justify-end gap-2 border-t pt-4">
    {#if oncancel}<Button type="button" variant="outline" onclick={oncancel}>Cancel</Button>{/if}
    <Button type="submit" disabled={busy}>
      {#if busy}<LoaderCircle class="animate-spin" />{/if}{submitLabel}
    </Button>
  </div>
</form>
