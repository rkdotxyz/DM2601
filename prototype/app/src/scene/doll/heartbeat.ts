// Copied from website/src/doll/heartbeat.ts: the doll's LED timings from
// firmware/heart_doll/led.h, so the doll in the app glows like the real one.
/*
  The heart's light, with the same timing as the firmware's led.h:
    waiting    slow breathing, 4 s per breath, 40% peak
    connected  lub-dub heartbeat at 60 BPM, 60% bright
    together   the same heartbeat at 100%
    idle       off
*/

const BREATH_MS = 4000
const WAITING_MAX = 0.4
const BEAT_MS = 1000
const HEART_FLOOR = 0.06
const CONNECTED_LEVEL = 0.6
const TOGETHER_LEVEL = 1

function bump(t: number, center: number, width: number) {
  const x = (t - center) / width
  return Math.exp(-x * x)
}

export function breathLevel(ms: number) {
  const phase = (ms % BREATH_MS) / BREATH_MS
  return ((1 - Math.cos(2 * Math.PI * phase)) / 2) * WAITING_MAX
}

export function heartbeatLevel(ms: number) {
  const t = ms % BEAT_MS
  const lub = bump(t, 120, 55)
  const dub = 0.6 * bump(t, 360, 70)
  return HEART_FLOOR + (1 - HEART_FLOOR) * Math.max(lub, dub)
}

/** Brightness 0..1 for a state at time ms. */
export function heartLevel(state: string, ms: number) {
  switch (state) {
    case 'waiting':
      return breathLevel(ms)
    case 'connected':
      return heartbeatLevel(ms) * CONNECTED_LEVEL
    case 'together':
      return heartbeatLevel(ms) * TOGETHER_LEVEL
    default:
      return 0
  }
}
