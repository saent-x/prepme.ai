<script lang="ts">
  // Answer one scorecard question again, out loud or typed, and see the new score next to the old one.
  import { invalidate } from '$app/navigation';
  import { onDestroy } from 'svelte';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Textarea } from '$lib/components/ui/textarea';
  import LevelMeter from '$lib/components/viz/level-meter.svelte';
  import { Keyboard, LoaderCircle, Mic, Redo as RedoIcon, Stop } from '$lib/icons';
  import { AnswerRecorder } from '$lib/recorder.svelte';
  import { audioFileName, clock, countWords, gainLabel, MAX_ANSWER_CHARS, MIN_ANSWER_WORDS, REDO_SECONDS, type Redo } from '$lib/redo';
  import { sound } from '$lib/sound';
  import { scoreTone } from '$lib/utils';

  export type RedoQuestion = { index: number; question: string; score: number; feedback: string };

  let {
    open = $bindable(false),
    interviewId,
    question,
    left
  }: {
    open?: boolean;
    interviewId: string;
    question: RedoQuestion | null;
    /** Free redos left, or null when the plan has no limit. */
    left: number | null;
  } = $props();

  type Stage = 'ready' | 'recording' | 'typing' | 'scoring' | 'result';
  let stage = $state<Stage>('ready');
  let error = $state<string | null>(null);
  let limited = $state(false);
  let typed = $state('');
  let result = $state<Redo | null>(null);

  const recorder = new AnswerRecorder(REDO_SECONDS, () => void finish());
  const canRecord = AnswerRecorder.supported;
  const out = $derived(left === 0);
  const tone = (n: number) => {
    const t = scoreTone(n);
    return t === 'good' ? 'text-success-text' : t === 'ok' ? 'text-warning-text' : 'text-destructive';
  };

  // A fresh start each time the pop-up opens, and the microphone is let go when it closes.
  $effect(() => {
    if (open) {
      stage = 'ready';
      error = null;
      limited = false;
      typed = '';
      result = null;
    } else recorder.cancel();
  });
  onDestroy(() => recorder.cancel());

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
    if (!question) return;
    body.set('question', String(question.index));
    stage = 'scoring';
    error = null;
    try {
      const res = await fetch(`/api/interviews/${interviewId}/redo`, { method: 'POST', body });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.redo) {
        error = data?.message ?? 'Could not score that answer. Please try again.';
        limited = data?.code === 'LIMIT';
        stage = back;
        sound.play('error');
        return;
      }
      result = { ...data.redo, createdAt: new Date(data.redo.createdAt) };
      stage = 'result';
      if (data.redo.score > data.redo.previousScore) sound.play('success');
      await invalidate('app:interview');
    } catch {
      error = 'Network error. Check your connection and try again.';
      stage = back;
    }
  }

  function again() {
    result = null;
    error = null;
    typed = '';
    stage = 'ready';
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="gap-0 p-0 sm:max-w-[520px]">
    <Dialog.Header class="flex h-[52px] justify-center border-b px-6">
      <Dialog.Title class="text-xl font-extrabold tracking-[-0.01em]">Redo this answer</Dialog.Title>
      <Dialog.Description class="sr-only">Answer the question again in up to two minutes and see your new score next to the first one.</Dialog.Description>
    </Dialog.Header>

    {#if question}
      <div class="grid gap-5 p-6">
        <div>
          <p class="text-[15px] leading-snug font-semibold">“{question.question}”</p>
          {#if stage !== 'result'}
            <p class="mt-2 text-sm leading-normal text-muted-foreground">
              <span class="tabular font-bold {tone(question.score)}">{question.score}</span> first time. {question.feedback}
            </p>
          {/if}
        </div>

        {#if stage === 'ready'}
          <div class="grid justify-items-start gap-3 border-t pt-5">
            {#if out}
              <p class="text-sm text-muted-foreground">You have used the free plan's redos. <a href="/dashboard/billing" class="link">See plans</a></p>
            {:else}
              <p class="text-sm text-muted-foreground">Say it out loud, as you would in the room. You have two minutes.</p>
              <div class="flex flex-wrap items-center gap-2">
                {#if canRecord}
                  <Button size="lg" onclick={record}><Mic /> Start recording</Button>
                {/if}
                <Button size="lg" variant={canRecord ? 'ghost' : 'default'} onclick={() => ((stage = 'typing'), (error = null))}><Keyboard /> Type it instead</Button>
              </div>
              {#if left != null}<p class="text-xs text-muted-foreground">{left} free {left === 1 ? 'redo' : 'redos'} left.</p>{/if}
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
          {@const words = countWords(typed)}
          <div class="grid gap-3 border-t pt-5">
            <label for="redo-text" class="text-xs font-bold">Your answer</label>
            <Textarea id="redo-text" bind:value={typed} rows={7} maxlength={MAX_ANSWER_CHARS} placeholder="Write it as you would say it." />
            <div class="flex items-center gap-2">
              <Button size="lg" disabled={words < MIN_ANSWER_WORDS} onclick={sendTyped}>Score it</Button>
              <Button size="lg" variant="ghost" onclick={() => ((stage = 'ready'), (error = null))}>Back</Button>
              <span class="tabular ml-auto text-xs text-muted-foreground">{words} {words === 1 ? 'word' : 'words'}</span>
            </div>
          </div>
        {:else if stage === 'scoring'}
          <div class="flex items-center gap-2 border-t pt-5 text-sm font-semibold" role="status">
            <LoaderCircle class="size-4 animate-spin text-spark" /> Scoring your answer
            <span class="font-normal text-muted-foreground">A few seconds.</span>
          </div>
        {:else if result}
          {@const gain = result.score - result.previousScore}
          <div class="grid gap-5 border-t pt-5" role="status">
            <div class="flex items-end gap-6">
              <div>
                <div class="text-xs text-muted-foreground">First time</div>
                <div class="tabular text-2xl font-extrabold tracking-tight text-muted-foreground">{result.previousScore}</div>
              </div>
              <div>
                <div class="text-xs text-muted-foreground">This time</div>
                <div class="tabular number-xl {tone(result.score)}">{result.score}</div>
              </div>
              <div class="tabular pb-1.5 text-sm font-bold {gain > 0 ? 'text-success-text' : gain < 0 ? 'text-destructive' : 'text-muted-foreground'}">
                {gain === 0 ? 'Same score' : `${gainLabel(result.previousScore, result.score)} points`}
              </div>
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

      {#if stage === 'result'}
        <div class="flex justify-end gap-2 border-t px-6 py-4">
          {#if !out}<Button variant="outline" onclick={again}><RedoIcon /> Try again</Button>{/if}
          <Button onclick={() => (open = false)}>Done</Button>
        </div>
      {/if}
    {/if}
  </Dialog.Content>
</Dialog.Root>
