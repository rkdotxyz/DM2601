// Your photo, for the locket. A stock portrait until you pick your own;
// yours is shrunk to a small square and kept on this phone only.
import defaultPhoto from "../assets/you.jpg";

const KEY = "heartdoll.photo";
const SIZE = 320;
const listeners = new Set<() => void>();

let current: string = (() => {
  try { return localStorage.getItem(KEY) || defaultPhoto; } catch { return defaultPhoto; }
})();

export function getPhoto() { return current; }
export function isCustomPhoto() { return current !== defaultPhoto; }

export function subscribePhoto(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

function set(url: string) {
  current = url;
  listeners.forEach((fn) => fn());
}

/** Crop a picked image to a centred square, shrink it, and keep it. */
export async function choosePhoto(file: File) {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  // A portrait's face is usually in the upper part: crop a little high.
  const sx = (bitmap.width - side) / 2;
  const sy = Math.max(0, (bitmap.height - side) * 0.3);
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, SIZE, SIZE);
  const url = canvas.toDataURL("image/jpeg", 0.85);
  try { localStorage.setItem(KEY, url); } catch { /* full or private: still use it now */ }
  set(url);
}

export function resetPhoto() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  set(defaultPhoto);
}
