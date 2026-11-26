<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Select from '$lib/components/ui/select';
  import InterviewerAvatar from './interviewer-avatar.svelte';
    import { hasJobSummary, MIN_JOB_TEXT, type JobSummary } from '$lib/job-parse';
  import { Building2, ChevronRight, FileText, LoaderCircle, MapPin, Paperclip, Pencil, Plus, User, X } from '$lib/icons';
  import { untrack } from 'svelte';
  import { PLAN_MINUTES } from '$lib/plans';

  type Option = { id: string; name: string; blurb: string };
  let {
    open = $bindable(false),
    agents,
    examples,
    minutes,
    premium = false,
    agent: presetAgent = '',
    focus: presetFocus = '',
    lastCv = null
  }: {
    open?: boolean;
    agents: Option[];
    examples: Option[];
    minutes: number;
    premium?: boolean;
    agent?: string;
    focus?: string;
    lastCv?: { from: string; name: string } | null;
  } = $props();

  const all = $derived([...agents, ...examples]);
  let choice = $state<string | null>(untrack(() => (all.some((a) => a.id === presetAgent) ? presetAgent : (all[0]?.id ?? ''))));
  const chosen = $derived(all.find((a) => a.id === choice));
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

  // ---- CV: read on upload, sent as text with the form ----
  type Cv = { name: string; text?: string; words?: number; from?: string };
  let cv = $state<Cv | null>(untrack(() => (lastCv ? { name: lastCv.name, from: lastCv.from } : null)));
  let cvBusy = $state(false);
  let cvError = $state<string | null>(null);
  let cvInput = $state<HTMLInputElement>();

  async function uploadCv(file: File | undefined) {
    if (!file) return;
    cvError = null;
    cvBusy = true;
    try {
      const body = new FormData();
      body.set('file', file);
      const res = await fetch('/api/cv/parse', { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? 'That file could not be read.');
      cv = { name: data.name, text: data.text, words: data.words };
    } catch (e) {
      cvError = e instanceof Error ? e.message : 'That file could not be read.';
    } finally {
      cvBusy = false;
      if (cvInput) cvInput.value = '';
    }
  }

  const autoName = $derived(job?.title ? [job.title, job.company].filter(Boolean).join(' at ') : '');
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="max-h-[calc(100svh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-[560px]">
    <Dialog.Header class="flex h-[52px] justify-center border-b px-6">
      <Dialog.Title class="text-xl font-extrabold tracking-[-0.01em]">New interview</Dialog.Title>
      <Dialog.Description class="sr-only">Add the job description, choose an agent and pick a length.</Dialog.Description>
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
      <div class="grid gap-5 p-6 *:min-w-0">
        <div class="grid gap-2">
          <div class="flex items-center justify-between">
            <Label for="ni-jd" class="text-xs font-bold">Job description</Label>
            {#if job && !editing}
              <button type="button" class="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground" onclick={() => (editing = true)}>
                <Pencil class="size-3.5" /> Edit
              </button>
            {/if}
          </div>
          <input type="hidden" name="jobDescription" value={jd} />
          {#if job && !editing}
            <button
              type="button"
              class="line-clamp-2 rounded-[8px] border px-3 py-2.5 text-left text-sm leading-normal text-muted-foreground hover:border-foreground/40"
              onclick={() => (editing = true)}>{jd}</button
            >
          {:else}
            <div class="relative">
              <Textarea
                id="ni-jd"
                rows={3}
                class="max-h-48"
                bind:value={jd}
                placeholder="Paste the job description. PrepMe reads the role, the company and the skills."
                onpaste={() => setTimeout(readJob)}
                onblur={readJob}
              />
              {#if reading}
                <div class="absolute inset-0 grid place-items-center rounded-[8px] bg-card/85 text-[13px] font-semibold">
                  <span class="flex items-center gap-2"><LoaderCircle class="size-4 animate-spin" /> Reading the job</span>
                </div>
              {/if}
            </div>
          {/if}
          {#if job && !editing}
            <div class="stagger flex flex-wrap gap-2">
              {#each [{ icon: User, text: job.title }, { icon: Building2, text: job.company }, { icon: MapPin, text: job.location }].filter((c) => c.text) as c}
                <span class="inline-flex h-7 items-center gap-1.5 rounded-full bg-muted px-2.5 text-[13px] font-medium">
                  <c.icon class="size-4 text-muted-foreground" />{c.text}
                </span>
              {/each}
            </div>
            {#if job.skills.length}
              <div class="stagger flex flex-wrap gap-2">
                {#each job.skills.slice(0, 8) as skill}
                  <span class="inline-flex h-7 items-center rounded-full border px-2.5 text-[13px] font-medium">{skill}</span>
                {/each}
              </div>
            {/if}
          {/if}
        </div>

        <div class="grid grid-cols-[minmax(0,1fr)] gap-2">
          <Label id="ni-agent-label" class="text-xs font-bold">Interviewer</Label>
          <input type="hidden" name="interviewer" value={choice ?? ''} />
          {#if all.length}
            <Select.Root bind:value={choice}>
              <Select.Trigger class="h-12 w-full" aria-labelledby="ni-agent-label">
                {#if chosen}
                  <span class="flex min-w-0 flex-1 items-center gap-3">
                    <InterviewerAvatar name={chosen.name} class="size-7" />
                    <span class="shrink-0 font-bold">{chosen.name}</span>
                    <span class="min-w-0 flex-1 truncate text-muted-foreground">{chosen.blurb}</span>
                  </span>
                {:else}
                  <span class="text-muted-foreground">Choose an agent</span>
                {/if}
              </Select.Trigger>
              <Select.Content class="max-h-72 w-(--anchor-width)">
                {#each [{ label: 'Your agents', items: agents }, { label: 'Examples', items: examples }] as group (group.label)}
                  {#if group.items.length}
                    <Select.Group>
                      {#if agents.length && examples.length}<Select.GroupLabel>{group.label}</Select.GroupLabel>{/if}
                      {#each group.items as a (a.id)}
                        <Select.Item value={a.id} class="h-12 gap-3">
                          <InterviewerAvatar name={a.name} class="size-7" />
                          <Select.ItemText class="shrink-0 font-bold">{a.name}</Select.ItemText>
                          <span class="min-w-0 flex-1 truncate text-muted-foreground">{a.blurb}</span>
                        </Select.Item>
                      {/each}
                    </Select.Group>
                  {/if}
                {/each}
              </Select.Content>
            </Select.Root>
          {/if}
          <a href="/dashboard/interviewers?new=1" class="flex w-fit items-center gap-1.5 text-[13px] font-semibold text-muted-foreground hover:text-foreground" onclick={() => (open = false)}>
            <Plus class="size-4" /> New agent
          </a>
        </div>

        <div class="grid gap-2">
          <span class="text-xs font-bold">CV <span class="font-normal text-muted-foreground">(optional)</span></span>
          <input type="hidden" name="cvText" value={cv?.text ?? ''} />
          <input type="hidden" name="cvName" value={cv?.text ? cv.name : ''} />
          <input type="hidden" name="cvFrom" value={cv?.from ?? ''} />
          <input bind:this={cvInput} type="file" accept=".pdf,.docx,.txt,.md" class="sr-only" id="ni-cv" onchange={(e) => uploadCv(e.currentTarget.files?.[0])} />
          {#if cvBusy}
            <span class="inline-flex h-7 w-fit items-center gap-1.5 rounded-full bg-muted px-2.5 text-[13px] font-medium"><LoaderCircle class="size-4 animate-spin" /> Reading your CV</span>
          {:else if cv}
            <span class="inline-flex h-7 w-fit max-w-full animate-pop items-center gap-1.5 rounded-full bg-muted pr-1 pl-2.5 text-[13px] font-medium">
              <FileText class="size-4 shrink-0 text-muted-foreground" />
              <span class="truncate">{cv.name}</span>
              <span class="shrink-0 text-muted-foreground">{cv.words ? `· ${cv.words.toLocaleString()} words` : '· last used'}</span>
              <button type="button" class="grid size-5 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-card hover:text-foreground" aria-label="Remove CV" onclick={() => (cv = null)}>
                <X class="size-3.5" />
              </button>
            </span>
          {:else}
            <label
              for="ni-cv"
              class="flex h-10 min-w-0 cursor-pointer items-center gap-2 rounded-[8px] border border-dashed px-3 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
              ondragover={(e) => e.preventDefault()}
              ondrop={(e) => {
                e.preventDefault();
                uploadCv(e.dataTransfer?.files?.[0]);
              }}
            >
              <Paperclip class="size-4 shrink-0" /><span class="shrink-0 font-semibold">Add your CV</span><span class="truncate text-xs">PDF, Word or text. The interviewer asks about your experience.</span>
            </label>
          {/if}
          {#if cvError}<p class="text-xs text-destructive">{cvError}</p>{/if}
        </div>

        <p class="text-xs text-muted-foreground">
          {minutes}-minute interview on the {premium ? 'Pro' : 'free'} plan.
          {#if !premium}<a href="/dashboard/billing" class="font-semibold text-foreground">Upgrade</a> for {PLAN_MINUTES.pro} minutes.{/if}
        </p>

        <details class="group">
          <summary class="flex w-fit cursor-pointer list-none items-center gap-1 text-[13px] font-semibold text-muted-foreground hover:text-foreground">
            <ChevronRight class="size-4 transition-transform group-open:rotate-90" /> More options
          </summary>
          <div class="mt-3 grid gap-4 sm:grid-cols-2">
            <div class="grid gap-2">
              <Label for="ni-focus" class="text-xs font-bold">Focus on</Label>
              <Input id="ni-focus" name="focus" bind:value={focus} placeholder="e.g. salary, why this employer" autocomplete="off" />
            </div>
            <div class="grid gap-2">
              <Label for="ni-name" class="text-xs font-bold">Name</Label>
              <Input id="ni-name" bind:value={name} placeholder={autoName || 'e.g. Second round'} autocomplete="off" />
            </div>
          </div>
        </details>
        <input type="hidden" name="name" value={name.trim() || autoName} />

        {#if error}<p class="rounded-[8px] bg-destructive-soft px-3 py-2 text-sm text-destructive">{error}</p>{/if}
      </div>

      <div class="flex items-center justify-end gap-2 border-t px-6 py-4">
        <span class="mr-auto hidden text-xs text-muted-foreground sm:block">Mic check comes next.</span>
        <Button type="button" variant="outline" onclick={() => (open = false)}>Cancel</Button>
        <Button type="submit" disabled={busy || reading || cvBusy}>
          {#if busy}<LoaderCircle class="animate-spin" />{/if}Start
        </Button>
      </div>
    </form>
  </Dialog.Content>
</Dialog.Root>
