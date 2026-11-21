<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount, untrack } from 'svelte';
  import { toast } from 'svelte-sonner';
  import Logo from '$lib/components/brand/logo.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import InterviewerAvatar from '$lib/components/app/interviewer-avatar.svelte';
  import Orb from '$lib/components/viz/orb.svelte';
  import LevelMeter from '$lib/components/viz/level-meter.svelte';
  import { InterviewCall } from '$lib/realtime/interview-call.svelte';
  import { formatClock } from '$lib/utils';
  import {
    Captions,
    CaptionsOff,
    Headphones,
    LoaderCircle,
    Mic,
    MicOff,
    PanelRight,
    PhoneOff,
    RefreshCw,
    ShieldCheck,
    TriangleAlert,
    Volume2
  } from '@lucide/svelte';

  let { data } = $props();
  const call = new InterviewCall(untrack(() => data.interview.id));

  // ---- Lobby / microphone check ----
  let mic = $state<MediaStream | null>(null);
  let micError = $state<string | null>(null);
  let devices = $state<MediaDeviceInfo[]>([]);
  let deviceId = $state<string>('');
  let lobbyLevel = $state(0);
  let lobbyCtx: AudioContext | null = null;
  let lobbyRaf = 0;

  async function requestMic(id?: string) {
    micError = null;
    stopLobbyMeter();
    mic?.getTracks().forEach((t) => t.stop());
    try {
      mic = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: id ? { exact: id } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      devices = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'audioinput');
      deviceId = mic.getAudioTracks()[0]?.getSettings().deviceId ?? '';
      startLobbyMeter(mic);
    } catch (e) {
      mic = null;
      micError =
        e instanceof DOMException && e.name === 'NotAllowedError'
          ? 'Microphone access is blocked. Allow it in your browser’s address bar, then try again.'
          : 'No microphone found. Plug one in or pick another device.';
    }
  }

  function startLobbyMeter(stream: MediaStream) {
    lobbyCtx = new AudioContext();
    const analyser = lobbyCtx.createAnalyser();
    analyser.fftSize = 512;
    lobbyCtx.createMediaStreamSource(stream).connect(analyser);
    const buf = new Uint8Array(analyser.fftSize);
    const loop = () => {
      analyser.getByteTimeDomainData(buf);
      let s = 0;
      for (const v of buf) s += ((v - 128) / 128) ** 2;
      lobbyLevel = Math.min(1, Math.sqrt(s / buf.length) * 4);
      lobbyRaf = requestAnimationFrame(loop);
    };
    loop();
  }
  function stopLobbyMeter() {
    cancelAnimationFrame(lobbyRaf);
    void lobbyCtx?.close().catch(() => {});
    lobbyCtx = null;
  }

  async function begin() {
    if (!mic) return;
    stopLobbyMeter();
    await call.start(mic);
    if (call.phase === 'error') toast.error(call.error ?? 'Could not start the interview.');
  }

  // ---- Live ----
  let showCaptions = $state(true);
  let showPanel = $state(false);
  let confirmEnd = $state(false);
  let transcriptEl: HTMLOListElement | undefined = $state();

  const inCall = $derived(['connecting', 'live', 'reconnecting', 'error'].includes(call.phase) && call.phase !== 'idle');
  const status = $derived(
    call.phase === 'connecting'
      ? 'Connecting…'
      : call.phase === 'reconnecting'
        ? 'Connection dropped. Reconnecting…'
        : call.interviewerSpeaking
          ? `${data.interviewer.name} is speaking`
          : call.candidateSpeaking
            ? 'Listening to you…'
            : call.muted
              ? 'You are muted'
              : 'Your turn'
  );
  const lowTime = $derived(call.phase === 'live' && call.remainingMs < 2 * 60_000);
  const lastLine = $derived(call.transcript.filter((t) => t.text).at(-1));

  $effect(() => {
    call.transcript.length;
    if (showPanel) transcriptEl?.scrollTo({ top: transcriptEl.scrollHeight, behavior: 'smooth' });
  });

  // Safety net: if the interviewer has said goodbye and time is well past, end for the user.
  $effect(() => {
    if (call.phase === 'live' && call.elapsedMs > call.durationMinutes * 60_000 + 90_000) void hangUp();
  });

  async function hangUp() {
    confirmEnd = false;
    const result = await call.end();
    call.stopMeters();
    if (!result.ok && result.message) toast.error(result.message);
    await goto(`/dashboard/interviews/${data.interview.id}`, { invalidateAll: true });
  }

  function onKey(e: KeyboardEvent) {
    if (call.phase !== 'live') return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.key === 'm' || e.key === 'M') call.toggleMute();
    if (e.key === 'c' || e.key === 'C') showCaptions = !showCaptions;
  }

  function onBeforeUnload(e: BeforeUnloadEvent) {
    if (call.phase === 'live' || call.phase === 'reconnecting') e.preventDefault();
  }

  // Cleanup lives in onMount's teardown, not onDestroy: onDestroy also runs during
  // SSR, where requestAnimationFrame and media APIs don't exist.
  onMount(() => () => {
    stopLobbyMeter();
    if (call.phase !== 'ended' && call.phase !== 'ending') call.dispose();
    call.stopMeters();
    if (call.phase === 'idle') mic?.getTracks().forEach((t) => t.stop());
  });
</script>

<svelte:head><title>{data.interview.name} · Interview room</title></svelte:head>
<svelte:window onkeydown={onKey} onbeforeunload={onBeforeUnload} />

<div class="dark min-h-svh bg-[oklch(0.14_0.005_60)] text-foreground">
  {#if call.phase === 'idle'}
    <!-- ================= LOBBY ================= -->
    <div class="mx-auto flex min-h-svh max-w-5xl flex-col px-5 py-6">
      <header class="flex items-center justify-between">
        <a href="/dashboard/interviews/{data.interview.id}" aria-label="Back"><Logo /></a>
        <Button href="/dashboard/interviews/{data.interview.id}" variant="ghost" size="sm">Not now</Button>
      </header>

      <div class="grid flex-1 items-center gap-6 py-10 lg:grid-cols-2">
        <section class="rounded-[28px] border bg-card p-7">
          <p class="eyebrow">Interview room</p>
          <h1 class="mt-3 text-3xl font-semibold tracking-tight text-balance">{data.interview.name}</h1>
          <div class="mt-6 flex items-center gap-4 rounded-2xl bg-muted p-4">
            <InterviewerAvatar name={data.interviewer.name} size="lg" />
            <div>
              <div class="font-medium">{data.interviewer.name}</div>
              <div class="text-sm text-muted-foreground">Voice: {data.interviewer.voice}</div>
            </div>
          </div>
          <dl class="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div class="rounded-2xl border p-4"><dt class="eyebrow">Length</dt><dd class="mt-1 text-lg font-semibold">{data.interview.durationMinutes} min</dd></div>
            <div class="rounded-2xl border p-4"><dt class="eyebrow">Tailored</dt><dd class="mt-1 text-lg font-semibold">{data.interview.hasJobDescription ? 'To the job' : 'General'}</dd></div>
          </dl>
          {#if data.interview.focus}
            <p class="mt-4 text-sm text-muted-foreground"><span class="text-foreground">Focus:</span> {data.interview.focus}</p>
          {/if}
          {#if data.interview.savedTurns}
            <p class="mt-4 rounded-2xl bg-signal-soft p-4 text-sm">You've already started this one. The interviewer will pick up where you left off.</p>
          {/if}
        </section>

        <section class="rounded-[28px] border bg-card p-7">
          <h2 class="text-xl font-semibold">Check your microphone</h2>
          {#if !mic}
            <p class="mt-2 text-muted-foreground">PrepMe needs your microphone for the voice interview. Audio goes straight to the interviewer and isn't recorded.</p>
            {#if micError}<p class="mt-4 flex gap-2 rounded-2xl bg-destructive/15 p-4 text-sm"><TriangleAlert class="size-4 shrink-0" />{micError}</p>{/if}
            <Button size="xl" class="mt-6 w-full" onclick={() => requestMic()}><Mic /> Allow microphone</Button>
          {:else}
            <div class="mt-5 flex items-center gap-4 rounded-2xl bg-muted p-4">
              <span class="grid size-10 place-items-center rounded-full bg-success/20 text-success"><Mic class="size-5" /></span>
              <div class="flex-1">
                <div class="text-sm font-medium">Say something to test</div>
                <div class="mt-2 h-2 overflow-hidden rounded-full bg-background">
                  <div class="h-full rounded-full bg-success transition-[width] duration-75" style="width:{Math.round(lobbyLevel * 100)}%"></div>
                </div>
              </div>
            </div>
            {#if devices.length > 1}
              <label class="mt-4 block text-sm">
                <span class="text-muted-foreground">Microphone</span>
                <select
                  class="mt-1.5 h-11 w-full rounded-xl border bg-background px-3"
                  value={deviceId}
                  onchange={(e) => requestMic(e.currentTarget.value)}
                >
                  {#each devices as d}<option value={d.deviceId}>{d.label || 'Microphone'}</option>{/each}
                </select>
              </label>
            {/if}
            <ul class="mt-6 grid gap-2.5 text-sm text-muted-foreground">
              <li class="flex gap-2.5"><Headphones class="size-4 shrink-0" /> Headphones stop the interviewer hearing itself.</li>
              <li class="flex gap-2.5"><Volume2 class="size-4 shrink-0" /> The interviewer speaks first. Take your time; it waits for you to finish.</li>
              <li class="flex gap-2.5"><ShieldCheck class="size-4 shrink-0" /> If the line drops, your progress is kept and the call reconnects.</li>
            </ul>
            <Button variant="signal" size="xl" class="mt-7 w-full" onclick={begin}><Mic /> Start interview</Button>
          {/if}
        </section>
      </div>
    </div>
  {:else if call.phase === 'ending' || call.phase === 'ended'}
    <!-- ================= SCORING ================= -->
    <div class="grid min-h-svh place-items-center px-6 text-center">
      <div>
        <LoaderCircle class="mx-auto size-10 animate-spin text-signal" />
        <h1 class="mt-6 text-2xl font-semibold">Scoring your interview</h1>
        <p class="mt-2 text-muted-foreground">Reading {call.transcript.length} turns against the role. Usually under a minute.</p>
      </div>
    </div>
  {:else if inCall}
    <!-- ================= LIVE ================= -->
    <div class="flex min-h-svh">
      <div class="flex min-w-0 flex-1 flex-col">
        <header class="flex items-center justify-between gap-4 px-5 py-4">
          <div class="flex min-w-0 items-center gap-3">
            <Logo compact />
            <span class="truncate text-sm text-muted-foreground">{data.interview.name}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 font-mono text-xs {lowTime ? 'text-signal' : ''}" aria-live="polite">
              <span class="size-1.5 rounded-full {call.phase === 'live' ? 'animate-onair bg-signal' : 'bg-warning'}"></span>
              {call.phase === 'live' ? 'LIVE' : call.phase === 'error' ? 'PAUSED' : 'CONNECTING'}
              · {formatClock(call.elapsedMs)} / {call.durationMinutes}:00
            </span>
            <Button variant="ghost" size="icon" aria-label="Toggle transcript" aria-pressed={showPanel} onclick={() => (showPanel = !showPanel)}><PanelRight /></Button>
          </div>
        </header>

        <main class="relative flex flex-1 flex-col items-center justify-center px-5">
          <Orb
            level={call.interviewerLevel}
            speaking={call.interviewerSpeaking}
            state={call.phase === 'live' ? 'live' : call.phase === 'reconnecting' ? 'reconnecting' : 'connecting'}
            size={240}
          />
          <h1 class="mt-10 text-xl font-semibold">{data.interviewer.name}</h1>
          <p class="mt-1 text-muted-foreground" aria-live="polite">{status}</p>

          {#if showCaptions}
            <div class="mt-8 min-h-24 w-full max-w-2xl text-center" aria-live="polite">
              {#if call.caption?.text}
                <p class="text-lg leading-relaxed text-balance {call.caption.speaker === 'candidate' ? 'text-muted-foreground' : ''}">{call.caption.text}</p>
              {:else if lastLine}
                <p class="text-lg leading-relaxed text-balance {lastLine.speaker === 'candidate' ? 'text-muted-foreground' : 'opacity-80'}">{lastLine.text}</p>
              {/if}
            </div>
          {/if}

          {#if call.phase === 'error'}
            <div class="absolute inset-x-5 bottom-6 mx-auto max-w-md rounded-3xl border bg-card p-6 text-center shadow-2xl">
              <TriangleAlert class="mx-auto size-6 text-signal" />
              <p class="mt-3 font-medium">The interview is paused</p>
              <p class="mt-1 text-sm text-muted-foreground">{call.error}</p>
              <div class="mt-5 flex justify-center gap-2">
                <Button onclick={() => call.resume()}><RefreshCw /> Reconnect</Button>
                <Button variant="outline" onclick={hangUp}>End and score</Button>
              </div>
            </div>
          {/if}
        </main>

        <footer class="flex items-center justify-center gap-3 px-5 pt-4 pb-8">
          <button
            class="relative grid size-14 place-items-center rounded-full transition-colors {call.muted ? 'bg-signal text-white' : 'bg-card hover:bg-accent'}"
            aria-label={call.muted ? 'Unmute (M)' : 'Mute (M)'}
            aria-pressed={call.muted}
            onclick={() => call.toggleMute()}
            disabled={call.phase !== 'live'}
          >
            {#if call.muted}<MicOff class="size-5" />{:else}<Mic class="size-5" />{/if}
            {#if !call.muted}<LevelMeter level={call.micLevel} class="absolute -right-1 -bottom-1 rounded-full bg-background p-0.5 text-foreground" />{/if}
          </button>
          <button
            class="grid size-14 place-items-center rounded-full bg-card transition-colors hover:bg-accent"
            aria-label={showCaptions ? 'Hide captions (C)' : 'Show captions (C)'}
            aria-pressed={showCaptions}
            onclick={() => (showCaptions = !showCaptions)}
          >
            {#if showCaptions}<Captions class="size-5" />{:else}<CaptionsOff class="size-5" />{/if}
          </button>
          <button
            class="flex h-14 items-center gap-2 rounded-full bg-destructive px-6 font-medium text-white transition-opacity hover:opacity-90"
            onclick={() => (confirmEnd = true)}
          >
            <PhoneOff class="size-5" /> End interview
          </button>
        </footer>
      </div>

      {#if showPanel}
        <aside class="hidden w-[380px] shrink-0 flex-col border-l bg-card/40 md:flex" aria-label="Live transcript">
          <div class="border-b px-5 py-4 font-medium">Live transcript</div>
          <ol bind:this={transcriptEl} class="flex-1 space-y-4 overflow-y-auto p-5 text-sm">
            {#each call.transcript.filter((t) => t.text) as t (t.id)}
              <li>
                <div class="eyebrow mb-1">{t.speaker === 'interviewer' ? data.interviewer.name : 'You'} · {formatClock(t.at)}</div>
                <p class="leading-relaxed {t.speaker === 'candidate' ? 'text-muted-foreground' : ''}">{t.text}</p>
              </li>
            {:else}
              <li class="text-muted-foreground">Lines appear here as you talk.</li>
            {/each}
          </ol>
        </aside>
      {/if}
    </div>
  {/if}
</div>

<AlertDialog.Root bind:open={confirmEnd}>
  <AlertDialog.Content class="dark">
    <AlertDialog.Header>
      <AlertDialog.Title>End the interview?</AlertDialog.Title>
      <AlertDialog.Description>
        {call.remainingMs > 60_000
          ? `You have ${Math.ceil(call.remainingMs / 60_000)} minutes left. Ending now scores what you've said so far.`
          : "We'll score your answers and show your feedback."}
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Keep going</AlertDialog.Cancel>
      <Button variant="destructive" onclick={hangUp}>End and score</Button>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
