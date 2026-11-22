<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Select from '$lib/components/ui/select';
  import InterviewerAvatar from './interviewer-avatar.svelte';
  import JobSummaryCard from './job-summary.svelte';
  import { hasJobSummary, MIN_JOB_TEXT, type JobSummary } from '$lib/job-parse';
  import { DURATIONS } from '$lib/templates';
  import { LoaderCircle, Mic, Plus } from '@lucide/svelte';
  import { untrack } from 'svelte';

  type Option = { id: string; name: string; blurb: string };
  let {
    open = $bindable(false),
    agents,
    examples,
    maxMinutes,
    agent: presetAgent = '',
    focus: presetFocus = ''
  }: { open?: boolean; agents: Option[]; examples: Option[]; maxMinutes: number; agent?: string; focus?: string } = $props();

  const all = $derived([...agents, ...examples]);
  let choice = $state(untrack(() => (all.some((a) => a.id === presetAgent) ? presetAgent : (all[0]?.id ?? ''))));
  const chosen = $derived(all.find((a) => a.id === choice));
  let duration = $state(untrack(() => Math.min(20, maxMinutes)));
  let focus = $state(untrack(() => presetFocus));
  let name = $state('');
  let error = $state<string | null>(null);
  let busy = $state(false);

  // ---- Job description: paste, then show it back organised ----
  let jd = $state('');
  let job = $state<JobSummary | null>(null);
  let reading = $state(false);
  let editing = $state(true);
  let readText = '';
  let reader: AbortController | null = null;

  async function readJob() {
    const text = jd.trim();
    if (text.length < MIN_JOB_TEXT) {
      job = null;
      return;
    }
    if (text === readText && job) {
      editing = false;
      return;
    }
    reader?.abort();
    reader = new AbortController();
    reading = true;
    try {
      const res = await fetch('/api/job/parse', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: reader.signal
      });
      if (!res.ok) throw new Error(String(res.status));
      const { summary } = (await res.json()) as { summary: JobSummary };
      readText = text;
      job = hasJobSummary(summary) ? summary : null;
      editing = !job;
    } catch (e) {
      // Reading it is a nicety: the pasted text is still used as it is.
      if (!(e instanceof DOMException && e.name === 'AbortError')) job = null;
    } finally {
      reading = false;
    }
  }

  const autoName = $derived(job?.title ? [job.title, job.company].filter(Boolean).join(' at ') : '');
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="max-h-[calc(100svh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-[560px]">
    <Dialog.Header class="border-b px-5 py-3.5">
      <Dialog.Title class="text-base font-bold">New interview</Dialog.Title>
      <Dialog.Description class="sr-only">Choose an agent, add the job description and pick a length.</Dialog.Description>
    </Dialog.Header>

    <form
      method="POST"
      action="/dashboard/interviews/new"
      use:enhance={({ cancel }) => {
        error = null;
        if (!choice) {
          error = 'Choose an agent first.';
          cancel();
          return;
        }
        busy = true;
        return async ({ result }) => {
          if (result.type === 'failure') {
            error = String(result.data?.error ?? 'Check the form');
            busy = false;
            return;
          }
          await applyAction(result);
          busy = false;
          open = false;
        };
      }}
    >
      <div class="grid gap-4 px-5 py-4 *:min-w-0">
        <div class="grid grid-cols-[minmax(0,1fr)] gap-1.5">
          <Label id="ni-agent-label">Agent</Label>
          <input type="hidden" name="interviewer" value={choice} />
          {#if all.length}
            <Select.Root type="single" bind:value={choice}>
              <Select.Trigger class="h-auto! w-full py-2 text-left" aria-labelledby="ni-agent-label">
                {#if chosen}
                  <span class="flex min-w-0 flex-1 items-center gap-2.5">
                    <InterviewerAvatar name={chosen.name} size="sm" />
                    <span class="min-w-0 flex-1">
                      <span class="block truncate font-semibold">{chosen.name}</span>
                      <span class="block truncate text-xs text-muted-foreground">{chosen.blurb}</span>
                    </span>
                  </span>
                {:else}
                  <span class="text-muted-foreground">Choose an agent</span>
                {/if}
              </Select.Trigger>
              <Select.Content class="max-h-72 w-(--bits-select-anchor-width)">
                {#if agents.length}
                  <Select.Group>
                    {#if examples.length}<Select.GroupHeading>Your agents</Select.GroupHeading>{/if}
                    {#each agents as a (a.id)}
                      <Select.Item value={a.id} label={a.name} class="py-2">
                        <InterviewerAvatar name={a.name} size="sm" />
                        <div class="min-w-0 flex-1">
                          <div class="truncate font-semibold">{a.name}</div>
                          <div class="truncate text-xs text-muted-foreground">{a.blurb}</div>
                        </div>
                      </Select.Item>
                    {/each}
                  </Select.Group>
                {/if}
                {#if examples.length}
                  <Select.Group>
                    <Select.GroupHeading>Examples</Select.GroupHeading>
                    {#each examples as a (a.id)}
                      <Select.Item value={a.id} label={a.name} class="py-2">
                        <InterviewerAvatar name={a.name} size="sm" />
                        <div class="min-w-0 flex-1">
                          <div class="truncate font-semibold">{a.name}</div>
                          <div class="truncate text-xs text-muted-foreground">{a.blurb}</div>
                        </div>
                      </Select.Item>
                    {/each}
                  </Select.Group>
                {/if}
              </Select.Content>
            </Select.Root>
          {/if}
          <a href="/dashboard/interviewers?new=1" class="flex w-fit items-center gap-1 text-[13px] font-semibold text-muted-foreground hover:text-foreground" onclick={() => (open = false)}>
            <Plus class="size-3.5" /> New agent
          </a>
        </div>

        <div class="grid gap-1.5">
          <Label for="ni-jd">Job description <span class="font-normal text-faint">(optional)</span></Label>
          <input type="hidden" name="jobDescription" value={jd} />
          {#if job && !editing}
            <JobSummaryCard {job} onedit={() => (editing = true)} />
            <p class="text-xs text-faint">The questions are tailored to this job.</p>
          {:else}
            <div class="relative">
              <Textarea
                id="ni-jd"
                rows={5}
                class="max-h-48"
                bind:value={jd}
                placeholder="Paste the job description. We pick out the role, skills and what they ask for."
                onpaste={() => setTimeout(readJob)}
                onblur={readJob}
              />
              {#if reading}
                <div class="absolute inset-0 grid place-items-center rounded-md bg-card/85 text-[13px] font-semibold">
                  <span class="flex items-center gap-2"><LoaderCircle class="size-4 animate-spin" /> Reading the job description</span>
                </div>
              {/if}
            </div>
          {/if}
        </div>

        <div class="grid gap-1.5">
          <Label for="ni-focus">Anything to focus on? <span class="font-normal text-faint">(optional)</span></Label>
          <Input id="ni-focus" name="focus" bind:value={focus} placeholder="e.g. a difficult customer, salary, why this employer" autocomplete="off" />
        </div>

        <div class="grid gap-4 *:min-w-0 sm:grid-cols-2">
          <div class="grid gap-1.5">
            <Label>Length <span class="font-normal text-faint">(minutes)</span></Label>
            <input type="hidden" name="durationMinutes" value={duration} />
            <div class="grid grid-cols-5 rounded-lg bg-muted p-[3px]" role="radiogroup" aria-label="Length in minutes">
              {#each DURATIONS as d}
                <button
                  type="button"
                  role="radio"
                  disabled={d > maxMinutes}
                  aria-checked={duration === d}
                  title={d > maxMinutes ? 'On the Pro plan' : undefined}
                  onclick={() => (duration = d)}
                  class="tabular rounded-md py-1.5 text-[13px] font-semibold text-muted-foreground transition-colors disabled:opacity-35 aria-checked:bg-card aria-checked:text-foreground aria-checked:shadow-xs"
                >
                  {d}
                </button>
              {/each}
            </div>
            {#if maxMinutes < 45}<p class="text-xs text-faint">Up to {maxMinutes} minutes on the free plan.</p>{/if}
          </div>
          <div class="grid content-start gap-1.5">
            <Label for="ni-name">Name <span class="font-normal text-faint">(optional)</span></Label>
            <input type="hidden" name="name" value={name.trim() || autoName} />
            <Input id="ni-name" bind:value={name} placeholder={autoName || 'e.g. Second interview practice'} autocomplete="off" />
          </div>
        </div>

        {#if error}<p class="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>{/if}
      </div>

      <div class="flex items-center justify-end gap-2 border-t px-5 py-3">
        <span class="mr-auto hidden text-xs text-faint sm:block">You check your microphone next.</span>
        <Button type="button" variant="ghost" class="mr-auto sm:mr-0" onclick={() => (open = false)}>Cancel</Button>
        <Button type="submit" disabled={busy || reading}>
          {#if busy}<LoaderCircle class="animate-spin" />{:else}<Mic />{/if}Continue
        </Button>
      </div>
    </form>
  </Dialog.Content>
</Dialog.Root>
