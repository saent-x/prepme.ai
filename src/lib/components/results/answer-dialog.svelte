<script lang="ts">
  // Practise one answer, out loud or typed, and see how it scored. Used to redo a scorecard
  // answer and to practise a question from a job's bank.
  import { invalidate } from '$app/navigation';
  import { onDestroy } from 'svelte';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Textarea } from '$lib/components/ui/textarea';
  import LevelMeter from '$lib/components/viz/level-meter.svelte';
  import { BookmarkSimple, Check, Keyboard, LoaderCircle, Mic, Redo as RedoIcon, Stop } from '$lib/icons';
  import { STORY_SCORE } from '$lib/bank';
  import { AnswerRecorder } from '$lib/recorder.svelte';
  import { audioFileName, clock, countWords, gainLabel, MAX_ANSWER_CHARS, MIN_ANSWER_WORDS, REDO_SECONDS } from '$lib/redo';
  import { sound } from '$lib/sound';
  import { scoreTone } from '$lib/utils';

  export type AnswerTarget = {
    /** Where the answer is posted. */
    endpoint: string;
    /** Extra form fields the endpoint needs. */
    fields?: Record<string, string>;
    question: string;
    /** The score to beat, with a line about it, when there is an earlier answer. */
    before: { score: number; note: string } | null;
  };
  type Result = { id: string; answer: string; score: number; feedback: string; tip: string };

  let {
    open = $bindable(false),
    kind,
    target,
    left,
    refresh
  }: {
    open?: boolean;
    /** A redo of a scorecard answer, or a practice answer to a bank question. */
    kind: 'redo' | 'answer';
    target: AnswerTarget | null;
    /** Free goes left, or null when the plan has no limit. */
    left: number | null;
    /** The page data to load again after a scored answer. */
    refresh: string;
  } = $props();

  const words = $derived(
    kind === 'redo'
      ? { heading: 'Redo this answer', before: 'First time', one: 'redo', many: 'redos', out: "You have used the free plan's redos." }
      : { heading: 'Practise this question', before: 'Best so far', one: 'scored answer', many: 'scored answers', out: "You have used the free plan's scored answers." }
  );

  type Stage = 'ready' | 'recording' | 'typing' | 'scoring' | 'result';
  let stage = $state<Stage>('ready');
  let error = $state<string | null>(null);
  let limited = $state(false);
  let typed = $state('');
  let result = $state<Result | null>(null);
  /** The score the result is compared with: fixed when the answer is sent, so a refresh cannot move it. */
  let beat = $state<number | null>(null);
  let kept = $state<'no' | 'saving' | 'yes'>('no');

  const recorder = new AnswerRecorder(REDO_SECONDS, () => void finish());
  const canRecord = AnswerRecorder.supported;
  const out = $derived(left === 0);
  const tone = (n: number) => {
    const t = scoreTone(n);
    return t === 'good' ? 'text-success-text' : t === 'ok' ? 'text-warning-text' : 'text-destructive';
  };

  // A fresh start each time the pop-up opens, and the microphone is let go when it closes.
  $effect(() => {
    if (open) reset();
    else recorder.cancel();
  });
  onDestroy(() => recorder.cancel());

  function reset() {
    stage = 'ready';
    error = null;
    limited = false;
    typed = '';
    result = null;
    kept = 'no';
  }

  async function record() {
    error = null;
    try {
      await recorder.start();
      stage = 'recording';
    } catch (e) {
      error = e instanceof Error ? e.message : 'Could not start recording.';
    }
  }

  async function finish() {
    const recording = await recorder.stop();
    if (!recording) {
      stage = 'ready';
      error = 'Nothing was recorded. Try again.';
      return;
    }
    const body = new FormData();
    body.set('audio', new File([recording.blob], audioFileName(recording.blob.type) ?? 'answer.webm', { type: recording.blob.type }));
    body.set('seconds', String(recording.seconds));
    await send(body, 'ready');
  }

  async function sendTyped() {
    const body = new FormData();
    body.set('text', typed.trim());
    await send(body, 'typing');
  }

  async function send(body: FormData, back: Stage) {
    if (!target) return;
    for (const [k, v] of Object.entries(target.fields ?? {})) body.set(k, v);
    stage = 'scoring';
    error = null;
    beat = target.before?.score ?? null;
    try {
      const res = await fetch(target.endpoint, { method: 'POST', body });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.result) {
        error = data?.message ?? 'Could not score that answer. Please try again.';
        limited = data?.code === 'LIMIT';
        stage = back;
        sound.play('error');
        return;
      }
      result = data.result;
      stage = 'result';
      if (beat == null ? data.result.score >= STORY_SCORE : data.result.score > beat) sound.play('success');
      await invalidate(refresh);
    } catch {
      error = 'Network error. Check your connection and try again.';
      stage = back;
    }
  }

  async function keep() {
    if (!result || kept !== 'no') return;
    kept = 'saving';
    error = null;
    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ source: `${kind}:${result.id}` })
      });
      if (!res.ok) {
        error = (await res.json().catch(() => null))?.message ?? 'Could not keep that story.';
        kept = 'no';
        return;
      }
      kept = 'yes';
      await invalidate(refresh);
    } catch {
      error = 'Network error. Check your connection and try again.';
      kept = 'no';
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="gap-0 p-0 sm:max-w-[520px]">
    <Dialog.Header class="flex h-[52px] justify-center border-b px-6">
      <Dialog.Title class="text-xl font-extrabold tracking-[-0.01em]">{words.heading}</Dialog.Title>
      <Dialog.Description class="sr-only">Answer the question in up to two minutes, out loud or typed, and see how it scores.</Dialog.Description>
    </Dialog.Header>

    {#if target}
      <div class="grid gap-5 p-6">
        <div>
          <p class="text-[15px] leading-snug font-semibold">“{target.question}”</p>
          {#if stage !== 'result' && target.before}
            <p class="mt-2 text-sm leading-normal text-muted-foreground">
              <span class="tabular font-bold {tone(target.before.score)}">{target.before.score}</span>
              {words.before.toLowerCase()}. {target.before.note}
            </p>
          {/if}
        </div>

        {#if stage === 'ready'}
          <div class="grid justify-items-start gap-3 border-t pt-5">
            {#if out}
              <p class="text-sm text-muted-foreground">{words.out} <a href="/dashboard/billing" class="link">See plans</a></p>
            {:else}
              <p class="text-sm text-muted-foreground">Say it out loud, as you would in the room. You have two minutes.</p>
              <div class="flex flex-wrap items-center gap-2">
                {#if canRecord}
                  <Button size="lg" onclick={record}><Mic /> Start recording</Button>
                {/if}
                <Button size="lg" variant={canRecord ? 'ghost' : 'default'} onclick={() => ((stage = 'typing'), (error = null))}><Keyboard /> Type it instead</Button>
              </div>
              {#if left != null}<p class="text-xs text-muted-foreground">{left} free {left === 1 ? words.one : words.many} left.</p>{/if}
            {/if}
          </div>
        {:else if stage === 'recording'}
          <div class="grid gap-3 border-t pt-5" aria-live="off">
            <div class="flex items-center gap-3">
              <span class="size-2.5 shrink-0 animate-pulse rounded-full bg-destructive" aria-hidden="true"></span>
              <span class="tabular text-2xl font-extrabold tracking-tight" role="timer" aria-label="Time recorded">{clock(recorder.seconds)}</span>
              <span class="tabular text-sm text-muted-foreground">of {clock(REDO_SECONDS)}</span>
              <LevelMeter level={recorder.level} class="ml-auto text-muted-foreground" />
            </div>
            <span class="h-1.5 overflow-hidden rounded-[3px] bg-track" aria-hidden="true">
              <span class="block h-full rounded-[3px] bg-spark transition-[width] duration-300 ease-linear" style="width:{Math.min(100, (recorder.seconds / REDO_SECONDS) * 100)}%"></span>
            </span>
            <div class="mt-1 flex items-center gap-2">
              <Button size="lg" onclick={finish}><Stop /> Stop and score</Button>
              <Button size="lg" variant="ghost" onclick={() => (recorder.cancel(), (stage = 'ready'))}>Cancel</Button>
            </div>
          </div>
        {:else if stage === 'typing'}
          {@const n = countWords(typed)}
          <div class="grid gap-3 border-t pt-5">
            <label for="answer-text" class="text-xs font-bold">Your answer</label>
            <Textarea id="answer-text" bind:value={typed} rows={7} maxlength={MAX_ANSWER_CHARS} placeholder="Write it as you would say it." />
            <div class="flex items-center gap-2">
              <Button size="lg" disabled={n < MIN_ANSWER_WORDS} onclick={sendTyped}>Score it</Button>
              <Button size="lg" variant="ghost" onclick={() => ((stage = 'ready'), (error = null))}>Back</Button>
              <span class="tabular ml-auto text-xs text-muted-foreground">{n} {n === 1 ? 'word' : 'words'}</span>
            </div>
          </div>
        {:else if stage === 'scoring'}
          <div class="flex items-center gap-2 border-t pt-5 text-sm font-semibold" role="status">
            <LoaderCircle class="size-4 animate-spin text-spark" /> Scoring your answer
            <span class="font-normal text-muted-foreground">A few seconds.</span>
          </div>
        {:else if result}
          {@const gain = beat == null ? null : result.score - beat}
          <div class="grid gap-5 border-t pt-5" role="status">
            <div class="flex items-end gap-6">
              {#if beat != null}
                <div>
                  <div class="text-xs text-muted-foreground">{words.before}</div>
                  <div class="tabular text-2xl font-extrabold tracking-tight text-muted-foreground">{beat}</div>
                </div>
              {/if}
              <div>
                <div class="text-xs text-muted-foreground">{beat == null ? 'Your score' : 'This time'}</div>
                <div class="tabular number-xl {tone(result.score)}">{result.score}</div>
              </div>
              {#if gain != null && beat != null}
                <div class="tabular pb-1.5 text-sm font-bold {gain > 0 ? 'text-success-text' : gain < 0 ? 'text-destructive' : 'text-muted-foreground'}">
                  {gain === 0 ? 'Same score' : `${gainLabel(beat, result.score)} points`}
                </div>
              {/if}
            </div>
            <p class="text-sm leading-normal">{result.feedback}</p>
            <p class="text-sm leading-normal"><span class="font-bold">Next time:</span> <span class="text-muted-foreground">{result.tip}</span></p>
            <details class="group">
              <summary class="w-fit cursor-pointer list-none text-[13px] font-semibold text-muted-foreground hover:text-foreground">What you said</summary>
              <p class="mt-2 max-h-40 overflow-y-auto text-sm leading-normal whitespace-pre-wrap text-muted-foreground">{result.answer}</p>
            </details>
          </div>
        {/if}

        {#if error}
          <p class="rounded-[8px] bg-destructive-soft px-3 py-2 text-sm text-destructive" role="alert">
            {error}
            {#if limited}<a href="/dashboard/billing" class="ml-1 font-semibold underline">See plans</a>{/if}
          </p>
        {/if}
      </div>

      {#if stage === 'result' && result}
        <div class="flex flex-wrap items-center justify-end gap-2 border-t px-6 py-4">
          {#if result.score >= STORY_SCORE}
            <Button variant="ghost" class="mr-auto" disabled={kept !== 'no'} onclick={keep}>
              {#if kept === 'yes'}<Check /> Kept as a story{:else}<BookmarkSimple /> Keep as a story{/if}
            </Button>
          {/if}
          {#if !out}<Button variant="outline" onclick={reset}><RedoIcon /> Try again</Button>{/if}
          <Button onclick={() => (open = false)}>Done</Button>
        </div>
      {/if}
    {/if}
  </Dialog.Content>
</Dialog.Root>
