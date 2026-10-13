// The doll's LED, for the demo: led.h's ledUpdate() and its settings from
// config.h, ported to TypeScript so the copy on screen moves exactly like
// the real one. Returns red, green, blue, each 0..1 as the eye sees it.
import type { SimulatedDoll } from "../doll/simulatedDoll";

const BREATH_MS = 4000, WAITING_MAX = 0.4;
const BEAT_MS = 1000, HEART_FLOOR = 0.06;
const CONNECTED_LEVEL = 0.6, TOGETHER_LEVEL = 1.0;
const NOPHONE_PERIOD_MS = 2000, NOPHONE_ON_MS = 120, NOPHONE_LEVEL = 0.6;
const FLASH_MS = 150;

const bump = (t: number, center: number, width: number) => Math.exp(-(((t - center) / width) ** 2));

function breath(now: number) {
  const phase = (now % BREATH_MS) / BREATH_MS;
  return ((1 - Math.cos(2 * Math.PI * phase)) / 2) * WAITING_MAX;
}

function heartbeat(now: number) {
  const t = now % BEAT_MS;
  return HEART_FLOOR + (1 - HEART_FLOOR) * Math.max(bump(t, 120, 55), 0.6 * bump(t, 360, 70));
}

export function ledLevel(doll: SimulatedDoll, now: number): [number, number, number] {
  if (doll.unplugged) return [0, 0, 0];
  // 1. The white acknowledgement flash after a button press.
  if (now - doll.flashAt < FLASH_MS) return [1, 1, 1];
  // 2. A short blue blink while no phone is connected.
  if (!doll.phoneConnected && now % NOPHONE_PERIOD_MS < NOPHONE_ON_MS) return [0, 0, NOPHONE_LEVEL];
  // 3. The pattern for the current state.
  switch (doll.state) {
    case "waiting": return [breath(now), 0, 0];
    case "connected": return [heartbeat(now) * CONNECTED_LEVEL, 0, 0];
    case "together": return [heartbeat(now) * TOGETHER_LEVEL, 0, 0];
    default: return [0, 0, 0];
  }
}
