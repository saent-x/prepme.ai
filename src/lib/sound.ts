/**
 * Spark sounds. Used sparingly: only these nine moments make a sound. Clicks, taps and navigation stay silent.
 *
 *   start, end       a live interview starts or ends
 *   notify           something needs you (the "still there?" check in a call)
 *   success          a scorecard is ready
 *   xp, level,       rewards
 *   badge, streak
 *   error            something failed
 *
 * notify and success are clips from SND kit 01 by Yasuhiro Tsuchiya (snd.dev, free for commercial use).
 * The others are synthesised here with Web Audio, so there is nothing else to download.
 * The mute choice is kept on this device. During a live call only start, end, notify ("still there?") and error can play.
 */

export type SoundEvent = 'start' | 'end' | 'notify' | 'success' | 'xp' | 'level' | 'badge' | 'streak' | 'error';

const KEY = 'prepme:sound';
const CLIPS: Partial<Record<SoundEvent, { src: string; gain: number }>> = {
  notify: { src: '/sounds/notify.mp3', gain: 1 },
  success: { src: '/sounds/success.mp3', gain: 0.8 }
};

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
const buffers = new Map<string, Promise<AudioBuffer | null>>();
let inCall = false;

function load(): { muted: boolean; volume: number } {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { muted: saved.muted === true, volume: typeof saved.volume === 'number' ? saved.volume : 0.6 };
  } catch {
    return { muted: false, volume: 0.6 };
  }
}
const settings = typeof window === 'undefined' ? { muted: true, volume: 0.6 } : load();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* storage blocked: the choice lasts for this visit only */
  }
}

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    master = ctx.createGain();
    master.gain.value = settings.volume;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function clip(src: string): Promise<AudioBuffer | null> {
  let p = buffers.get(src);
  if (!p) {
    const c = audio();
    if (!c) return Promise.resolve(null);
    p = fetch(src)
      .then((r) => r.arrayBuffer())
      .then((b) => c.decodeAudioData(b))
      .catch(() => {
        buffers.delete(src);
        return null;
      });
    buffers.set(src, p);
  }
  return p;
}

/** One soft synth note with a quick attack and an exponential release. */
function tone(f: number, t0: number, dur: number, o: { gain?: number; type?: OscillatorType; to?: number; glide?: number; bell?: boolean; pan?: number } = {}) {
  const c = ctx!;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(f, t0);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + (o.glide ?? dur));
  const peak = o.gain ?? 0.18;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  if (o.pan != null && c.createStereoPanner) {
    const p = c.createStereoPanner();
    p.pan.value = o.pan;
    g.connect(p);
    p.connect(master!);
  } else g.connect(master!);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
  if (o.bell) {
    tone(f * 2.76, t0, dur * 0.5, { gain: peak * 0.18 });
    tone(f * 5.4, t0, dur * 0.25, { gain: peak * 0.06 });
  }
}

function noise(t0: number, dur: number, from: number, to: number, gain: number) {
  const c = ctx!;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource();
  const f = c.createBiquadFilter();
  const g = c.createGain();
  s.buffer = buf;
  f.type = 'bandpass';
  f.Q.value = 1.2;
  f.frequency.setValueAtTime(from, t0);
  f.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + dur * 0.35);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f);
  f.connect(g);
  g.connect(master!);
  s.start(t0);
  s.stop(t0 + dur);
}

const N = { C4: 261.63, E4: 329.63, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5, E6: 1318.5, G6: 1568, C7: 2093 };
const SYNTH: Partial<Record<SoundEvent, (t: number) => void>> = {
  start: (t) => [N.C5, N.E5, N.G5].forEach((f, i) => tone(f, t + i * 0.12, 0.16, { gain: 0.12 })),
  end: (t) => [N.G5, N.E5, N.C5].forEach((f, i) => tone(f, t + i * 0.12, 0.16, { gain: 0.12 })),
  error: (t) => {
    tone(N.E4, t, 0.14, { gain: 0.12, type: 'triangle' });
    tone(N.C4, t + 0.11, 0.2, { gain: 0.12, type: 'triangle' });
  },
  xp: (t) => {
    tone(N.A5, t, 0.22, { to: N.E6, glide: 0.08, gain: 0.12, bell: true });
    tone(N.E6, t + 0.07, 0.3, { gain: 0.07, bell: true });
  },
  level: (t) => {
    [N.C5, N.E5, N.G5, N.C6].forEach((f, i) => tone(f, t + i * 0.085, 0.5, { gain: 0.13, bell: true, pan: -0.3 + i * 0.2 }));
    tone(N.C6, t + 0.34, 0.8, { gain: 0.08, type: 'triangle' });
  },
  badge: (t) => {
    [N.G6, N.C7, N.E6, N.G6].forEach((f, i) => tone(f, t + i * 0.06, 0.25, { gain: 0.05, pan: i % 2 ? 0.4 : -0.4 }));
    [N.C5, N.E5, N.G5].forEach((f) => tone(f, t + 0.26, 0.7, { gain: 0.08, bell: true }));
  },
  streak: (t) => {
    noise(t, 0.32, 300, 4000, 0.08);
    tone(N.G5, t + 0.18, 0.4, { gain: 0.12, bell: true });
    tone(N.D5, t + 0.18, 0.4, { gain: 0.06 });
  }
};

const CALL_SAFE: SoundEvent[] = ['start', 'end', 'notify', 'error'];

export const sound = {
  play(event: SoundEvent) {
    if (settings.muted) return;
    if (inCall && !CALL_SAFE.includes(event)) return;
    const c = audio();
    if (!c || !master) return;
    const clipDef = CLIPS[event];
    if (clipDef) {
      void clip(clipDef.src).then((buf) => {
        if (!buf || !ctx || !master) return;
        const s = ctx.createBufferSource();
        const g = ctx.createGain();
        g.gain.value = clipDef.gain;
        s.buffer = buf;
        s.connect(g);
        g.connect(master);
        s.start();
      });
      return;
    }
    SYNTH[event]?.(c.currentTime + 0.01);
  },
  /** Fetch the clips ahead of time, so the first one plays on cue. */
  preload() {
    for (const c of Object.values(CLIPS)) if (c) void clip(c.src);
  },
  get muted() {
    return settings.muted;
  },
  setMuted(muted: boolean) {
    settings.muted = muted;
    save();
  },
  /** While a live call runs, rewards and notifications stay quiet so they never talk over the interviewer. */
  setInCall(on: boolean) {
    inCall = on;
  }
};
