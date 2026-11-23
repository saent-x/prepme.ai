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
  let showPanel = $state(false);
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

  $effect(() => {
    call.transcript.length;
    if (showPanel) transcriptEl?.scrollTo({ top: transcriptEl.scrollHeight, behavior: 'smooth' });
  });

  // Safety net: if the interviewer has said goodbye and time is well past, end for the user.
  $effect(() => {
    if (call.phase === 'live' && call.elapsedMs > call.durationMinutes * 60_000 + 90_000) void hangUp();
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

<div class="min-h-svh bg-background text-foreground">
  {#if call.phase === 'idle'}
    <!-- ================= LOBBY ================= -->
    <div class="mx-auto flex min-h-svh max-w-[880px] flex-col px-5 py-4">
      <header class="flex items-center justify-between">
        <a href="/dashboard/interviews/{data.interview.id}" aria-label="Back"><Logo /></a>
        <Button href="/dashboard/interviews/{data.interview.id}" variant="ghost" size="sm">Not now</Button>
      </header>

      <div class="grid flex-1 place-items-center py-8">
        <div class="grid w-full overflow-hidden rounded-xl border bg-card md:grid-cols-[1fr_1.15fr]">
          <section class="flex flex-col items-center justify-center gap-3 px-6 py-8 text-center text-[#18161f]" style="background:{stage}">
            <InterviewerAvatar name={data.interviewer.name} class="size-24 ring-4 ring-white/40" />
            <div>
              <div class="text-lg font-bold">{data.interviewer.name}</div>
              <div class="text-[13px] opacity-75">{data.interview.name}</div>
            </div>
            <div class="flex flex-wrap justify-center gap-1.5 text-xs font-semibold">
              <span class="rounded-md bg-white/60 px-2 py-0.5">{data.interview.durationMinutes} min</span>
              <span class="rounded-md bg-white/60 px-2 py-0.5">{data.interview.hasJobDescription ? 'Tailored to the job' : 'General'}</span>
            </div>
          </section>

          <section class="px-6 py-6">
            <h1 class="text-base font-bold">Check your microphone</h1>
            {#if data.interview.focus}
              <p class="mt-1 text-[13px] text-muted-foreground">Focus: {data.interview.focus}</p>
            {/if}
            {#if data.interview.savedTurns}
              <p class="mt-3 rounded-lg bg-signal-soft px-3 py-2 text-[13px]">You already started this one. The interviewer picks up where you left off.</p>
            {/if}
            {#if !mic}
              <p class="mt-2 text-sm text-muted-foreground">Your voice goes straight to the interviewer. It is not recorded.</p>
              {#if micError}<p class="mt-3 flex gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-[13px] text-destructive"><TriangleAlert class="size-4 shrink-0" />{micError}</p>{/if}
              <Button size="lg" class="mt-5 w-full" onclick={() => requestMic()}><Mic /> Allow microphone</Button>
            {:else}
              <div class="mt-4 flex items-center gap-3">
                <Mic class="size-4 shrink-0 text-success" />
                <div class="flex-1">
                  <div class="text-[13px] font-medium">Say something to test</div>
                  <div class="mt-1.5 h-[5px] overflow-hidden rounded-full bg-muted">
                    <div class="h-full rounded-full bg-success transition-[width] duration-75" style="width:{Math.round(lobbyLevel * 100)}%"></div>
                  </div>
                </div>
              </div>
              {#if devices.length > 1}
                <div class="mt-4 grid gap-1.5">
                  <Label id="mic-label">Microphone</Label>
                  <Select.Root items={micItems} bind:value={() => deviceId, (v) => v && requestMic(v)}>
                    <Select.Trigger class="w-full" aria-labelledby="mic-label"><Select.Value /></Select.Trigger>
                    <Select.Content>
                      {#each micItems as d (d.value)}<Select.Item value={d.value}>{d.label}</Select.Item>{/each}
                    </Select.Content>
                  </Select.Root>
                </div>
              {/if}
              <ul class="mt-4 grid gap-1.5 text-[13px] text-muted-foreground">
                <li class="flex gap-2"><Headphones class="mt-0.5 size-3.5 shrink-0" /> Headphones work best.</li>
                <li class="flex gap-2"><Volume2 class="mt-0.5 size-3.5 shrink-0" /> The interviewer speaks first and waits for you to finish.</li>
                <li class="flex gap-2"><ShieldCheck class="mt-0.5 size-3.5 shrink-0" /> If the line drops, your progress is kept.</li>
              </ul>
              <Button size="lg" class="mt-5 w-full" onclick={begin}><Mic /> Start interview</Button>
            {/if}
          </section>
        </div>
      </div>
    </div>
  {:else if call.phase === 'ending' || call.phase === 'ended'}
    <!-- ================= SCORING ================= -->
    <div class="grid min-h-svh place-items-center px-6 text-center">
      <div>
        <InterviewerAvatar name={data.interviewer.name} class="mx-auto size-16" />
        <h1 class="mt-4 flex items-center justify-center gap-2 text-lg font-bold"><LoaderCircle class="size-4 animate-spin text-primary" /> Scoring your interview</h1>
        <p class="mt-1 text-sm text-muted-foreground">Usually under a minute.</p>
      </div>
    </div>
  {:else if inCall}
    <!-- ================= LIVE ================= -->
    <div class="flex min-h-svh text-[#18161f]" style="background:{stage}">
      <div class="flex min-w-0 flex-1 flex-col">
        <header class="flex items-center justify-between gap-4 px-5 py-3.5">
          <div class="flex min-w-0 items-center gap-3">
            <Logo />
            <span class="truncate text-sm font-medium opacity-70">{data.interview.name}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="tabular inline-flex items-center gap-2 rounded-md bg-white/70 px-2.5 py-1 text-[13px] font-semibold {lowTime ? 'text-destructive' : ''}" aria-live="polite">
              <span class="size-1.5 rounded-full {call.phase === 'live' ? 'animate-onair bg-destructive' : 'bg-warning'}"></span>
              {call.phase === 'live' ? '' : call.phase === 'error' ? 'Paused · ' : 'Connecting · '}{formatClock(call.elapsedMs)} / {call.durationMinutes}:00
            </span>
            <Toggle
              bind:pressed={showPanel}
              aria-label="Transcript"
              class="hidden size-8 rounded-md border-0 bg-white/70 p-0 text-[#18161f] hover:bg-white data-pressed:bg-white md:inline-flex"
              ><PanelRight class="size-4" /></Toggle
            >
          </div>
        </header>

        <main class="relative flex flex-1 flex-col items-center justify-center px-5">
          <div class="relative grid size-[220px] place-items-center">
            <span class="absolute inset-[-56px] rounded-full bg-white/15 transition-transform duration-150" style="transform:scale({pulse})"></span>
            <span class="absolute inset-[-26px] rounded-full bg-white/20 transition-transform duration-100" style="transform:scale({pulse})"></span>
            <InterviewerAvatar name={data.interviewer.name} class="relative size-[220px] ring-[6px] ring-white {call.phase === 'live' ? '' : 'opacity-60'}" />
          </div>
          <h1 class="mt-16 text-lg font-bold">{data.interviewer.name}</h1>
          <p class="text-sm font-medium opacity-70" aria-live="polite">{status}</p>

          {#if showCaptions && call.phase !== 'error'}
            <div class="mt-5 grid min-h-[76px] w-full max-w-[640px] place-items-center rounded-xl bg-white/85 px-5 py-3 text-center" aria-live="polite">
              {#if call.caption?.text}
                <p class="text-[15px] leading-relaxed font-medium text-balance {call.caption.speaker === 'candidate' ? 'opacity-60' : ''}">{call.caption.text}</p>
              {:else if lastLine}
                <p class="text-[15px] leading-relaxed font-medium text-balance {lastLine.speaker === 'candidate' ? 'opacity-60' : ''}">{lastLine.text}</p>
              {:else}
                <p class="text-sm opacity-50">Captions show here.</p>
              {/if}
            </div>
          {/if}

          {#if call.idleWarning}
            <div class="mt-4 flex w-full max-w-[640px] flex-wrap items-center justify-between gap-3 rounded-xl bg-[#18161f] px-4 py-3 text-white" role="alert">
              <div>
                <p class="text-sm font-bold">Are you still there?</p>
                <p class="tabular text-[13px] opacity-75">The interview ends and is scored in {idleLeft} seconds.</p>
              </div>
              <button class="h-9 rounded-lg bg-white px-3.5 text-sm font-semibold text-[#18161f] hover:bg-white/90" onclick={() => call.markActive()}>I'm here</button>
            </div>
          {/if}

          {#if call.phase === 'error'}
            <div class="mt-5 w-full max-w-md rounded-xl border bg-card p-5 text-center text-foreground shadow-xl">
              <p class="flex items-center justify-center gap-2 font-bold"><TriangleAlert class="size-4 text-warning" /> The interview is paused</p>
              <p class="mt-1 text-sm text-muted-foreground">{call.error}</p>
              <div class="mt-4 flex justify-center gap-2">
                <Button onclick={() => call.resume()}><RefreshCw /> Reconnect</Button>
                <Button variant="outline" onclick={hangUp}>End and score</Button>
              </div>
            </div>
          {/if}
        </main>

        <footer class="flex flex-wrap items-center justify-center gap-2.5 px-5 pt-3 pb-6">
          <span class="mr-2 hidden items-center gap-2 rounded-full bg-white/70 py-1 pr-3 pl-1 text-[13px] font-semibold sm:inline-flex">
            <UserAvatar name={data.user.name} image={data.user.image} class="size-7" />
            You
            {#if !call.muted}<LevelMeter level={call.micLevel} />{/if}
          </span>
          <Toggle
            bind:pressed={() => call.muted, () => call.toggleMute()}
            aria-label="Mute"
            title="Mute (M)"
            disabled={call.phase !== 'live'}
            class="size-11 rounded-full border-0 bg-white p-0 text-[#18161f] hover:bg-white/80 data-disabled:opacity-50 data-pressed:bg-[#18161f] data-pressed:text-white"
          >
            {#if call.muted}<MicOff class="size-[18px]" />{:else}<Mic class="size-[18px]" />{/if}
          </Toggle>
          <Toggle
            bind:pressed={showCaptions}
            aria-label="Captions"
            title="Captions (C)"
            class="size-11 rounded-full border-0 bg-white p-0 text-[#18161f] hover:bg-white/80 data-pressed:bg-white"
          >
            {#if showCaptions}<Captions class="size-[18px]" />{:else}<CaptionsOff class="size-[18px]" />{/if}
          </Toggle>
          <button
            class="ml-1 flex h-11 items-center gap-2 rounded-lg bg-[#18161f] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            onclick={() => (confirmEnd = true)}
          >
            <PhoneOff class="size-4" /> End and get scorecard
          </button>
        </footer>
      </div>

      {#if showPanel}
        <aside class="hidden w-[340px] shrink-0 flex-col border-l bg-card text-foreground md:flex" aria-label="Live transcript">
          <div class="border-b px-4 py-3 text-sm font-bold">Live transcript</div>
          <ol bind:this={transcriptEl} class="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            {#each call.transcript.filter((t) => t.text) as t (t.id)}
              <li>
                <div class="mb-0.5 text-xs font-medium text-faint">{t.speaker === 'interviewer' ? data.interviewer.name : 'You'} · {formatClock(t.at)}</div>
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
