// Every sound is synthesised with Web Audio: no audio files, so it all
// works offline on the doll and adds almost nothing to the app's size.
// Browsers only allow sound after a tap, so unlock() is called from the
// first one.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
try { muted = localStorage.getItem("heartdoll.muted") === "1"; } catch { /* private mode */ }

export function isMuted() { return muted; }

export function setMuted(on: boolean) {
  muted = on;
  try { localStorage.setItem("heartdoll.muted", on ? "1" : "0"); } catch { /* ignore */ }
  if (master && ctx) master.gain.setTargetAtTime(on ? 0 : 0.9, ctx.currentTime, 0.05);
}

/** Call from a user gesture. Safe to call often. */
export function unlock() {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.9;
    // A gentle limiter so overlapping sounds never clip.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 6;
    master.connect(comp).connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
}

function ready() {
  return ctx && master && ctx.state === "running" && !muted ? { ctx, out: master } : null;
}

/** One enveloped oscillator. */
function tone(freq: number, opts: { type?: OscillatorType; gain?: number; attack?: number; decay?: number; at?: number; slideTo?: number; slideS?: number }) {
  const a = ready();
  if (!a) return;
  const { ctx, out } = a;
  const t = ctx.currentTime + (opts.at ?? 0);
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(freq, t);
  if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t + (opts.slideS ?? 0.1));
  const peak = opts.gain ?? 0.2, attack = opts.attack ?? 0.005, decay = opts.decay ?? 0.3;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  osc.connect(g).connect(out);
  osc.start(t);
  osc.stop(t + attack + decay + 0.05);
}

/** A soft glass tick: tapping yourself. */
export function tick() {
  tone(1760, { gain: 0.06, decay: 0.09 });
  tone(2637, { gain: 0.03, decay: 0.06 });
}

/** The lub-dub, felt more than heard. */
export function heartbeat(strength = 1) {
  tone(62, { gain: 0.5 * strength, attack: 0.008, decay: 0.16, slideTo: 38, slideS: 0.14 });
  tone(124, { gain: 0.08 * strength, attack: 0.004, decay: 0.06 });
  tone(70, { gain: 0.3 * strength, attack: 0.008, decay: 0.13, slideTo: 42, slideS: 0.12, at: 0.24 });
}

/** A liquid bloop as a pour reaches the heart. */
export function bloop(pitch = 1) {
  tone(320 * pitch, { gain: 0.07, attack: 0.004, decay: 0.12, slideTo: 720 * pitch, slideS: 0.09 });
}

/** A small bell: the doll person pressed Heart. */
export function chime() {
  [880, 1318.5].forEach((f, i) => tone(f, { gain: 0.07, attack: 0.004, decay: 1.1, at: i * 0.09 }));
  tone(2637, { gain: 0.015, decay: 0.5 });
}

/** A low, warm chord as the heart becomes full. */
export function together() {
  [261.6, 392, 523.3, 659.3].forEach((f, i) =>
    tone(f, { type: "triangle", gain: 0.045, attack: 0.25 + i * 0.05, decay: 2.4, at: i * 0.07 }));
}

/** A soft falling note: someone stepped away. */
export function apart() {
  tone(523.3, { type: "triangle", gain: 0.04, attack: 0.02, decay: 0.7, slideTo: 392, slideS: 0.5 });
}

// ----- the sound of liquid moving through a tube -------------------------
let pour: { src: AudioBufferSourceNode; gain: GainNode; filter: BiquadFilterNode } | null = null;

/** 0 = silent, 1 = a full pour. Call every frame; it glides. */
export function pourLevel(level: number) {
  const a = ready();
  if (!a) { if (pour && ctx) pour.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05); return; }
  const { ctx: c, out } = a;
  if (!pour) {
    const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) { last = last * 0.97 + (Math.random() * 2 - 1) * 0.03; d[i] = last * 6; }
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 500;
    filter.Q.value = 1.4;
    const gain = c.createGain();
    gain.gain.value = 0;
    src.connect(filter).connect(gain).connect(out);
    src.start();
    pour = { src, gain, filter };
  }
  pour.gain.gain.setTargetAtTime(level * 0.22, c.currentTime, 0.08);
  pour.filter.frequency.setTargetAtTime(380 + level * 420 + Math.random() * 120, c.currentTime, 0.05);
}
