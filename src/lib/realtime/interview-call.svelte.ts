import type { TranscriptEntry } from '$lib/interview-types';

export type CallPhase =
  | 'idle'
  | 'connecting'
  | 'live'
  | 'reconnecting'
  | 'ending'
  | 'ended'
  | 'error';

type SessionResponse = {
  clientSecret: string;
  model: string;
  durationMinutes: number;
  startedAt: string;
  resumed: boolean;
  transcript: TranscriptEntry[];
};

type ServerEvent = { type: string; [key: string]: unknown };

const REALTIME_URL = 'https://api.openai.com/v1/realtime/calls';
const MAX_AUTO_RECONNECTS = 3;
const SAVE_DEBOUNCE_MS = 1500;
/** Silence from the candidate before the interviewer checks in out loud. */
const IDLE_NUDGE_MS = 60_000;
/** Silence before the "Are you still there?" notice appears. */
export const IDLE_WARN_MS = 150_000;
/** Silence before the interview ends by itself and is scored. */
export const IDLE_END_MS = 240_000;

/**
 * One live interview over WebRTC, straight from the browser to OpenAI Realtime.
 *
 * The server only mints a short-lived key (POST /api/interviews/:id/session).
 * Audio, turn-taking and transcription run between the browser and OpenAI, so
 * there is no server process to time out mid-call. If the connection drops we
 * mint a fresh key and resume with the transcript so far.
 */
export class InterviewCall {
  phase = $state<CallPhase>('idle');
  error = $state<string | null>(null);
  transcript = $state<TranscriptEntry[]>([]);
  /** In-progress caption for whoever is talking. */
  caption = $state<{ speaker: TranscriptEntry['speaker']; text: string } | null>(null);
  interviewerSpeaking = $state(false);
  candidateSpeaking = $state(false);
  muted = $state(false);
  elapsedMs = $state(0);
  durationMinutes = $state(20);
  model = $state('');
  /** 0..1 audio levels for the visualisers. */
  interviewerLevel = $state(0);
  micLevel = $state(0);
  reconnects = $state(0);
  /** How long the candidate has been silent while it was their turn. */
  idleMs = $state(0);
  /** Set once the call has been left idle for too long; the page then ends it. */
  idleExpired = $state(false);
  /** Set once the interviewer has finished its closing line after time ran out; the page then ends it. */
  finished = $state(false);

  readonly interviewId: string;
  #mic: MediaStream | null = null;
  #pc: RTCPeerConnection | null = null;
  #dc: RTCDataChannel | null = null;
  #audioEl: HTMLAudioElement | null = null;
  #audioCtx: AudioContext | null = null;
  #rafId = 0;
  #tickId: ReturnType<typeof setInterval> | null = null;
  #saveTimer: ReturnType<typeof setTimeout> | null = null;
  #dropTimer: ReturnType<typeof setTimeout> | null = null;
  #startedAt = 0;
  #micMetered = false;
  #wrapUpSent = false;
  #timeUpSent = false;
  #lastActivity = 0;
  #idleNudged = false;
  #closingDeliberately = false;
  /**
   * Bumped by every start, end and dispose. An async start that wakes up to a
   * different value was overtaken (the user hung up or left the page while it
   * was connecting) and must not open a session.
   */
  #gen = 0;
  /** A model response is being generated (response.created → response.done). */
  #responding = false;
  /** A response.create is owed once the current response finishes. */
  #pendingResponse = false;
  /** The interviewer has started its closing turn after the time-up note. */
  #closingTurn = false;
  #liveSince = 0;
  #lastSavedJson = '';
  #onPageHide = () => this.#beaconSave();

  constructor(interviewId: string) {
    this.interviewId = interviewId;
  }

  /** True while the "Are you still there?" notice should show. */
  get idleWarning() {
    return this.phase === 'live' && this.idleMs >= IDLE_WARN_MS;
  }

  /** The candidate is here: reset the idle clock (speech, or the "I'm here" button). */
  markActive() {
    this.#lastActivity = Date.now();
    this.#idleNudged = false;
    this.idleMs = 0;
  }

  get remainingMs() {
    return Math.max(0, this.durationMinutes * 60_000 - this.elapsedMs);
  }

  /** Start (or resume) the interview with an already-granted microphone stream. */
  async start(mic: MediaStream) {
    const gen = ++this.#gen;
    this.#mic = mic;
    this.error = null;
    this.phase = this.reconnects > 0 ? 'reconnecting' : 'connecting';
    window.addEventListener('pagehide', this.#onPageHide);
    if (!this.#micMetered) {
      this.#micMetered = true;
      this.#meter(mic, (v) => (this.micLevel = v));
    }

    try {
      const res = await fetch(`/api/interviews/${this.interviewId}/session`, { method: 'POST' });
      if (!res.ok) throw new Error(await readError(res));
      const session = (await res.json()) as SessionResponse;
      if (gen !== this.#gen) return;

      this.model = session.model;
      this.durationMinutes = session.durationMinutes;
      this.#startedAt = new Date(session.startedAt).getTime();
      // Keep whatever we already have locally if it is longer (e.g. last save was in flight).
      if (session.transcript.length > this.transcript.length) this.transcript = session.transcript;
      this.#lastSavedJson = JSON.stringify(this.transcript);

      await this.#connect(session.clientSecret, gen);
      if (gen !== this.#gen) return;
      this.phase = 'live';
      this.#liveSince = Date.now();
      this.markActive();
      this.#startTicking();
    } catch (e) {
      // Overtaken by end()/dispose(): they already tore everything down.
      if (gen !== this.#gen) return;
      this.#teardownPeer();
      this.phase = 'error';
      this.error = e instanceof Error ? e.message : 'Could not start the interview.';
    }
  }

  /** Manual retry after an error or a failed reconnect. */
  async resume() {
    if (!this.#mic) return;
    this.reconnects += 1;
    await this.start(this.#mic);
  }

  toggleMute() {
    this.muted = !this.muted;
    this.#mic?.getAudioTracks().forEach((t) => (t.enabled = !this.muted));
  }

  /** Hang up, save the transcript and request the scorecard. Returns when scoring finishes. */
  async end(): Promise<{ ok: boolean; message?: string }> {
    if (this.phase === 'ending' || this.phase === 'ended') return { ok: true };
    this.#gen++;
    this.phase = 'ending';
    this.#closingDeliberately = true;
    this.#stopTicking();
    this.#cancelSave();
    // Stop listening, then give a just-finished answer a moment to come back
    // transcribed before the channel closes, so the last answer is scored.
    this.#mic?.getAudioTracks().forEach((t) => (t.enabled = false));
    if (this.#audioEl) this.#audioEl.muted = true;
    await this.#awaitPendingTranscription();
    this.#flushCaption();
    this.#teardownPeer();
    this.#mic?.getTracks().forEach((t) => t.stop());
    window.removeEventListener('pagehide', this.#onPageHide);

    try {
      const res = await fetch(`/api/interviews/${this.interviewId}/complete`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ transcript: this.transcript })
      });
      this.phase = 'ended';
      if (!res.ok) return { ok: false, message: await readError(res) };
      return { ok: true };
    } catch {
      this.phase = 'ended';
      return { ok: false, message: 'Network error while scoring. You can retry from the results page.' };
    }
  }

  /** Release everything without scoring (e.g. leaving the page before starting). */
  dispose() {
    this.#gen++;
    this.#closingDeliberately = true;
    this.#teardownPeer();
    this.#stopTicking();
    this.#cancelSave();
    this.#mic?.getTracks().forEach((t) => t.stop());
    window.removeEventListener('pagehide', this.#onPageHide);
    if (this.transcript.length) this.#beaconSave();
  }

  // -------------------------------------------------------------------------
  // WebRTC
  // -------------------------------------------------------------------------

  async #connect(clientSecret: string, gen: number) {
    this.#closingDeliberately = false;
    this.#responding = false;
    this.#pendingResponse = false;
    const pc = new RTCPeerConnection();
    this.#pc = pc;

    const audioEl = this.#audioEl ?? new Audio();
    audioEl.autoplay = true;
    audioEl.muted = false;
    this.#audioEl = audioEl;
    pc.ontrack = (e) => {
      audioEl.srcObject = e.streams[0];
      void audioEl.play().catch(() => {});
      this.#meters = this.#meters.filter((m) => m.kind !== 'remote');
      this.#meter(e.streams[0], (v) => (this.interviewerLevel = v), 'remote');
    };

    for (const track of this.#mic!.getAudioTracks()) {
      track.enabled = !this.muted;
      pc.addTrack(track, this.#mic!);
    }

    const dc = pc.createDataChannel('oai-events');
    this.#dc = dc;
    dc.onmessage = (e) => {
      try {
        this.#handle(JSON.parse(e.data) as ServerEvent);
      } catch (err) {
        console.warn('[realtime] bad event', err);
      }
    };
    let openTimer: ReturnType<typeof setTimeout> | undefined;
    const opened = new Promise<void>((resolve, reject) => {
      dc.onopen = () => resolve();
      openTimer = setTimeout(() => reject(new Error('Timed out connecting to the interviewer.')), 15_000);
    });
    // If we bail out before awaiting it, don't leave an unhandled rejection behind.
    opened.catch(() => {});
    dc.onclose = () => this.#onDrop();

    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === 'failed') this.#onDrop();
      else if (s === 'disconnected') {
        // "disconnected" often recovers by itself; give it a few seconds.
        this.#clearDropTimer();
        this.#dropTimer = setTimeout(() => {
          if (pc.connectionState !== 'connected') this.#onDrop();
        }, 5000);
      } else if (s === 'connected') this.#clearDropTimer();
    };

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const sdpRes = await fetch(REALTIME_URL, {
        method: 'POST',
        body: offer.sdp,
        headers: { Authorization: `Bearer ${clientSecret}`, 'Content-Type': 'application/sdp' }
      });
      if (!sdpRes.ok) {
        throw new Error(`OpenAI refused the connection (${sdpRes.status}). ${await sdpRes.text().catch(() => '')}`.trim());
      }
      const answer = await sdpRes.text();
      // Hung up or left while OpenAI was answering: don't complete the connection,
      // or the interviewer would start talking on a call nobody is in.
      if (gen !== this.#gen) {
        pc.close();
        return;
      }
      await pc.setRemoteDescription({ type: 'answer', sdp: answer });
      await opened;
    } finally {
      clearTimeout(openTimer);
    }
    if (gen !== this.#gen) {
      pc.close();
      return;
    }

    // The interviewer opens the call (or apologises for the drop when resuming).
    this.#send({ type: 'response.create' });
  }

  #onDrop() {
    if (this.#closingDeliberately || this.phase !== 'live') return;
    this.#clearDropTimer();
    this.#teardownPeer();
    // A call that stayed up for a while has earned its automatic retries back;
    // three drops spread over a long interview shouldn't force a manual reconnect.
    if (Date.now() - this.#liveSince > 120_000) this.reconnects = 0;
    if (this.reconnects >= MAX_AUTO_RECONNECTS) {
      this.phase = 'error';
      this.error = 'The connection keeps dropping. Check your network, then reconnect or end the interview.';
      return;
    }
    this.reconnects += 1;
    this.phase = 'reconnecting';
    void this.#save(true);
    const gen = this.#gen;
    setTimeout(() => {
      // Skip if the user hung up or left the page during the pause.
      if (gen === this.#gen && this.#mic && this.phase === 'reconnecting') void this.start(this.#mic);
    }, 800);
  }

  #teardownPeer() {
    this.#clearDropTimer();
    if (this.#dc) {
      this.#dc.onclose = null;
      this.#dc.onmessage = null;
      try {
        this.#dc.close();
      } catch {}
    }
    if (this.#pc) {
      this.#pc.onconnectionstatechange = null;
      this.#pc.getSenders().forEach((s) => {
        // Keep the mic track alive for a reconnect; only detach it.
        try {
          this.#pc?.removeTrack(s);
        } catch {}
      });
      this.#pc.close();
    }
    this.#dc = null;
    this.#pc = null;
    this.interviewerSpeaking = false;
    this.candidateSpeaking = false;
  }

  #clearDropTimer() {
    if (this.#dropTimer) clearTimeout(this.#dropTimer);
    this.#dropTimer = null;
  }

  /** Returns false when there is no open channel (e.g. mid-reconnect), so callers can retry later. */
  #send(event: Record<string, unknown>) {
    if (this.#dc?.readyState !== 'open') return false;
    this.#dc.send(JSON.stringify(event));
    return true;
  }

  /** Ask the interviewer to speak now, or as soon as its current response finishes. */
  #requestResponse() {
    if (this.#responding) this.#pendingResponse = true;
    // While the candidate is talking, the turn detector will start a response
    // when they stop, and it will see the note we just added.
    else if (!this.candidateSpeaking) this.#send({ type: 'response.create' });
  }

  // -------------------------------------------------------------------------
  // Realtime events → transcript
  // -------------------------------------------------------------------------

  #handle(ev: ServerEvent) {
    switch (ev.type) {
      case 'conversation.item.added': {
        const item = ev.item as { id: string; type: string; role?: string };
        if (item.type !== 'message' || (item.role !== 'user' && item.role !== 'assistant')) break;
        this.#upsert(item.id, item.role === 'user' ? 'candidate' : 'interviewer', null);
        break;
      }
      case 'conversation.item.input_audio_transcription.delta': {
        this.caption = {
          speaker: 'candidate',
          text: (this.caption?.speaker === 'candidate' ? this.caption.text : '') + String(ev.delta ?? '')
        };
        break;
      }
      case 'conversation.item.input_audio_transcription.completed': {
        this.#upsert(String(ev.item_id), 'candidate', String(ev.transcript ?? '').trim());
        if (this.caption?.speaker === 'candidate') this.caption = null;
        break;
      }
      case 'response.output_audio_transcript.delta': {
        this.caption = {
          speaker: 'interviewer',
          text: (this.caption?.speaker === 'interviewer' ? this.caption.text : '') + String(ev.delta ?? '')
        };
        break;
      }
      case 'response.output_audio_transcript.done': {
        this.#upsert(String(ev.item_id), 'interviewer', String(ev.transcript ?? '').trim());
        break;
      }
      case 'input_audio_buffer.speech_started':
        this.candidateSpeaking = true;
        this.markActive();
        break;
      case 'input_audio_buffer.speech_stopped':
        this.candidateSpeaking = false;
        this.markActive();
        break;
      case 'output_audio_buffer.started':
        this.interviewerSpeaking = true;
        break;
      case 'response.created':
        this.#responding = true;
        if (this.#timeUpSent) this.#closingTurn = true;
        break;
      case 'response.done':
        this.#responding = false;
        if (this.#pendingResponse) {
          this.#pendingResponse = false;
          this.#requestResponse();
        }
        break;
      case 'output_audio_buffer.stopped':
      case 'output_audio_buffer.cleared':
        this.interviewerSpeaking = false;
        if (this.caption?.speaker === 'interviewer') this.caption = null;
        // The closing line after "time is up" has finished playing: the call is over.
        if (ev.type === 'output_audio_buffer.stopped' && this.#closingTurn && !this.#responding) this.finished = true;
        break;
      case 'error': {
        const err = ev.error as { message?: string; code?: string } | undefined;
        console.warn('[realtime] error event', err);
        // Session expiry ends the socket; treat it as a drop so we resume.
        if (err?.code === 'session_expired') this.#onDrop();
        break;
      }
    }
  }

  /** Create or fill a transcript entry, keeping conversation order. */
  #upsert(id: string, speaker: TranscriptEntry['speaker'], text: string | null) {
    const i = this.transcript.findIndex((t) => t.id === id);
    if (i === -1) {
      this.transcript.push({ id, speaker, text: text ?? '', at: Math.max(0, Date.now() - this.#startedAt) });
    } else if (text !== null) {
      this.transcript[i].text = text;
    }
    if (text) this.#scheduleSave();
  }

  /** Wait (briefly) for a candidate answer whose transcription is still on its way. */
  async #awaitPendingTranscription(maxMs = 2500) {
    const pending = () =>
      this.#dc?.readyState === 'open' &&
      (this.caption?.speaker === 'candidate' ||
        this.transcript.some((t) => t.speaker === 'candidate' && !t.text.trim()));
    const until = Date.now() + maxMs;
    while (pending() && Date.now() < until) await new Promise((r) => setTimeout(r, 100));
  }

  #flushCaption() {
    // A candidate caption that never got its final transcription is still their
    // answer: keep the words we have rather than dropping them.
    const words = this.caption?.speaker === 'candidate' ? this.caption.text.trim() : '';
    if (words) {
      const row = this.transcript.findLast((t) => t.speaker === 'candidate' && !t.text.trim());
      if (row) row.text = words;
      else this.transcript.push({ id: `caption-${Date.now()}`, speaker: 'candidate', text: words, at: Math.max(0, Date.now() - this.#startedAt) });
    }
    // Drop placeholder rows that never got any words.
    this.transcript = this.transcript.filter((t) => t.text.trim());
    this.caption = null;
  }

  #cancelSave() {
    if (this.#saveTimer) clearTimeout(this.#saveTimer);
    this.#saveTimer = null;
  }

  // -------------------------------------------------------------------------
  // Saving
  // -------------------------------------------------------------------------

  #scheduleSave() {
    if (this.#saveTimer) clearTimeout(this.#saveTimer);
    this.#saveTimer = setTimeout(() => void this.#save(), SAVE_DEBOUNCE_MS);
  }

  async #save(force = false) {
    const transcript = this.transcript.filter((t) => t.text.trim());
    const json = JSON.stringify(transcript);
    if (!force && json === this.#lastSavedJson) return;
    try {
      const res = await fetch(`/api/interviews/${this.interviewId}/transcript`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ transcript })
      });
      if (res.ok) this.#lastSavedJson = json;
    } catch {
      // The next save (or the final one on hang-up) covers it.
    }
  }

  #beaconSave() {
    const transcript = this.transcript.filter((t) => t.text.trim());
    if (!transcript.length || this.phase === 'ended' || this.phase === 'ending') return;
    navigator.sendBeacon(
      `/api/interviews/${this.interviewId}/transcript`,
      new Blob([JSON.stringify({ transcript })], { type: 'text/plain' })
    );
  }

  // -------------------------------------------------------------------------
  // Timer and wrap-up
  // -------------------------------------------------------------------------

  #startTicking() {
    this.#stopTicking();
    this.#tickId = setInterval(() => {
      this.elapsedMs = Date.now() - this.#startedAt;
      const total = this.durationMinutes * 60_000;
      const left = total - this.elapsedMs;

      // Only mark a note as sent once it really went out: during a reconnect there
      // is no channel, and the note must reach the resumed session instead.
      if (!this.#wrapUpSent && left <= 2 * 60_000) {
        this.#wrapUpSent = this.#systemNote(
          'Time check: about two minutes are left. Finish the current topic, then invite the candidate to ask you a question.'
        );
      }
      if (!this.#timeUpSent && left <= 0) {
        this.#timeUpSent = this.#systemNote(
          'Time is up. Thank the candidate warmly and close the interview in one or two sentences.',
          true
        );
      }

      // Idle tracking. The clock only runs while it is the candidate's turn.
      if (this.interviewerSpeaking || this.candidateSpeaking) this.#lastActivity = Date.now();
      this.idleMs = Date.now() - this.#lastActivity;
      if (!this.#idleNudged && this.idleMs >= IDLE_NUDGE_MS) {
        this.#idleNudged = this.#systemNote(
          'The candidate has been silent for a minute. Ask briefly whether they are still there or need the question again.',
          true
        );
      }
      if (this.idleMs >= IDLE_END_MS) this.idleExpired = true;
    }, 1000);
  }

  #stopTicking() {
    if (this.#tickId) clearInterval(this.#tickId);
    this.#tickId = null;
  }

  #systemNote(text: string, respondNow = false) {
    const sent = this.#send({
      type: 'conversation.item.create',
      item: { type: 'message', role: 'system', content: [{ type: 'input_text', text }] }
    });
    // Before, response.create was skipped whenever the interviewer was mid-sentence,
    // so "time is up" could sit unanswered; and it was sent while a response was
    // still generating, which the API rejects. Queue it behind the current response.
    if (sent && respondNow) this.#requestResponse();
    return sent;
  }

  // -------------------------------------------------------------------------
  // Audio level meters (for the visualisers)
  // -------------------------------------------------------------------------

  #meters: { kind: 'mic' | 'remote'; analyser: AnalyserNode; data: Uint8Array<ArrayBuffer>; set: (v: number) => void }[] = [];

  #meter(stream: MediaStream, set: (v: number) => void, kind: 'mic' | 'remote' = 'mic') {
    try {
      this.#audioCtx ??= new AudioContext();
      const src = this.#audioCtx.createMediaStreamSource(stream);
      const analyser = this.#audioCtx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      this.#meters.push({ kind, analyser, data: new Uint8Array(analyser.fftSize), set });
      if (!this.#rafId) this.#loop();
    } catch {
      // Metering is cosmetic.
    }
  }

  #loop = () => {
    for (const m of this.#meters) {
      m.analyser.getByteTimeDomainData(m.data);
      let sum = 0;
      for (const v of m.data) {
        const x = (v - 128) / 128;
        sum += x * x;
      }
      const rms = Math.sqrt(sum / m.data.length);
      m.set(Math.min(1, rms * 4));
    }
    this.#rafId = requestAnimationFrame(this.#loop);
  };

  stopMeters() {
    cancelAnimationFrame(this.#rafId);
    this.#rafId = 0;
    this.#meters = [];
    void this.#audioCtx?.close().catch(() => {});
    this.#audioCtx = null;
  }
}

async function readError(res: Response) {
  try {
    const body = await res.json();
    return body?.message ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}
