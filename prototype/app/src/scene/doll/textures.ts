// Copied from website/src/doll/textures.ts (the Heart Doll customiser): the
// textures the app's doll needs. Keep the two in step.
import * as THREE from 'three'

/*
  Every texture is drawn on a canvas at start-up: no image files to load,
  and everything stays editable in code.
*/

function canvas(w: number, h = w): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!]
}

function texture(c: HTMLCanvasElement, colour = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c)
  if (colour) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

const cache = new Map<string, THREE.Texture>()
function cached<T extends THREE.Texture>(key: string, make: () => T): T {
  if (!cache.has(key)) cache.set(key, make())
  return cache.get(key) as T
}

/** Classic parametric heart, centred, about 32 units wide and 30 tall. */
export function heartPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number, wobble = 0) {
  ctx.beginPath()
  for (let i = 0; i <= 120; i++) {
    const t = (i / 120) * Math.PI * 2
    const w = 1 + wobble * Math.sin(t * 7 + 1.3)
    const x = 16 * Math.pow(Math.sin(t), 3) * w
    const y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * w
    if (i === 0) ctx.moveTo(cx + x * scale, cy - y * scale - 2 * scale)
    else ctx.lineTo(cx + x * scale, cy - y * scale - 2 * scale)
  }
  ctx.closePath()
}

/** The same heart as a THREE.Shape, for extruded things (balloon, glasses). */
export function heartShape(scale = 0.01): THREE.Shape {
  const s = new THREE.Shape()
  for (let i = 0; i <= 80; i++) {
    const t = (i / 80) * Math.PI * 2
    const x = 16 * Math.pow(Math.sin(t), 3) * scale
    const y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * scale
    if (i === 0) s.moveTo(x, y)
    else s.lineTo(x, y)
  }
  return s
}

/** Fine vertical ribs of jersey knit, as a bump map. */
export function knitTexture(): THREE.CanvasTexture {
  return cached('knit', () => {
    const [c, ctx] = canvas(256)
    ctx.fillStyle = '#808080'
    ctx.fillRect(0, 0, 256, 256)
    for (let x = 0; x < 256; x += 4) {
      for (let y = 0; y < 256; y += 6) {
        const v = 150 + Math.random() * 40
        ctx.fillStyle = `rgb(${v},${v},${v})`
        ctx.beginPath()
        ctx.ellipse(x + 2, y + 3, 1.4, 3, 0, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    const t = texture(c, false)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(40, 22)
    return t
  })
}

function stitchedLine(ctx: CanvasRenderingContext2D, pts: [number, number][], width: number) {
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = width
  ctx.beginPath()
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  ctx.stroke()
  // thread highlights along the stitch
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = width * 0.3
  ctx.setLineDash([width * 0.9, width * 1.4])
  ctx.stroke()
  ctx.setLineDash([])
}

/** Embroidered eyes and smile, in dark brown thread. Transparent elsewhere. */
export function faceTexture(): THREE.CanvasTexture {
  return cached('face', () => {
    const [c, ctx] = canvas(512, 256)
    const thread = '#3a1f1f'
    ctx.fillStyle = thread
    ctx.strokeStyle = thread
    for (const x of [156, 356]) {
      ctx.beginPath()
      ctx.ellipse(x, 70, 15, 17, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.18)'
      ctx.beginPath()
      ctx.ellipse(x - 4, 64, 4, 5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = thread
    }
    const smile: [number, number][] = []
    for (let i = 0; i <= 24; i++) {
      const t = i / 24
      const x = 120 + t * 272
      const y = 128 + Math.sin(t * Math.PI) * 44 + (t > 0.8 ? (t - 0.8) * 40 : 0)
      smile.push([x, y])
    }
    ctx.strokeStyle = thread
    stitchedLine(ctx, smile, 11)
    return texture(c)
  })
}

/** The white fabric heart patch, with a stitched edge. */
export function heartPatchTexture(): THREE.CanvasTexture {
  return cached('heart', () => {
    const [c, ctx] = canvas(512)
    heartPath(ctx, 256, 270, 13.5, 0.015)
    ctx.fillStyle = '#f4f1ec'
    ctx.fill()
    ctx.save()
    ctx.clip()
    // a little weave and shading
    for (let i = 0; i < 3000; i++) {
      const v = Math.random() < 0.5 ? 'rgba(0,0,0,0.035)' : 'rgba(255,255,255,0.06)'
      ctx.fillStyle = v
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2)
    }
    const g = ctx.createRadialGradient(220, 200, 40, 256, 280, 260)
    g.addColorStop(0, 'rgba(255,255,255,0)')
    g.addColorStop(1, 'rgba(0,0,0,0.12)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 512, 512)
    ctx.restore()
    // stitches just inside the edge
    heartPath(ctx, 256, 270, 12.6, 0.015)
    ctx.strokeStyle = 'rgba(150,140,130,0.8)'
    ctx.lineWidth = 3
    ctx.setLineDash([7, 9])
    ctx.stroke()
    ctx.setLineDash([])
    return texture(c)
  })
}

/** White heart on black: where the heart is allowed to glow. */
export function heartGlowTexture(): THREE.CanvasTexture {
  return cached('heartGlow', () => {
    const [c, ctx] = canvas(512)
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, 512, 512)
    const g = ctx.createRadialGradient(256, 250, 30, 256, 270, 230)
    g.addColorStop(0, '#ffffff')
    g.addColorStop(1, '#9a9a9a')
    heartPath(ctx, 256, 270, 13.5, 0.015)
    ctx.fillStyle = g
    ctx.fill()
    return texture(c)
  })
}
