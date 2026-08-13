/*
 * Synthesised interface sound.
 *
 * Everything here is generated with the Web Audio API — there are no audio
 * files in the bundle. That keeps the payload at zero, makes every sound
 * tunable as a number rather than as an asset, and means the palette can be
 * built from one small set of primitives so the whole thing sounds related.
 *
 * Two rules the browser imposes, and one we impose:
 *
 *   1. An AudioContext created before a user gesture starts suspended, so the
 *      context is built lazily on the first `enable()` — which is only ever
 *      called from a click.
 *   2. Sound is OFF until asked for. A site that makes noise on load is a site
 *      people close. The recorder in the header is the invitation.
 *   3. prefers-reduced-motion is treated as "and reduced everything else too":
 *      if it is set, we never auto-enable from a stored preference.
 *
 * The preference is persisted so it survives navigation, but the context is
 * still only resumed after a gesture in the new session.
 */

import { TRACKS, type Track } from "./tracks";

const STORAGE_KEY = "kura-sound";

type Voice = {
  ctx: AudioContext;
  master: GainNode;
};

let voice: Voice | null = null;
let enabled = false;
let ambient: { stop: () => void } | null = null;

const listeners = new Set<(on: boolean) => void>();

function notify() {
  listeners.forEach((fn) => fn(enabled));
}

/** Subscribe to on/off changes. Returns an unsubscribe. */
export function onSoundChange(fn: (on: boolean) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function isSoundOn(): boolean {
  return enabled;
}

/** What the last session chose. Never auto-enables under reduced motion. */
export function storedPreference(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

function ensureVoice(): Voice | null {
  if (voice) return voice;
  if (typeof window === "undefined") return null;

  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;

  const ctx = new Ctor();
  const master = ctx.createGain();
  // Everything is mixed well under unity — these are punctuation, not content.
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  voice = { ctx, master };
  return voice;
}

export function enable(): void {
  const v = ensureVoice();
  if (!v) return;
  void v.ctx.resume();
  enabled = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, "on");
  } catch {
    /* private mode — the session still works, it just will not persist */
  }
  notify();
}

export function disable(): void {
  enabled = false;
  ambient?.stop();
  ambient = null;
  try {
    window.localStorage.setItem(STORAGE_KEY, "off");
  } catch {
    /* ignore */
  }
  notify();
}

export function toggle(): boolean {
  if (enabled) disable();
  else enable();
  return enabled;
}

/* ------------------------------------------------------------------ voices */

/**
 * One short pitched blip. `type` shapes the timbre, and the envelope is a
 * fast attack into an exponential tail — the shape that reads as a "tick"
 * rather than as a note.
 */
function blip(freq: number, duration: number, gain: number, type: OscillatorType = "sine") {
  const v = voice;
  if (!enabled || !v) return;
  const { ctx, master } = v;
  const t = ctx.currentTime;

  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);

  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(gain, t + 0.006);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  osc.connect(amp).connect(master);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

/** A filtered noise transient — the "body" under a click. */
function tick(gain: number, cutoff: number) {
  const v = voice;
  if (!enabled || !v) return;
  const { ctx, master } = v;
  const t = ctx.currentTime;

  const len = Math.floor(ctx.sampleRate * 0.03);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    // Decaying white noise. Steep, so it reads as a click and not a hiss.
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 8);
  }

  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = cutoff;
  filter.Q.value = 1.1;
  const amp = ctx.createGain();
  amp.gain.value = gain;

  src.connect(filter).connect(amp).connect(master);
  src.start(t);
}

/* ------------------------------------------------------------------ palette */

/** Buttons, pills, menu rows. */
export function playClick(): void {
  tick(0.16, 2200);
  blip(880, 0.07, 0.045, "triangle");
}

/** Hover on an interactive element. Deliberately near the edge of audible. */
export function playHover(): void {
  blip(1580, 0.035, 0.012, "sine");
}

/** Route change — the plate wipe. Two notes, falling. */
export function playNavigate(): void {
  blip(660, 0.12, 0.05, "triangle");
  window.setTimeout(() => blip(440, 0.16, 0.04, "triangle"), 90);
}

/** The DVD logo striking a viewport edge. Vertical walls ring higher. */
export function playEdge(axis: "x" | "y"): void {
  blip(axis === "x" ? 523.25 : 392, 0.16, 0.055, "triangle");
  tick(0.05, 3200);
}

/**
 * Synthesised fallback pad. Two detuned saws through a slow lowpass, with a
 * gentle LFO on the cutoff so it breathes rather than sits. Used only when the
 * music files are absent — see startAmbient below.
 */
function startPad(): void {
  const v = voice;
  if (!enabled || !v) return;
  const { ctx, master } = v;
  const t = ctx.currentTime;

  const out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, t);
  out.gain.exponentialRampToValueAtTime(0.05, t + 1.4);
  out.connect(master);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 620;
  filter.Q.value = 0.7;
  filter.connect(out);

  // Cutoff LFO.
  const lfo = ctx.createOscillator();
  const lfoAmp = ctx.createGain();
  lfo.frequency.value = 0.08;
  lfoAmp.gain.value = 260;
  lfo.connect(lfoAmp).connect(filter.frequency);
  lfo.start(t);

  // A minor-ninth-ish stack, detuned so it beats slowly.
  const oscs = [110, 164.81, 220, 246.94].map((f, i) => {
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = f;
    o.detune.value = i % 2 === 0 ? -6 : 6;
    const g = ctx.createGain();
    g.gain.value = i === 0 ? 0.5 : 0.22;
    o.connect(g).connect(filter);
    o.start(t);
    return o;
  });

  ambient = {
    stop: () => {
      const now = ctx.currentTime;
      out.gain.cancelScheduledValues(now);
      out.gain.setValueAtTime(out.gain.value, now);
      out.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      oscs.forEach((o) => o.stop(now + 0.7));
      lfo.stop(now + 0.7);
    },
  };
}

/* ------------------------------------------------------------------- music */

/*
 * The track shuffle.
 *
 * Fisher-Yates over the whole list, played through, then reshuffled — rather
 * than picking at random each time. Independent random picks repeat tracks
 * back-to-back surprisingly often, which is exactly what people notice. The
 * only extra rule is that a reshuffle may not put the track that just played
 * first, so the seam between passes never repeats either.
 */
let queue: Track[] = [];
let queueIndex = 0;

function reshuffle(previous?: Track) {
  const next = [...TRACKS];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  if (next.length > 1 && previous && next[0].file === previous.file) {
    [next[0], next[1]] = [next[1], next[0]];
  }
  queue = next;
  queueIndex = 0;
}

function nextTrack(): Track | null {
  if (TRACKS.length === 0) return null;
  if (queueIndex >= queue.length) reshuffle(queue[queue.length - 1]);
  return queue[queueIndex++] ?? null;
}

/*
 * Music playback.
 *
 * An <audio> element routed through the graph's master gain rather than raw
 * `audio.volume`, so the existing mute and the interface sounds share one
 * output stage. A MediaElementSource can only be created once per element, so
 * the element and its node are made together and reused for every track.
 *
 * Missing files are the expected case until they are downloaded, so a failed
 * load is not an error: it advances to the next track, and if the whole list
 * fails the synth pad takes over.
 */
function startMusic(): boolean {
  const v = voice;
  if (!v || TRACKS.length === 0) return false;
  const { ctx, master } = v;

  let el: HTMLAudioElement;
  try {
    el = new Audio();
  } catch {
    return false;
  }
  el.crossOrigin = "anonymous";
  el.preload = "auto";

  const gain = ctx.createGain();
  gain.gain.value = 0.0001;
  gain.connect(master);

  let node: MediaElementAudioSourceNode;
  try {
    node = ctx.createMediaElementSource(el);
  } catch {
    return false;
  }
  node.connect(gain);

  let stopped = false;
  let failures = 0;

  const fadeTo = (value: number, seconds: number) => {
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, value), now + seconds);
  };

  const play = () => {
    if (stopped) return;
    const track = nextTrack();
    if (!track) return;
    el.src = track.file;
    fadeTo(0.28, 2.2);
    void el.play().catch(() => advance());
  };

  const advance = () => {
    if (stopped) return;
    // Every track failing means the files were never downloaded. Fall back
    // rather than spinning through the list forever.
    if (++failures > TRACKS.length) {
      cleanup();
      ambient = null;
      startPad();
      return;
    }
    play();
  };

  const onEnded = () => {
    failures = 0;
    play();
  };

  const cleanup = () => {
    stopped = true;
    el.removeEventListener("ended", onEnded);
    el.removeEventListener("error", advance);
    el.pause();
    el.src = "";
  };

  el.addEventListener("ended", onEnded);
  el.addEventListener("error", advance);

  ambient = {
    stop: () => {
      fadeTo(0.0001, 0.7);
      window.setTimeout(cleanup, 750);
    },
  };

  play();
  return true;
}

/**
 * Start background audio: the music if it is available, the synthesised pad if
 * it is not. Called by the header recorder.
 */
export function startAmbient(): void {
  if (!enabled || !voice || ambient) return;
  if (startMusic()) return;
  startPad();
}

export function stopAmbient(): void {
  ambient?.stop();
  ambient = null;
}

export function isAmbientOn(): boolean {
  return ambient !== null;
}
