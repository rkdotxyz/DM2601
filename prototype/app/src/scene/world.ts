// The scene's per-frame state, shared by its parts through a ref (so a
// moving scene never re-renders React). The Director advances it; the
// heart, tubes and figures read it.
import { Flow } from "./flow";

export type World = {
  flow: Flow;
  them: boolean;
  you: boolean;
  dollState: string; //   the doll's own state name, for its LED
  calm: boolean; //       reduced motion
  pending: boolean; //    your tap is waiting for the doll's answer
  brimming: boolean; //   both here and the heart is full: it beats
  beat: number; //        0..1, the lub-dub pulse right now
  glow: number; //        0..1, how much the heart glows
  tapAt: number; //       when you last tapped yourself (clock seconds)
  heartPingAt: number; // when the doll person last pressed Heart
  rigVel: { x: number; y: number }; // how fast the scene is tilting
};

export function createWorld(): World {
  return {
    flow: new Flow(),
    them: false, you: false, dollState: "idle", calm: false, pending: false,
    brimming: false, beat: 0, glow: 0,
    tapAt: -10, heartPingAt: -10,
    rigVel: { x: 0, y: 0 },
  };
}

/** A smooth bump centred on c, as in the doll's LED code. */
export const bump = (t: number, c: number, w: number) => Math.exp(-(((t - c) / w) ** 2));

/** The heartbeat shape, 0..1, for a phase 0..1 (one beat per second). */
export const lubDub = (phase: number) => Math.max(bump(phase, 0.12, 0.055), 0.6 * bump(phase, 0.36, 0.07));
