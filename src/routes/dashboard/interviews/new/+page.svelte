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

<a href="/dashboard/interviews" class="text-[13px] text-muted-foreground hover:text-foreground">← Interviews</a>
<h1 class="mt-2 text-xl font-bold tracking-tight">New interview</h1>

<form
  method="POST"
  class="mt-4 grid items-start gap-3 lg:grid-cols-[1fr_300px]"
  use:enhance={() => {
    busy = true;
    return async ({ update }) => {
      await update();
      busy = false;
    };
  }}
>
  <div class="grid gap-5 rounded-xl border bg-card px-5 py-4">
    <fieldset>
      <legend class="text-sm font-bold">Who interviews you</legend>
      <input type="hidden" name="interviewer" value={choice} />
      <div class="mt-2 grid gap-2 sm:grid-cols-2">
        {#each data.interviewers as i (i.id)}
          <button
            type="button"
            onclick={() => (choice = i.id)}
            aria-pressed={choice === i.id}
            class="relative flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors hover:border-input aria-pressed:border-primary aria-pressed:bg-signal-soft"
          >
            <InterviewerAvatar name={i.name} size="sm" />
            <span class="min-w-0 flex-1 truncate text-sm font-semibold">{i.name}</span>
            {#if choice === i.id}<Check class="size-4 text-primary" />{/if}
          </button>
        {/each}
        {#each freshTemplates as t (t.id)}
          <button
            type="button"
            onclick={() => (choice = `template:${t.id}`)}
            aria-pressed={choice === `template:${t.id}`}
            class="relative flex items-center gap-2.5 rounded-lg border border-dashed px-3 py-2 text-left transition-colors hover:border-input aria-pressed:border-solid aria-pressed:border-primary aria-pressed:bg-signal-soft"
          >
            <InterviewerAvatar name={t.name} size="sm" />
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-semibold">{t.name}</span>
              <span class="block truncate text-xs text-faint">Example · {t.tagline}</span>
            </span>
            {#if choice === `template:${t.id}`}<Check class="size-4 text-primary" />{/if}
          </button>
        {/each}
      </div>
      <a href="/dashboard/interviewers/new" class="mt-2 inline-block text-[13px] font-semibold text-primary hover:underline">Make a new interviewer</a>
    </fieldset>

    <fieldset>
      <legend class="text-sm font-bold">The job <span class="font-normal text-faint">(optional)</span></legend>
      {#if showJd || form?.values?.jobDescription}
        <Textarea
          name="jobDescription"
          rows={8}
          class="mt-2"
          placeholder="Paste the job advert. The interviewer asks about what this job needs."
          value={String(form?.values?.jobDescription ?? '')}
        />
      {:else}
        <button
          type="button"
          class="mt-2 w-full rounded-lg border border-dashed px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:border-input hover:text-foreground"
          onclick={() => (showJd = true)}
        >
          + Paste the job advert to tailor the questions
        </button>
      {/if}
      <div class="mt-3 grid gap-1.5">
        <Label for="focus">Anything to focus on?</Label>
        <Input id="focus" name="focus" placeholder="e.g. handling a difficult customer, salary, why this employer" value={String(form?.values?.focus ?? data.preset.focus)} />
      </div>
    </fieldset>
  </div>

  <aside class="h-fit rounded-xl border bg-card px-5 py-4 lg:sticky lg:top-6">
    <h2 class="text-sm font-bold">Length</h2>
    <input type="hidden" name="durationMinutes" value={duration} />
    <div class="mt-2 grid grid-cols-5 rounded-lg bg-muted p-[3px]">
      {#each DURATIONS as d}
        <button
          type="button"
          disabled={d > data.maxMinutes}
          aria-pressed={duration === d}
          onclick={() => (duration = d)}
          class="tabular rounded-md py-1.5 text-[13px] font-semibold text-muted-foreground transition-colors disabled:opacity-35 aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-xs"
        >
          {d}
        </button>
      {/each}
    </div>
    <p class="mt-1.5 text-xs text-faint">
      minutes{data.maxMinutes < 45 ? ` · up to ${data.maxMinutes} on the free plan` : ''}
    </p>

    <div class="mt-4 grid gap-1.5">
      <Label for="name">Name <span class="font-normal text-faint">(optional)</span></Label>
      <Input id="name" name="name" placeholder="e.g. Second interview practice" value={String(form?.values?.name ?? '')} />
    </div>

    {#if form?.error}
      <p class="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{form.error}</p>
    {/if}

    <Button type="submit" size="lg" class="mt-4 w-full" disabled={busy}>
      {#if busy}<LoaderCircle class="animate-spin" />{:else}<Mic />{/if}
      Continue
    </Button>
    <p class="mt-2 text-center text-xs text-faint">You check your microphone next.</p>
  </aside>
</form>
