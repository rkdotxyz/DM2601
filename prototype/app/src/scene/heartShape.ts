// The heart, as 3D geometry: the outline from the original app, extruded
// with a deep rounded bevel so it reads as a puffy glass vessel.
import * as THREE from "three";

// The outline in the original SVG units (x 4..96, y 4..88, y pointing down).
function outline(scale: number) {
  const s = new THREE.Shape();
  const P = (x: number, y: number) => [((x - 50) / 50) * scale, (-(y - 47) / 50) * scale] as const;
  s.moveTo(...P(50, 88));
  s.bezierCurveTo(...P(20, 66), ...P(4, 50), ...P(4, 30));
  s.bezierCurveTo(...P(4, 15), ...P(15, 4), ...P(29, 4));
  s.bezierCurveTo(...P(38, 4), ...P(46, 9), ...P(50, 17));
  s.bezierCurveTo(...P(54, 9), ...P(62, 4), ...P(71, 4));
  s.bezierCurveTo(...P(85, 4), ...P(96, 15), ...P(96, 30));
  s.bezierCurveTo(...P(96, 50), ...P(80, 66), ...P(50, 88));
  return s;
}

/** Half the heart's width, in scene units. */
export const HEART_SIZE = 0.92;

export function heartGeometry(inset = 0) {
  const shape = outline(HEART_SIZE - inset);
  const bevel = 0.3 - inset * 0.9;
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: Math.max(0.02, 0.16 - inset),
    bevelSegments: 14,
    curveSegments: 72,
  });
  geo.center();
  geo.computeVertexNormals();
  return geo;
}

// Where things are on the heart, in its own coordinates (after center()).
// The outline's bounding box is y 4..88 in SVG units; center() puts its
// middle (46) at 0. Measured from that.
const toY = (svgY: number) => (-(svgY - 46) / 50) * HEART_SIZE;
export const HEART_TOP_Y = toY(4) + 0.16; //  top of the lobes, with the bevel
export const HEART_TIP_Y = toY(88) - 0.16; // the bottom point, with the bevel
export const HEART_NOTCH_Y = toY(17) + 0.12; // the dip between the lobes

// The heart is wider at the top, so a volume (0..1) isn't a height. This
// measures the outline's width at many heights once, and turns volume into
// the liquid's height with a lookup.
const table: number[] = (() => {
  const pts = outline(1).getPoints(240);
  const ys = pts.map((p) => p.y);
  const y0 = Math.min(...ys), y1 = Math.max(...ys);
  const N = 200;
  const widths: number[] = [];
  for (let i = 0; i <= N; i++) {
    const y = y0 + ((y1 - y0) * i) / N;
    const xs: number[] = [];
    for (let k = 0; k < pts.length; k++) {
      const a = pts[k], b = pts[(k + 1) % pts.length];
      if ((a.y - y) * (b.y - y) <= 0 && a.y !== b.y) xs.push(a.x + ((y - a.y) / (b.y - a.y)) * (b.x - a.x));
    }
    xs.sort((m, n) => m - n);
    let w = 0;
    for (let k = 0; k + 1 < xs.length; k += 2) w += xs[k + 1] - xs[k];
    widths.push(w);
  }
  const area = [0];
  for (let i = 1; i <= N; i++) area.push(area[i - 1] + (widths[i] + widths[i - 1]) / 2);
  return area.map((a) => a / area[N]); // cumulative volume at each height step
})();

/** Fill height 0..1 (tip to top) for a volume 0..1. */
export function heightForVolume(v: number) {
  if (v <= 0) return 0;
  if (v >= 1) return 1;
  let lo = 0, hi = table.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (table[mid] < v) lo = mid; else hi = mid;
  }
  const f = (v - table[lo]) / (table[hi] - table[lo] || 1);
  return (lo + f) / (table.length - 1);
}
