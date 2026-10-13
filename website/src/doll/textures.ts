import * as THREE from 'three'
import type { StickerKind } from '../store'

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

/** Diagonal stripes, for the party hat, nightcap and scarf. */
export function stripeTexture(a: string, b: string, repeat = 6, across = false): THREE.CanvasTexture {
  return cached(`stripes-${a}-${b}-${repeat}-${across}`, () => {
    const [c, ctx] = canvas(128)
    ctx.fillStyle = a
    ctx.fillRect(0, 0, 128, 128)
    ctx.fillStyle = b
    for (let i = 0; i < 128; i += 32) {
      if (across) ctx.fillRect(i, 0, 16, 128)
      else ctx.fillRect(0, i, 128, 16)
    }
    const t = texture(c)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    if (across) t.repeat.set(repeat, 1)
    else t.repeat.set(1, repeat)
    return t
  })
}

/** The sleep mask's fabric, with two closed, embroidered eyes. */
export function sleepMaskTexture(): THREE.CanvasTexture {
  return cached('sleepmask', () => {
    const [c, ctx] = canvas(1024, 256)
    ctx.fillStyle = '#2d3561'
    ctx.fillRect(0, 0, 1024, 256)
    ctx.strokeStyle = '#f2d98a'
    ctx.lineWidth = 9
    ctx.lineCap = 'round'
    for (const x of [430, 594]) {
      ctx.beginPath()
      ctx.arc(x, 110, 48, 0.15 * Math.PI, 0.85 * Math.PI)
      ctx.stroke()
      for (const a of [0.3, 0.5, 0.7]) {
        const px = x + Math.cos(a * Math.PI) * 48
        const py = 110 + Math.sin(a * Math.PI) * 48
        ctx.beginPath()
        ctx.moveTo(px, py)
        ctx.lineTo(px + Math.cos(a * Math.PI) * 20, py + Math.sin(a * Math.PI) * 20)
        ctx.stroke()
      }
    }
    // piping along the edges
    ctx.fillStyle = '#f2d98a'
    ctx.fillRect(0, 0, 1024, 10)
    ctx.fillRect(0, 246, 1024, 10)
    return texture(c)
  })
}

// ---------------------------------------------------------------------
// Stickers
// ---------------------------------------------------------------------

export const STICKERS: { kind: StickerKind; label: string }[] = [
  { kind: 'star', label: 'Star' },
  { kind: 'moon', label: 'Moon' },
  { kind: 'heart', label: 'Heart' },
  { kind: 'flower', label: 'Flower' },
  { kind: 'cloud', label: 'Cloud' },
  { kind: 'sparkle', label: 'Sparkle' },
  { kind: 'rainbow', label: 'Rainbow' },
  { kind: 'zzz', label: 'Zzz' },
]

function starPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, outer: number, inner: number, points = 5) {
  ctx.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? inner : outer
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
  }
  ctx.closePath()
}

function cloudPath(ctx: CanvasRenderingContext2D) {
  ctx.beginPath()
  ctx.arc(90, 150, 42, Math.PI * 0.5, Math.PI * 1.5)
  ctx.arc(128, 100, 52, Math.PI * 1.05, Math.PI * 1.95)
  ctx.arc(176, 128, 40, Math.PI * 1.3, Math.PI * 0.5)
  ctx.closePath()
}

/** Draws the sticker's outline shape (used twice: white border, then colour). */
function stickerShape(ctx: CanvasRenderingContext2D, kind: StickerKind) {
  switch (kind) {
    case 'star':
      starPath(ctx, 128, 136, 100, 44)
      break
    case 'moon':
      ctx.beginPath()
      ctx.arc(128, 128, 88, Math.PI * 0.35, Math.PI * 1.65)
      ctx.arc(162, 112, 72, Math.PI * 1.5, Math.PI * 0.62, true)
      ctx.closePath()
      break
    case 'heart':
      heartPath(ctx, 128, 136, 5.6)
      break
    case 'flower':
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        ctx.moveTo(128 + Math.cos(a) * 58 + 40, 128 + Math.sin(a) * 58)
        ctx.arc(128 + Math.cos(a) * 58, 128 + Math.sin(a) * 58, 40, 0, Math.PI * 2)
      }
      break
    case 'cloud':
      cloudPath(ctx)
      break
    case 'sparkle':
      starPath(ctx, 128, 128, 104, 22, 4)
      break
    case 'rainbow':
      ctx.beginPath()
      ctx.arc(128, 170, 100, Math.PI, 0)
      ctx.arc(128, 170, 40, 0, Math.PI, true)
      ctx.closePath()
      break
    case 'zzz':
      ctx.beginPath()
      ctx.roundRect(28, 50, 200, 150, 40)
      break
  }
}

function drawSticker(ctx: CanvasRenderingContext2D, kind: StickerKind) {
  // white die-cut border with a soft shadow
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.25)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetY = 3
  stickerShape(ctx, kind)
  ctx.lineJoin = 'round'
  ctx.lineWidth = 18
  ctx.strokeStyle = '#fff'
  ctx.stroke()
  ctx.fillStyle = '#fff'
  ctx.fill()
  ctx.restore()

  stickerShape(ctx, kind)
  switch (kind) {
    case 'star':
      ctx.fillStyle = '#f7c948'
      ctx.fill()
      break
    case 'moon':
      ctx.fillStyle = '#b9a6f2'
      ctx.fill()
      break
    case 'heart':
      ctx.fillStyle = '#ef5d79'
      ctx.fill()
      break
    case 'flower':
      ctx.fillStyle = '#f59ec1'
      ctx.fill()
      ctx.fillStyle = '#ffd66b'
      ctx.beginPath()
      ctx.arc(128, 128, 32, 0, Math.PI * 2)
      ctx.fill()
      break
    case 'cloud':
      ctx.fillStyle = '#9fd3f5'
      ctx.fill()
      break
    case 'sparkle':
      ctx.fillStyle = '#7fd6c2'
      ctx.fill()
      break
    case 'rainbow': {
      const bands = ['#ef5d79', '#f7a948', '#f7d948', '#7fd18b', '#6fb3f2']
      bands.forEach((col, i) => {
        ctx.beginPath()
        ctx.arc(128, 170, 100 - i * 12, Math.PI, 0)
        ctx.arc(128, 170, 88 - i * 12, 0, Math.PI, true)
        ctx.closePath()
        ctx.fillStyle = col
        ctx.fill()
      })
      break
    }
    case 'zzz':
      ctx.fillStyle = '#2d3561'
      ctx.fill()
      ctx.fillStyle = '#f2d98a'
      ctx.font = '700 96px Georgia, serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('z', 84, 148)
      ctx.font = '700 72px Georgia, serif'
      ctx.fillText('z', 136, 118)
      ctx.font = '700 52px Georgia, serif'
      ctx.fillText('z', 178, 92)
      break
  }
  // a little gloss
  ctx.save()
  stickerShape(ctx, kind)
  ctx.clip()
  const g = ctx.createLinearGradient(0, 0, 256, 256)
  g.addColorStop(0, 'rgba(255,255,255,0.35)')
  g.addColorStop(0.45, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  ctx.restore()
}

export function stickerTexture(kind: StickerKind): THREE.CanvasTexture {
  return cached(`sticker-${kind}`, () => {
    const [c, ctx] = canvas(256)
    drawSticker(ctx, kind)
    return texture(c)
  })
}

const urls = new Map<StickerKind, string>()
/** A PNG of the sticker, for the picker buttons. */
export function stickerImage(kind: StickerKind): string {
  if (!urls.has(kind)) {
    const [c, ctx] = canvas(256)
    drawSticker(ctx, kind)
    urls.set(kind, c.toDataURL())
  }
  return urls.get(kind)!
}
