// How the phone is being held, as a gentle tilt for the scene: x and y,
// each about -1..1. From the gyroscope where the browser allows it; from
// the pointer otherwise (a mouse on a laptop, or a finger dragging).
//
// Browsers only share motion sensors with secure (https) pages, and
// iPhones also ask permission, which needs a tap: enableMotion() is called
// from the first tap. On the doll's own http page, the pointer is used.

export const tilt = { x: 0, y: 0 }; // read every frame by the scene
let source: "none" | "pointer" | "gyro" = "none";
let base: { beta: number; gamma: number } | null = null;

function onOrientation(e: DeviceOrientationEvent) {
  if (e.beta === null || e.gamma === null) return;
  source = "gyro";
  // Measure from how the phone was first held, and let that drift slowly
  // so a new resting angle becomes the new "level".
  if (!base) base = { beta: e.beta, gamma: e.gamma };
  base.beta += (e.beta - base.beta) * 0.004;
  base.gamma += (e.gamma - base.gamma) * 0.004;
  tilt.x = clamp((e.gamma - base.gamma) / 22);
  tilt.y = clamp((e.beta - base.beta) / 22);
}

function onPointer(e: PointerEvent) {
  if (source === "gyro") return;
  source = "pointer";
  tilt.x = clamp((e.clientX / innerWidth) * 2 - 1);
  tilt.y = clamp((e.clientY / innerHeight) * 2 - 1);
}

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

let started = false;
export function startTilt() {
  if (started) return;
  started = true;
  addEventListener("pointermove", onPointer, { passive: true });
  if (window.isSecureContext && "DeviceOrientationEvent" in window) {
    const D = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    if (typeof D.requestPermission !== "function") addEventListener("deviceorientation", onOrientation);
  }
}

/** iPhones: ask for motion access. Must be called inside a tap. */
let asked = false;
export function enableMotion() {
  if (asked) return;
  asked = true;
  const D = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } }).DeviceOrientationEvent;
  if (!window.isSecureContext || typeof D?.requestPermission !== "function") return;
  D.requestPermission()
    .then((r) => { if (r === "granted") addEventListener("deviceorientation", onOrientation); })
    .catch(() => { /* declined: the pointer still works */ });
}
