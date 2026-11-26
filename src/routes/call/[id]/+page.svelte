<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount, untrack } from 'svelte';
  import { toast } from '$lib/components/ui/toast';
  import Logo from '$lib/components/brand/logo.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import * as Select from '$lib/components/ui/select';
  import { Label } from '$lib/components/ui/label';
  import { Toggle } from '@ui-sdk/svelte/toggle';
  import InterviewerAvatar from '$lib/components/app/interviewer-avatar.svelte';
  import UserAvatar from '$lib/components/app/user-avatar.svelte';
  import { faceColour } from '$lib/avatars';
  import LevelMeter from '$lib/components/viz/level-meter.svelte';
  import { IDLE_END_MS, InterviewCall } from '$lib/realtime/interview-call.svelte';
  import { formatClock } from '$lib/utils';
  import { sound } from '$lib/sound';
  import {
    Captions,
    CaptionsOff,
    Check,
    Clock,
    FileText,
    Paperclip,
    LoaderCircle,
    Mic,
    MicOff,
    PhoneOff,
    RefreshCw,
    Target,
    TriangleAlert,
    X
  } from '$lib/icons';

  let { data } = $props();
  const call = new InterviewCall(untrack(() => data.interview.id));

  // ---- Lobby / microphone check ----
  let mic = $state<MediaStream | null>(null);
  let micError = $state<string | null>(null);
  let devices = $state<MediaDeviceInfo[]>([]);
  let deviceId = $state<string>('');
  const micItems = $derived(devices.map((d, n) => ({ value: d.deviceId, label: d.label || `Microphone ${n + 1}` })));
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
  let confirmEnd = $state(false);
  let transcriptEl: HTMLOListElement | undefined = $state();

  const inCall = $derived(['connecting', 'live', 'reconnecting', 'error'].includes(call.phase) && call.phase !== 'idle');
  const status = $derived(
    call.phase === 'connecting'
      ? 'Connecting…'
      : call.phase === 'error'
        ? 'Paused'
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
  const stage = $derived(faceColour(data.interviewer.name));
  const pulse = $derived(call.interviewerSpeaking ? 1 + Math.min(0.12, call.interviewerLevel * 0.25) : 1);
  const lastLine = $derived(call.transcript.filter((t) => t.text).at(-1));
  const line = $derived(call.caption?.text ? call.caption : lastLine);
  const progress = $derived(Math.min(1, call.elapsedMs / (call.durationMinutes * 60_000)));
  // Speaking waveform under the face and the lobby level meter.
  const wave = [0.4, 0.7, 1, 0.6, 0.85, 0.5, 0.9, 0.45, 0.75, 0.55, 0.3];
  const meterBars = Array.from({ length: 24 }, (_, n) => 12 + Math.round(Math.abs(Math.sin(n * 1.7)) * 26));
  let heard = $state(false);
  $effect(() => {
    if (lobbyLevel > 0.08) heard = true;
  });

  $effect(() => {
    call.transcript.length;
    transcriptEl?.scrollTo({ top: transcriptEl.scrollHeight, behavior: 'smooth' });
  });

  // Time is up: end once the interviewer has said goodbye, or 90 s past time as a safety net.
  $effect(() => {
    if (call.phase === 'live' && (call.finished || call.elapsedMs > call.durationMinutes * 60_000 + 90_000)) void hangUp();
  });

  // Sounds (Spark): a short rising chime when the call goes live, a falling one when it ends,
  // one ping for "still there?", a low tone when something fails. Nothing else makes a sound in a call.
  let wasLive = false;
  $effect(() => {
    const phase = call.phase;
    untrack(() => {
      sound.setInCall(phase === 'connecting' || phase === 'live' || phase === 'reconnecting');
      if (phase === 'live' && !wasLive) sound.play('start');
      if ((phase === 'ending' || phase === 'ended') && wasLive) sound.play('end');
      if (phase === 'error') sound.play('error');
      if (phase === 'live') wasLive = true;
      if (phase === 'ending' || phase === 'ended') wasLive = false;
    });
  });
  $effect(() => {
    if (call.idleWarning) untrack(() => sound.play('notify'));
  });

  // Left idle: nobody answered the "still there?" notice, so end and score what was said.
  $effect(() => {
    if (call.phase === 'live' && call.idleExpired) {
      toast.info('The interview ended because it was left idle.');
      void hangUp();
    }
  });
  const idleLeft = $derived(Math.max(0, Math.ceil((IDLE_END_MS - call.idleMs) / 1000)));

  async function hangUp() {
    confirmEnd = false;
    const result = await call.end();
    call.stopMeters();
    sound.play(result.ok ? 'success' : 'error');
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
    sound.setInCall(false);
    if (call.phase === 'idle') mic?.getTracks().forEach((t) => t.stop());
  });
</script>

<svelte:head><title>{data.interview.name} · Interview room</title></svelte:head>
<svelte:window onkeydown={onKey} onbeforeunload={onBeforeUnload} />

<div class="min-h-svh bg-background text-foreground">
  {#if call.phase === 'idle'}
    <!-- ================= LOBBY ================= -->
    <div class="flex min-h-svh flex-col">
      <header class="grid h-16 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b px-6">
        <a href="/dashboard/interviews/{data.interview.id}" aria-label="Back"><Logo /></a>
        <span class="truncate text-sm font-bold">{data.interview.name}</span>
        <a href="/dashboard/interviews/{data.interview.id}" class="grid size-9 place-items-center justify-self-end rounded-[8px] text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Not now">
          <X class="size-5" />
        </a>
      </header>

      <div class="mx-auto grid w-full max-w-[1040px] flex-1 items-center gap-12 px-6 py-10 md:grid-cols-2 md:gap-20">
        <section class="flex flex-col items-center text-center">
          <div class="grid size-[180px] place-items-center rounded-full border-[3px]" style="border-color:{stage}">
            <InterviewerAvatar name={data.interviewer.name} class="size-40 animate-pop" />
          </div>
          <h1 class="mt-6 text-[28px] leading-tight font-extrabold">{data.interviewer.name}</h1>
          {#if data.interviewer.role}<p class="mt-1 text-sm text-muted-foreground">{data.interviewer.role}</p>{/if}
          <div class="mt-4 flex flex-wrap justify-center gap-2">
            <span class="inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[13px] font-medium"><Clock class="size-4 text-muted-foreground" />{data.interview.durationMinutes} min</span>
            {#if data.interview.hasJobDescription}<span class="inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[13px] font-medium"><FileText class="size-4 text-muted-foreground" />Job</span>{/if}
            {#if data.interview.hasCv}<span class="inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[13px] font-medium"><Paperclip class="size-4 text-muted-foreground" />CV</span>{/if}
            {#if data.interviewer.style}<span class="inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[13px] font-medium"><Target class="size-4 text-muted-foreground" />{data.interviewer.style}</span>{/if}
          </div>
        </section>

        <section class="w-full max-w-[480px]">
          <h2 class="text-xl font-extrabold">Mic check</h2>
          {#if data.interview.savedTurns}
            <p class="mt-3 rounded-[8px] bg-muted px-3 py-2 text-[13px]">You already started this one. {data.interviewer.name} picks up where you left off.</p>
          {/if}
          {#if data.interview.focus}<p class="mt-1 text-[13px] text-muted-foreground">Focus: {data.interview.focus}</p>{/if}
          {#if !mic}
            <p class="mt-2 text-sm text-muted-foreground">Your voice goes straight to the interviewer. It isn't recorded.</p>
            {#if micError}<p class="mt-3 flex gap-2 rounded-[8px] bg-destructive-soft px-3 py-2 text-[13px] text-destructive"><TriangleAlert class="size-4 shrink-0" />{micError}</p>{/if}
            <Button size="lg" class="mt-6 w-full" onclick={() => requestMic()}><Mic /> Allow microphone</Button>
          {:else}
            <div class="mt-5 flex h-10 items-center gap-2" aria-hidden="true">
              {#each meterBars as h, n}
                <span
                  class="w-3 rounded-[3px] transition-[height,background-color] duration-75 {n / meterBars.length < lobbyLevel ? 'bg-success' : 'bg-track'}"
                  style="height:{n / meterBars.length < lobbyLevel ? h : 8}px"
                ></span>
              {/each}
            </div>
            <p class="mt-2 flex h-5 items-center gap-1.5 text-sm font-semibold {heard ? 'text-success' : 'text-muted-foreground'}">
              {#if heard}Sounds good <Check class="size-4" />{:else}Say something to test{/if}
            </p>
            {#if devices.length > 1}
              <div class="mt-5 grid gap-2">
                <Label id="mic-label" class="text-xs font-bold">Microphone</Label>
                <Select.Root items={micItems} bind:value={() => deviceId, (v) => v && requestMic(v)}>
                  <Select.Trigger class="w-full" aria-labelledby="mic-label"><Select.Value /></Select.Trigger>
                  <Select.Content>
                    {#each micItems as d (d.value)}<Select.Item value={d.value}>{d.label}</Select.Item>{/each}
                  </Select.Content>
                </Select.Root>
              </div>
            {/if}
            <Button size="lg" class="mt-6 w-full" onclick={begin}>I'm ready</Button>
          {/if}
          <ul class="mt-6 grid gap-2.5 border-t pt-5 text-sm text-muted-foreground">
            {#each ['Quiet room, headphones if you have them', 'Speak as you would to a person', 'Pauses are fine'] as tip}
              <li class="flex items-center gap-2.5"><Check class="size-4 shrink-0" />{tip}</li>
            {/each}
          </ul>
        </section>
      </div>
    </div>
  {:else if call.phase === 'ending' || call.phase === 'ended'}
    <!-- ================= SCORING ================= -->
    <div class="grid min-h-svh place-items-center px-6 text-center">
      <div>
        <InterviewerAvatar name={data.interviewer.name} class="mx-auto size-16" />
        <h1 class="mt-4 flex items-center justify-center gap-2 text-xl font-extrabold"><LoaderCircle class="size-5 animate-spin" /> Scoring your interview</h1>
        <p class="mt-1 text-sm text-muted-foreground">Usually under a minute.</p>
      </div>
    </div>
  {:else if inCall}
    <!-- ================= LIVE ================= -->
    <div class="flex h-svh">
      <div class="flex min-w-0 flex-1 flex-col">
        <header class="relative grid h-16 shrink-0 grid-cols-[1fr_auto] items-center gap-4 border-b px-4 sm:grid-cols-[1fr_auto_1fr] sm:px-6">
          <div class="flex min-w-0 items-center gap-4">
            <span class="hidden sm:block"><Logo /></span>
            {#if call.phase === 'live'}
              <span class="inline-flex h-6 items-center gap-1.5 text-xs font-bold text-destructive">
                <span class="size-1.5 animate-onair rounded-full bg-destructive"></span> Recording
              </span>
            {:else}
              <span class="inline-flex h-6 items-center gap-1.5 text-xs font-bold text-warning-text">
                <span class="size-1.5 rounded-full bg-warning"></span> {call.phase === 'error' ? 'Paused' : 'Connecting'}
              </span>
            {/if}
          </div>
          <span class="hidden truncate text-sm font-bold sm:block">{data.interview.name}</span>
          <span class="tabular justify-self-end text-sm font-extrabold {lowTime ? 'text-destructive' : ''}" aria-live="polite">
            {formatClock(call.elapsedMs)} / {call.durationMinutes}:00
          </span>
          <span class="absolute bottom-[-1px] left-0 h-0.5 bg-foreground transition-[width] duration-1000" style="width:{progress * 100}%"></span>
        </header>

        <p class="truncate px-4 pt-3 text-center text-sm font-bold sm:hidden">{data.interview.name}</p>
        <main class="relative flex flex-1 flex-col items-center justify-center px-6">
          <div class="relative grid size-[232px] place-items-center sm:size-[288px]">
            <span class="absolute inset-0 rounded-full border-[1.5px] transition-transform duration-150" style="border-color:{stage}26;transform:scale({pulse})"></span>
            <span class="absolute inset-4 rounded-full border-2 sm:inset-5 transition-transform duration-100" style="border-color:{stage}59;transform:scale({pulse})"></span>
            <span class="absolute inset-7 rounded-full border-[3px] sm:inset-9" style="border-color:{stage}"></span>
            <InterviewerAvatar name={data.interviewer.name} class="relative size-40 sm:size-48 {call.phase === 'live' ? '' : 'opacity-60'}" />
          </div>
          <h1 class="mt-4 text-xl font-extrabold">{data.interviewer.name}</h1>
          <div class="mt-2 flex h-5 items-center gap-1" aria-hidden="true">
            {#each wave as w, n}
              <span class="w-1 rounded-[2px] transition-[height] duration-100" style="background:{stage};height:{call.interviewerSpeaking ? Math.max(4, w * (6 + call.interviewerLevel * 60)) : 4}px"></span>
            {/each}
          </div>
          <p class="sr-only" aria-live="polite">{status}</p>

          {#if showCaptions && call.phase !== 'error'}
            <div class="mt-6 grid min-h-[76px] w-full max-w-[760px] place-items-center text-center" aria-live="polite">
              {#if line}
                {#if line.speaker === 'interviewer'}
                  <p class="text-xl leading-[1.35] font-extrabold sm:text-[28px] sm:leading-[1.3] tracking-[-0.01em] text-balance">{line.text}</p>
                {:else}
                  <p class="text-base leading-normal text-muted-foreground italic text-balance">{line.text}</p>
                {/if}
              {:else}
                <p class="text-sm text-muted-foreground">{status}</p>
              {/if}
            </div>
          {/if}

          {#if call.idleWarning}
            <div class="mt-6 flex h-12 w-full max-w-[400px] items-center gap-3 rounded-[10px] bg-card pr-2 pl-4 shadow-md" role="alert">
              <Clock class="size-5 shrink-0 text-warning" />
              <p class="tabular flex-1 text-sm">Still there? Ends in {idleLeft}s.</p>
              <Button size="sm" variant="outline" onclick={() => call.markActive()}>I'm here</Button>
            </div>
          {/if}

          {#if call.phase === 'error'}
            <div class="mt-6 w-full max-w-md rounded-[10px] bg-card p-5 text-center shadow-pop">
              <p class="flex items-center justify-center gap-2 font-extrabold"><TriangleAlert class="size-4 text-warning" /> The interview is paused</p>
              <p class="mt-1 text-sm text-muted-foreground">{call.error}</p>
              <div class="mt-4 flex justify-center gap-2">
                <Button onclick={() => call.resume()}><RefreshCw /> Reconnect</Button>
                <Button variant="outline" onclick={hangUp}>End and score</Button>
              </div>
            </div>
          {/if}
        </main>

        <footer class="relative flex items-end justify-center gap-6 sm:gap-8 px-6 pt-4 pb-8">
          <span class="absolute bottom-10 left-6 hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
            You {#if !call.muted}<LevelMeter level={call.micLevel} />{:else}<MicOff class="size-4" />{/if}
          </span>
          {#snippet control(label: string)}
            <span class="mt-2 block text-center text-xs font-semibold text-muted-foreground">{label}</span>
          {/snippet}
          <div>
            <Toggle
              bind:pressed={() => call.muted, () => call.toggleMute()}
              aria-label="Mute"
              title="Mute (M)"
              disabled={call.phase !== 'live'}
              class="size-14 rounded-full border bg-card p-0 text-foreground hover:bg-muted data-disabled:opacity-50 data-pressed:border-foreground data-pressed:bg-foreground data-pressed:text-background"
            >
              {#if call.muted}<MicOff class="size-6" />{:else}<Mic class="size-6" />{/if}
            </Toggle>
            {@render control(call.muted ? 'Unmute' : 'Mute')}
          </div>
          <div>
            <Toggle
              bind:pressed={showCaptions}
              aria-label="Captions"
              title="Captions (C)"
              class="size-14 rounded-full border bg-card p-0 text-foreground hover:bg-muted data-pressed:bg-card"
            >
              {#if showCaptions}<Captions class="size-6" />{:else}<CaptionsOff class="size-6" />{/if}
            </Toggle>
            {@render control('Captions')}
          </div>
          <div>
            <button
              class="grid size-14 place-items-center rounded-full bg-destructive text-white transition-transform hover:scale-105 active:scale-95"
              aria-label="End interview"
              onclick={() => (confirmEnd = true)}
            >
              <PhoneOff class="size-6" />
            </button>
            {@render control('End')}
          </div>
        </footer>
      </div>

      <aside class="hidden w-[360px] shrink-0 flex-col border-l bg-muted lg:flex" aria-label="Live transcript">
        <div class="flex h-16 shrink-0 items-center justify-between border-b px-6">
          <h2 class="text-base font-extrabold">Transcript</h2>
          <span class="inline-flex h-6 items-center gap-1.5 rounded-full border bg-card px-2.5 text-xs font-semibold"><span class="size-1.5 rounded-full bg-success"></span> Live</span>
        </div>
        <ol bind:this={transcriptEl} class="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {#each call.transcript.filter((t) => t.text) as t (t.id)}
            <li class="animate-rise">
              <div class="flex items-center gap-2">
                {#if t.speaker === 'interviewer'}
                  <InterviewerAvatar name={data.interviewer.name} class="size-6" />
                  <span class="text-xs font-bold">{data.interviewer.name}</span>
                {:else}
                  <UserAvatar name={data.user.name} image={data.user.image} class="size-6 text-[11px]" />
                  <span class="text-xs font-bold">You</span>
                {/if}
                <span class="tabular text-xs text-muted-foreground">{formatClock(t.at)}</span>
              </div>
              <p class="mt-1.5 pl-8 text-sm leading-normal">{t.text}</p>
            </li>
          {:else}
            <li class="text-sm text-muted-foreground">Lines appear here as you talk.</li>
          {/each}
        </ol>
      </aside>
    </div>
  {/if}
</div>

<AlertDialog.Root bind:open={confirmEnd}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>End the interview?</AlertDialog.Title>
      <AlertDialog.Description>
        {call.remainingMs > 60_000
          ? `You have ${Math.ceil(call.remainingMs / 60_000)} minutes left. Ending now scores what you've said so far.`
          : "We'll score your answers and show your feedback."}
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Close>Keep going</AlertDialog.Close>
      <Button variant="destructive" onclick={hangUp}>End and score</Button>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
