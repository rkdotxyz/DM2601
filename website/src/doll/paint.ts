import * as THREE from 'three'
import { PROFILE_LENGTH, radiusAt } from './profile'

/*
  Drawing on the doll. The body's UVs wrap around it: u goes around
  (the front is u = 0.5), v goes from the base to the tip. Strokes are
  painted into this canvas at the touched UV, and a transparent copy of
  the body shows it.

  Around the body, one pixel covers more fabric where the body is wide
  than near the tip, so each dab is stretched to stay round on the doll.
*/

const W = 2048
const H = 1024

const canvas = document.createElement('canvas')
canvas.width = W
canvas.height = H
const ctx = canvas.getContext('2d')!

export const paintTexture = new THREE.CanvasTexture(canvas)
paintTexture.colorSpace = THREE.SRGBColorSpace
paintTexture.anisotropy = 8

export interface PaintPoint {
  u: number
  v: number
  /** Height on the body, in body units. */
  y: number
}

let last: PaintPoint | null = null

export function clearPaint() {
  ctx.clearRect(0, 0, W, H)
  paintTexture.needsUpdate = true
  last = null
}

export function endStroke() {
  last = null
}

function dab(p: PaintPoint, size: number) {
  const r = Math.max(radiusAt(p.y), 0.02)
  const rx = Math.min((size / (2 * Math.PI * r)) * W, W * 0.08)
  const ry = (size / PROFILE_LENGTH) * H
  const x = p.u * W
  const y = (1 - p.v) * H
  for (const dx of [0, -W, W]) {
    if (x + dx + rx < 0 || x + dx - rx > W) continue
    ctx.beginPath()
    ctx.ellipse(x + dx, y, rx, ry, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}

/** Paint from the previous point of this stroke to p. */
export function paintTo(p: PaintPoint, colour: string, size: number, erase: boolean) {
  ctx.globalCompositeOperation = erase ? 'destination-out' : 'source-over'
  ctx.fillStyle = erase ? '#000' : colour
  if (last && Math.abs(p.u - last.u) < 0.5) {
    const du = (p.u - last.u) * W
    const dv = (p.v - last.v) * H
    const step = Math.max(1, (size / PROFILE_LENGTH) * H * 0.35)
    const n = Math.min(200, Math.ceil(Math.hypot(du, dv) / step))
    for (let i = 1; i <= n; i++) {
      const t = i / n
      dab({ u: last.u + (p.u - last.u) * t, v: last.v + (p.v - last.v) * t, y: last.y + (p.y - last.y) * t }, size)
    }
  } else {
    dab(p, size)
  }
  ctx.globalCompositeOperation = 'source-over'
  last = p
  paintTexture.needsUpdate = true
}
