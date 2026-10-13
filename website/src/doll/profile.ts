import * as THREE from 'three'

/*
  The doll's body is a surface of revolution: one profile curve, spun
  around the vertical axis. Everything else (the face, the heart, hats,
  glasses) is placed relative to that curve, so it all sits on the body.

  The profile is egg-like: widest about a third of the way up, a soft
  round base, and a gently pointed top, like the sewn doll.
*/

export const BODY_HEIGHT = 2
export const BODY_RADIUS = 0.74

const A = 0.13 // roundness of the base
const B = 0.42 // pointiness of the top
const PEAK = A / (A + B)
const PEAK_VALUE = Math.pow(PEAK, A) * Math.pow(1 - PEAK, B)

/** Radius of the body at height y (0 = base, BODY_HEIGHT = top). */
export function radiusAt(y: number): number {
  const s = THREE.MathUtils.clamp(y / BODY_HEIGHT, 0, 1)
  return (BODY_RADIUS * Math.pow(s, A) * Math.pow(1 - s, B)) / PEAK_VALUE
}

/** Slope of the profile, dr/dy. */
export function slopeAt(y: number): number {
  const h = 0.002
  return (radiusAt(y + h) - radiusAt(y - h)) / (2 * h)
}

/**
 * A point on the body's surface. theta = 0 is the front (+z), positive
 * theta turns towards +x (the doll's left, the viewer's right).
 */
export function surfacePoint(theta: number, y: number, offset = 0): THREE.Vector3 {
  const r = radiusAt(y) + offset
  return new THREE.Vector3(r * Math.sin(theta), y, r * Math.cos(theta))
}

/** Outward surface normal at (theta, y). */
export function surfaceNormal(theta: number, y: number): THREE.Vector3 {
  return new THREE.Vector3(Math.sin(theta), -slopeAt(y), Math.cos(theta)).normalize()
}

/** A rotation that turns local +z to face along the surface normal, keeping +y roughly up. */
export function surfaceQuaternion(theta: number, y: number): THREE.Quaternion {
  const n = surfaceNormal(theta, y)
  // Matrix4.lookAt makes +z point from the target to the eye: here, along n.
  const m = new THREE.Matrix4().lookAt(n, new THREE.Vector3(), new THREE.Vector3(0, 1, 0))
  return new THREE.Quaternion().setFromRotationMatrix(m)
}

/** The y where the body's radius first drops to r, searching down from the top. */
export function heightForRadius(r: number): number {
  for (let y = BODY_HEIGHT; y > 0; y -= 0.002) {
    if (radiusAt(y) >= r) return y
  }
  return 0
}

/*
  Profile points, evenly spaced along the curve's length. LatheGeometry
  sets v from the point index, so even spacing makes v proportional to
  distance along the body: brush strokes and stickers keep their shape.
*/
const DENSE = 800
const dense: THREE.Vector2[] = []
for (let i = 0; i <= DENSE; i++) {
  const t = i / DENSE
  // Ease the samples towards both ends, where the curve turns fastest.
  const y = BODY_HEIGHT * (0.5 - 0.5 * Math.cos(Math.PI * t))
  dense.push(new THREE.Vector2(radiusAt(y), y))
}
const cumulative = [0]
for (let i = 1; i < dense.length; i++) cumulative.push(cumulative[i - 1] + dense[i].distanceTo(dense[i - 1]))

/** Total length of the profile curve, base centre to tip. */
export const PROFILE_LENGTH = cumulative[cumulative.length - 1]

export function profilePoints(count: number): THREE.Vector2[] {
  const out: THREE.Vector2[] = []
  let j = 0
  for (let i = 0; i < count; i++) {
    const target = (i / (count - 1)) * PROFILE_LENGTH
    while (j < cumulative.length - 2 && cumulative[j + 1] < target) j++
    const span = cumulative[j + 1] - cumulative[j] || 1
    const k = (target - cumulative[j]) / span
    out.push(new THREE.Vector2().lerpVectors(dense[j], dense[j + 1], k))
  }
  out[0].set(0, 0)
  out[out.length - 1].set(0, BODY_HEIGHT)
  return out
}

/**
 * The body geometry. phiStart = PI puts the texture seam (u = 0 / 1) at
 * the back, so the front of the doll is the middle of the paint canvas.
 */
export function createBodyGeometry(): THREE.LatheGeometry {
  return new THREE.LatheGeometry(profilePoints(120), 128, Math.PI, Math.PI * 2)
}

/** Where things sit on the front of the doll. */
export const FACE = {
  eyeY: 1.36,
  eyeX: 0.14,
  heartY: 0.97,
}
