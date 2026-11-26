/**
 * Records one spoken answer from the microphone, for "redo an answer". The
 * recording stays in the browser until it is sent for scoring.
 */

/** Formats OpenAI can transcribe, in the order to try them. Safari only records MP4. */
const FORMATS = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];

export type Recording = { blob: Blob; seconds: number };

export class AnswerRecorder {
  /** Whole seconds recorded so far. */
  seconds = $state(0);
  /** Microphone level, 0..1, for the meter. */
  level = $state(0);
  recording = $state(false);

  #limit: number;
  #onLimit: () => void;
  #stream: MediaStream | null = null;
  #recorder: MediaRecorder | null = null;
  #chunks: Blob[] = [];
  #ctx: AudioContext | null = null;
  #raf = 0;
  #timer: ReturnType<typeof setInterval> | undefined;
  #startedAt = 0;

  /** `onLimit` is called once when the time limit is reached; the caller then stops and sends. */
  constructor(limitSeconds: number, onLimit: () => void) {
    this.#limit = limitSeconds;
    this.#onLimit = onLimit;
  }

  static get supported() {
    return (
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== 'undefined'
    );
  }

  /** Ask for the microphone and start. Throws a message the screen can show. */
  async start() {
    this.cancel();
    try {
      this.#stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
    } catch (e) {
      throw new Error(
        e instanceof DOMException && e.name === 'NotAllowedError'
          ? 'Microphone access is blocked. Allow it in your browser’s address bar, then try again.'
          : 'No microphone found. Plug one in, or type your answer instead.'
      );
    }
    const mimeType = FORMATS.find((f) => MediaRecorder.isTypeSupported(f));
    // Speech needs little: 32 kbps keeps two minutes under half a megabyte.
    this.#recorder = new MediaRecorder(this.#stream, { mimeType, audioBitsPerSecond: 32_000 });
    this.#chunks = [];
    this.#recorder.ondataavailable = (e) => {
      if (e.data.size) this.#chunks.push(e.data);
    };
    this.#recorder.start(1000);
    this.#startedAt = Date.now();
    this.seconds = 0;
    this.recording = true;
    this.#timer = setInterval(() => {
      this.seconds = Math.floor((Date.now() - this.#startedAt) / 1000);
      if (this.seconds >= this.#limit) {
        clearInterval(this.#timer);
        this.#onLimit();
      }
    }, 250);
    this.#meter(this.#stream);
  }

  /** Stop and hand back the recording, or null when nothing was recorded. */
  async stop(): Promise<Recording | null> {
    const recorder = this.#recorder;
    if (!recorder || recorder.state === 'inactive') {
      this.cancel();
      return null;
    }
    const seconds = Math.min(this.#limit, Math.round((Date.now() - this.#startedAt) / 1000));
    const done = new Promise<void>((resolve) => (recorder.onstop = () => resolve()));
    recorder.stop();
    await done;
    const blob = new Blob(this.#chunks, { type: recorder.mimeType || 'audio/webm' });
    this.cancel();
    return blob.size ? { blob, seconds } : null;
  }

  /** Stop without keeping anything and let go of the microphone. */
  cancel() {
    clearInterval(this.#timer);
    // Also called while the page is rendered on the server, where there is nothing to stop.
    if (this.#raf) cancelAnimationFrame(this.#raf);
    this.#raf = 0;
    if (this.#recorder && this.#recorder.state !== 'inactive') {
      this.#recorder.onstop = null;
      this.#recorder.stop();
    }
    this.#recorder = null;
    this.#stream?.getTracks().forEach((t) => t.stop());
    this.#stream = null;
    void this.#ctx?.close().catch(() => {});
    this.#ctx = null;
    this.#chunks = [];
    this.recording = false;
    this.level = 0;
  }

  #meter(stream: MediaStream) {
    this.#ctx = new AudioContext();
    const analyser = this.#ctx.createAnalyser();
    analyser.fftSize = 512;
    this.#ctx.createMediaStreamSource(stream).connect(analyser);
    const buf = new Uint8Array(analyser.fftSize);
    const loop = () => {
      analyser.getByteTimeDomainData(buf);
      let s = 0;
      for (const v of buf) s += ((v - 128) / 128) ** 2;
      this.level = Math.min(1, Math.sqrt(s / buf.length) * 4);
      this.#raf = requestAnimationFrame(loop);
    };
    loop();
  }
}
