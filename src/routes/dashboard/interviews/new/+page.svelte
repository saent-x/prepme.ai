<script lang="ts">
  import { untrack } from 'svelte';
  import { enhance } from '$app/forms';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import InterviewerAvatar from '$lib/components/app/interviewer-avatar.svelte';
  import { DURATIONS, TEMPLATES } from '$lib/templates';
  import { Check, LoaderCircle, Mic } from '@lucide/svelte';

  let { data, form } = $props();

  // Templates the user hasn't turned into an interviewer yet.
  const usedTemplates = $derived(new Set(data.interviewers.map((i) => i.template).filter(Boolean)));
  const freshTemplates = $derived(TEMPLATES.filter((t) => !usedTemplates.has(t.id)));

  function initialChoice() {
    if (data.preset.interviewer && data.interviewers.some((i) => i.id === data.preset.interviewer)) return data.preset.interviewer;
    if (data.preset.template) {
      const own = data.interviewers.find((i) => i.template === data.preset.template);
      return own ? own.id : `template:${data.preset.template}`;
    }
    return data.interviewers[0]?.id ?? `template:${TEMPLATES[0].id}`;
  }
  let choice = $state(untrack(initialChoice));
  let duration = $state(untrack(() => Math.min(20, data.maxMinutes)));
  let busy = $state(false);
  let showJd = $state(false);
</script>

<svelte:head><title>New interview · PrepMe</title></svelte:head>

<p class="eyebrow">New interview</p>
<h1 class="mt-2 text-3xl font-semibold tracking-tight">Set the scene</h1>
<p class="mt-2 max-w-xl text-muted-foreground">Choose who interviews you and, if you have one, paste the job description. Everything else is optional.</p>

<form
  method="POST"
  class="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]"
  use:enhance={() => {
    busy = true;
    return async ({ update }) => {
      await update();
      busy = false;
    };
  }}
>
  <div class="grid gap-10">
    <fieldset>
      <legend class="text-lg font-semibold">1. Interviewer</legend>
      <input type="hidden" name="interviewer" value={choice} />
      <div class="mt-4 grid gap-3 sm:grid-cols-2">
        {#each data.interviewers as i (i.id)}
          <button
            type="button"
            onclick={() => (choice = i.id)}
            aria-pressed={choice === i.id}
            class="relative flex items-center gap-3 rounded-2xl border bg-card p-4 text-left transition-all hover:border-foreground/25 aria-pressed:border-foreground aria-pressed:ring-1 aria-pressed:ring-foreground"
          >
            <InterviewerAvatar name={i.name} />
            <span class="min-w-0">
              <span class="block truncate font-medium">{i.name}</span>
              <span class="block text-xs text-muted-foreground">Your interviewer</span>
            </span>
            {#if choice === i.id}<Check class="absolute top-3 right-3 size-4" />{/if}
          </button>
        {/each}
        {#each freshTemplates as t (t.id)}
          <button
            type="button"
            onclick={() => (choice = `template:${t.id}`)}
            aria-pressed={choice === `template:${t.id}`}
            class="relative rounded-2xl border border-dashed bg-card/50 p-4 text-left transition-all hover:border-foreground/25 aria-pressed:border-solid aria-pressed:border-foreground aria-pressed:ring-1 aria-pressed:ring-foreground"
          >
            <span class="eyebrow">{t.category} template</span>
            <span class="mt-1.5 block font-medium">{t.name}</span>
            <span class="mt-0.5 block text-sm text-muted-foreground">{t.tagline}</span>
            {#if choice === `template:${t.id}`}<Check class="absolute top-3 right-3 size-4" />{/if}
          </button>
        {/each}
      </div>
      <a href="/dashboard/interviewers/new" class="mt-3 inline-block text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">Write your own interviewer</a>
    </fieldset>

    <fieldset>
      <legend class="text-lg font-semibold">2. The role <span class="font-normal text-muted-foreground">(optional)</span></legend>
      {#if showJd || form?.values?.jobDescription}
        <Textarea
          name="jobDescription"
          rows={8}
          class="mt-4"
          placeholder="Paste the job description. The interviewer will ask about what this role needs."
          value={String(form?.values?.jobDescription ?? '')}
        />
      {:else}
        <button
          type="button"
          class="mt-4 w-full rounded-2xl border border-dashed p-6 text-left text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          onclick={() => (showJd = true)}
        >
          + Paste a job description to tailor the questions
        </button>
      {/if}
      <div class="mt-4 grid gap-1.5">
        <Label for="focus">Anything to focus on?</Label>
        <Input id="focus" name="focus" placeholder="e.g. system design, leadership stories, salary negotiation" value={String(form?.values?.focus ?? data.preset.focus)} class="h-11" />
      </div>
    </fieldset>
  </div>

  <aside class="h-fit rounded-3xl border bg-card p-6 lg:sticky lg:top-10">
    <h2 class="text-lg font-semibold">3. Length</h2>
    <input type="hidden" name="durationMinutes" value={duration} />
    <div class="mt-4 grid grid-cols-5 gap-1.5">
      {#each DURATIONS as d}
        <button
          type="button"
          disabled={d > data.maxMinutes}
          aria-pressed={duration === d}
          onclick={() => (duration = d)}
          class="rounded-xl border py-2.5 font-mono text-sm transition-colors disabled:opacity-35 aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background"
        >
          {d}
        </button>
      {/each}
    </div>
    <p class="mt-2 text-xs text-muted-foreground">
      minutes{data.maxMinutes < 45 ? ` · up to ${data.maxMinutes} on the free plan` : ''}
    </p>

    <div class="mt-6 grid gap-1.5">
      <Label for="name">Name <span class="text-muted-foreground">(optional)</span></Label>
      <Input id="name" name="name" placeholder="e.g. Monzo onsite prep" value={String(form?.values?.name ?? '')} class="h-11" />
    </div>

    {#if form?.error}
      <p class="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{form.error}</p>
    {/if}

    <Button type="submit" variant="signal" size="xl" class="mt-6 w-full" disabled={busy}>
      {#if busy}<LoaderCircle class="animate-spin" />{:else}<Mic />{/if}
      Go to the interview room
    </Button>
    <p class="mt-3 text-center text-xs text-muted-foreground">You'll check your mic before it starts.</p>
  </aside>
</form>
