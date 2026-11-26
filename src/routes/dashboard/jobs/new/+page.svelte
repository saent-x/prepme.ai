<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import CvPicker, { type PickedCv } from '$lib/components/app/cv-picker.svelte';
  import FitView from '$lib/components/app/fit-view.svelte';
  import RoundsPath, { type PathStep } from '$lib/components/app/rounds-path.svelte';
  import { formatDay, type FitResult } from '$lib/jobs';
  import { MIN_JOB_TEXT } from '$lib/job-parse';
  import { CalendarCheck, FileText, LoaderCircle, Sparkles, Target } from '$lib/icons';
  import { untrack } from 'svelte';

  let { data } = $props();

  let advert = $state('');
  let date = $state('');
  let cv = $state<PickedCv | null>(untrack(() => (data.lastCv ? { ...data.lastCv } : null)));
  let cvBusy = $state(false);
  let title = $state('');
  let company = $state('');
  let busy = $state<'check' | 'save' | null>(null);
  let error = $state<string | null>(null);

  // The fit check, and what it was a check of. Changing the advert or the CV makes it out of date.
  let result = $state<FitResult | null>(null);
  let checkedKey = $state('');
  const key = $derived(`${advert.trim()}\n${cv ? (cv.from ?? `${cv.name}:${cv.text?.length ?? 0}`) : ''}`);
  const stale = $derived(!!result && key !== checkedKey);
  const enough = $derived(advert.trim().length >= MIN_JOB_TEXT);

  const steps = $derived<PathStep[]>([
    ...(result?.rounds ?? []).map((r, i) => ({
      key: r.id,
      title: r.name,
      meta: r.focus,
      state: i === 0 ? ('current' as const) : ('todo' as const)
    })),
    { key: 'goal', title: 'The real interview', meta: date ? formatDay(date) : 'Add the date when you know it', state: 'goal' }
  ]);
</script>

<svelte:head><title>Add a job · PrepMe</title></svelte:head>

<a href="/dashboard/jobs" class="text-xs text-muted-foreground hover:text-foreground">Jobs /</a>
<h1 class="page-title mt-1">Add a job</h1>
<p class="mt-1 text-sm text-muted-foreground">Paste the advert. PrepMe checks your fit and plans the rounds to practise.</p>

<div class="mt-8 grid gap-10 lg:grid-cols-2">
  <form
    method="POST"
    class="grid content-start gap-5 *:min-w-0"
    use:enhance={({ action, cancel }) => {
      error = null;
      if (!enough) {
        error = 'Paste the whole advert so there is enough to read.';
        cancel();
        return;
      }
      const checking = action.search.includes('check');
      const sentKey = key;
      busy = checking ? 'check' : 'save';
      return async ({ result: r }) => {
        if (r.type === 'failure') error = String(r.data?.error ?? 'Check the form');
        else if (r.type === 'error') error = 'Something went wrong. Try again.';
        else if (checking && r.type === 'success') {
          result = r.data?.result as FitResult;
          checkedKey = sentKey;
          title = result.title;
          company = result.company;
        } else await applyAction(r);
        busy = null;
      };
    }}
  >
    <div class="grid gap-2">
      <Label for="job-advert" class="text-xs font-bold">Job advert</Label>
      <Textarea
        id="job-advert"
        name="advert"
        rows={9}
        class="max-h-96"
        bind:value={advert}
        placeholder="Paste the whole advert: the role, what they ask for and what you would do."
      />
    </div>

    <div class="grid gap-5 sm:grid-cols-2">
      <div class="grid content-start gap-2">
        <Label for="job-date" class="text-xs font-bold">Interview date <span class="font-normal text-muted-foreground">(optional)</span></Label>
        <Input id="job-date" name="interviewDate" type="date" bind:value={date} />
      </div>
      <div class="grid content-start gap-2">
        <span class="text-xs font-bold">Your CV</span>
        <CvPicker bind:cv bind:busy={cvBusy} id="job-cv" hint="PDF, Word or text" />
      </div>
    </div>

    {#if result}
      <div class="grid gap-5 sm:grid-cols-2">
        <div class="grid gap-2">
          <Label for="job-title" class="text-xs font-bold">Job title</Label>
          <Input id="job-title" name="title" bind:value={title} maxlength={90} autocomplete="off" />
        </div>
        <div class="grid gap-2">
          <Label for="job-company" class="text-xs font-bold">Company</Label>
          <Input id="job-company" name="company" bind:value={company} maxlength={60} autocomplete="off" />
        </div>
      </div>
      <input type="hidden" name="location" value={result.location} />
      <!-- Sent back with the save so the check is not run twice. Left out once the advert or CV has changed. -->
      <input type="hidden" name="checked" value={stale ? '' : JSON.stringify({ fit: result.fit, rounds: result.rounds })} />
    {/if}

    {#if error}<p class="rounded-[8px] bg-destructive-soft px-3 py-2 text-sm text-destructive" role="alert">{error}</p>{/if}

    <div class="flex flex-wrap items-center gap-3">
      {#if result}
        <Button type="submit" formaction="?/save" disabled={!!busy || cvBusy}>
          {#if busy === 'save'}<LoaderCircle class="animate-spin" />{/if}Save job
        </Button>
        <Button type="submit" formaction="?/check" variant="outline" disabled={!!busy || cvBusy}>
          {#if busy === 'check'}<LoaderCircle class="animate-spin" />{:else}<Sparkles />{/if}Check again
        </Button>
        {#if stale}<span class="text-xs text-muted-foreground">The advert or CV changed since this check.</span>{/if}
      {:else}
        <Button type="submit" formaction="?/check" disabled={!!busy || cvBusy}>
          {#if busy === 'check'}<LoaderCircle class="animate-spin" />{:else}<Sparkles />{/if}Check my fit
        </Button>
        <span class="text-xs text-muted-foreground">Takes about 10 seconds</span>
      {/if}
    </div>
  </form>

  <aside class="min-w-0" aria-live="polite">
    {#if busy === 'check'}
      <div class="flex items-center gap-2.5 text-sm font-semibold"><LoaderCircle class="size-4 animate-spin" /> Reading the advert{cv ? ' and your CV' : ''}</div>
      <p class="mt-1 text-sm text-muted-foreground">Working out what they ask for, what your CV already shows and which rounds to expect.</p>
    {:else if result}
      <div class={stale ? 'opacity-60' : ''}>
        {#if result.fit}
          <FitView fit={result.fit} />
        {:else}
          <div class="text-xs font-semibold text-muted-foreground">Fit check</div>
          <p class="mt-1 text-sm">
            {cv ? 'There was not enough in the advert to compare with your CV.' : 'Add your CV and check again to see what it covers and where the gaps are.'}
          </p>
        {/if}
        <h3 class="section-title mt-6">Rounds we planned</h3>
        <div class="mt-3"><RoundsPath {steps} /></div>
        {#if result.source === 'basic'}
          <p class="mt-5 text-xs text-muted-foreground">This is a quick reading from keywords, because the full check was not available just now. Check again later for a closer one.</p>
        {/if}
      </div>
    {:else}
      <h2 class="section-title">What you get</h2>
      <ul class="hair-list mt-2 border-y text-sm">
        {#each [{ icon: Target, title: 'A fit check', text: 'What the advert asks for, what your CV already shows and the gaps to practise.' }, { icon: FileText, title: 'The rounds to expect', text: 'A plan of the interviews this employer is likely to run, in order.' }, { icon: CalendarCheck, title: 'A readiness score', text: 'It rises as you practise each round, so you know where you stand before the day.' }] as item (item.title)}
          <li class="flex items-start gap-3 py-3">
            <item.icon class="mt-0.5 size-[18px] shrink-0 text-muted-foreground" />
            <div><div class="font-semibold">{item.title}</div><div class="text-[13px] text-muted-foreground">{item.text}</div></div>
          </li>
        {/each}
      </ul>
    {/if}
  </aside>
</div>
