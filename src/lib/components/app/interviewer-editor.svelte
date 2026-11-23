<script lang="ts">
  import { Chips } from '$lib/components/ui/chips';
  import { enhance } from '$app/forms';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import InterviewerAvatar from './interviewer-avatar.svelte';
  import { VOICES } from '$lib/templates';
  import { LoaderCircle } from '@lucide/svelte';
  import { untrack } from 'svelte';

  type Values = { name: string; instructions: string; voice: string; template: string | null };
  let {
    values,
    error,
    submitLabel,
    action
  }: { values: Values; error?: string | null; submitLabel: string; action?: string } = $props();

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
  class="grid gap-4 rounded-xl border bg-card px-5 py-4"
  use:enhance={() => {
    busy = true;
    return async ({ update }) => {
      await update({ reset: false });
      busy = false;
    };
  }}
>
  <input type="hidden" name="template" value={template ?? ''} />
  <div class="flex items-center gap-3.5">
    <InterviewerAvatar name={name || 'new interviewer'} size="lg" />
    <div class="grid flex-1 gap-1.5">
      <Label for="name">Name</Label>
      <Input id="name" name="name" bind:value={name} />
    </div>
  </div>
  <div class="grid gap-1.5">
    <Label for="instructions">Brief</Label>
    <Textarea
      id="instructions"
      name="instructions"
      bind:value={instructions}
      rows={8}
      placeholder="Who the interviewer is, which job this is for, what to cover and how hard to push."
    />
    <p class="text-xs text-faint">Pacing, one question at a time and the wrap-up are handled for you.</p>
  </div>
  <div class="grid gap-1.5">
    <span class="text-sm font-medium">Voice</span>
    <input type="hidden" name="voice" value={voice} />
    <Chips bind:value={() => [voice], (v) => (voice = v[0] ?? voice)} aria-label="Voice" options={VOICES.map((x) => ({ value: x.id, label: x.label, title: x.note }))} />
  </div>
  {#if error}<p class="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>{/if}
  <div class="flex justify-end border-t pt-3">
    <Button type="submit" disabled={busy}>
      {#if busy}<LoaderCircle class="animate-spin" />{/if}{submitLabel}
    </Button>
  </div>
</form>
