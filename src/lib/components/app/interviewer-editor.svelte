<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { TEMPLATES, VOICES } from '$lib/templates';
  import { LoaderCircle } from '@lucide/svelte';
  import { untrack } from 'svelte';

  type Values = { name: string; instructions: string; voice: string; template: string | null };
  let {
    values,
    error,
    submitLabel,
    showTemplates = false,
    action
  }: { values: Values; error?: string | null; submitLabel: string; showTemplates?: boolean; action?: string } = $props();

  // The form owns its fields after mount; `values` only seeds them.
  const seed = untrack(() => values);
  let name = $state(seed.name);
  let instructions = $state(seed.instructions);
  let voice = $state(seed.voice);
  let template = $state(seed.template);
  let busy = $state(false);

  function useTemplate(id: string) {
    const t = TEMPLATES.find((x) => x.id === id)!;
    name = t.name;
    instructions = t.instructions;
    voice = t.voice;
    template = t.id;
  }

</script>

<form
  method="POST"
  {action}
  class="grid gap-8 lg:grid-cols-[1fr_300px]"
  use:enhance={() => {
    busy = true;
    return async ({ update }) => {
      await update({ reset: false });
      busy = false;
    };
  }}
>
  <div class="grid gap-6">
    {#if showTemplates}
      <div>
        <div class="text-sm font-medium">Start from a template</div>
        <div class="mt-2 flex flex-wrap gap-2">
          {#each TEMPLATES as t}
            <button
              type="button"
              class="rounded-full border px-3.5 py-1.5 text-sm transition-colors hover:bg-accent aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background"
              aria-pressed={template === t.id}
              onclick={() => useTemplate(t.id)}>{t.name}</button
            >
          {/each}
        </div>
      </div>
    {/if}
    <input type="hidden" name="template" value={template ?? ''} />
    <div class="grid gap-1.5">
      <Label for="name">Name</Label>
      <Input id="name" name="name" bind:value={name} class="h-11" placeholder="e.g. Fintech backend lead" />
    </div>
    <div class="grid gap-1.5">
      <Label for="instructions">Interview brief</Label>
      <Textarea
        id="instructions"
        name="instructions"
        bind:value={instructions}
        rows={12}
        placeholder="Who is the interviewer, what role is this for, which topics to cover and in what order, how hard to push on follow-ups."
      />
      <p class="text-xs text-muted-foreground">Write it like a briefing to a colleague. Pacing, one question at a time and the wrap-up are handled for you.</p>
    </div>
  </div>

  <aside class="h-fit rounded-3xl border bg-card p-6">
    <div class="text-sm font-medium">Voice</div>
    <input type="hidden" name="voice" value={voice} />
    <div class="mt-3 grid gap-2" role="radiogroup" aria-label="Voice">
      {#each VOICES as v}
        <button
          type="button"
          role="radio"
          aria-checked={voice === v.id}
          onclick={() => (voice = v.id)}
          class="flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-accent aria-checked:border-foreground aria-checked:ring-1 aria-checked:ring-foreground"
        >
          <span class="font-medium">{v.label}</span><span class="text-muted-foreground">{v.note}</span>
        </button>
      {/each}
    </div>
    {#if error}<p class="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>{/if}
    <Button type="submit" size="lg" class="mt-6 w-full" disabled={busy}>
      {#if busy}<LoaderCircle class="animate-spin" />{/if}{submitLabel}
    </Button>
  </aside>
</form>
