import * as THREE from 'three'

/*
  Textures for the rooms, drawn on canvases like the doll's.
*/

const cache = new Map<string, THREE.Texture>()

function make(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, repeat?: [number, number]) {
  if (cache.has(key)) return cache.get(key) as THREE.CanvasTexture
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d')!)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(...repeat)
  }
  cache.set(key, t)
  return t
}

/** A deterministic random, so books and stars land in the same place every time. */
export function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

/** Wood grain running along u. */
export function woodTexture(base: string, grain: string, repeat: [number, number] = [1, 1]) {
  return make(`wood-${base}-${grain}-${repeat}`, 512, 512, (ctx) => {
    ctx.fillStyle = base
    ctx.fillRect(0, 0, 512, 512)
    const rand = seeded(base.length * 97 + grain.length)
    ctx.strokeStyle = grain
    for (let i = 0; i < 110; i++) {
      const y0 = rand() * 512
      ctx.globalAlpha = 0.08 + rand() * 0.18
      ctx.lineWidth = 0.6 + rand() * 2.2
      ctx.beginPath()
      for (let x = 0; x <= 512; x += 16) {
        const y = y0 + Math.sin(x / (60 + rand() * 40) + i) * (0.8 + rand() * 1.6)
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }, repeat)
}

/** Soft woven fabric: for the duvet, sofa and cushions. */
export function weaveTexture(base: string, repeat: [number, number] = [4, 4]) {
  return make(`weave-${base}-${repeat}`, 128, 128, (ctx) => {
    ctx.fillStyle = base
    ctx.fillRect(0, 0, 128, 128)
    for (let y = 0; y < 128; y += 4) {
      for (let x = 0; x < 128; x += 4) {
        ctx.fillStyle = (x + y) % 8 === 0 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'
        ctx.fillRect(x, y, 4, 2)
      }
    }
  }, repeat)
}

/** Painted wall with a faint, uneven finish. */
export function wallTexture(base: string) {
  return make(`wall-${base}`, 256, 256, (ctx) => {
    ctx.fillStyle = base
    ctx.fillRect(0, 0, 256, 256)
    const rand = seeded(base.charCodeAt(1) * 31)
    for (let i = 0; i < 1400; i++) {
      ctx.fillStyle = rand() < 0.5 ? 'rgba(0,0,0,0.012)' : 'rgba(255,255,255,0.02)'
      ctx.fillRect(rand() * 256, rand() * 256, 3, 3)
    }
  }, [6, 3])
}

/** A sky, day or night: the view through the window (day) and the painting over the sofa (night). */
export function skyTexture(night: boolean) {
  return make(`sky-${night}`, 512, 512, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 512)
    if (night) {
      g.addColorStop(0, '#0b1030')
      g.addColorStop(0.7, '#1f2a5a')
      g.addColorStop(1, '#3b3f6e')
    } else {
      g.addColorStop(0, '#8cc2ec')
      g.addColorStop(0.65, '#cfe6f5')
      g.addColorStop(1, '#f6dcc7')
    }
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 512, 512)
    const rand = seeded(7)
    if (night) {
      for (let i = 0; i < 160; i++) {
        ctx.fillStyle = `rgba(255,255,255,${0.3 + rand() * 0.7})`
        const r = rand() * 1.4 + 0.3
        ctx.beginPath()
        ctx.arc(rand() * 512, rand() * 330, r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.fillStyle = '#fbf3d0'
      ctx.beginPath()
      ctx.arc(380, 110, 34, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#0f1538'
      ctx.beginPath()
      ctx.arc(396, 100, 30, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      for (const [x, y, s] of [[120, 120, 1], [340, 80, 0.8], [420, 200, 0.6]]) {
        for (const [dx, dy, r] of [[0, 0, 34], [30, -12, 28], [-30, -6, 24], [56, 4, 22]]) {
          ctx.beginPath()
          ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
    // rooftops along the bottom
    ctx.fillStyle = night ? '#141a3a' : '#9aa8b8'
    let x = 0
    while (x < 512) {
      const w = 30 + rand() * 50
      const h = 40 + rand() * 90
      ctx.fillRect(x, 512 - h, w - 4, h)
      if (night) {
        ctx.fillStyle = '#f6d98b'
        for (let wy = 512 - h + 10; wy < 500; wy += 16) {
          for (let wx = x + 6; wx < x + w - 10; wx += 12) if (rand() < 0.35) ctx.fillRect(wx, wy, 5, 7)
        }
        ctx.fillStyle = '#141a3a'
      }
      x += w
    }
  })
}

/** A tiny framed photo: two figures and a heart, for the desk. */
export function photoTexture() {
  return make('photo', 256, 320, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 320)
    g.addColorStop(0, '#f7c9a8')
    g.addColorStop(1, '#f2e2c8')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 320)
    ctx.fillStyle = '#e9b48f'
    ctx.beginPath()
    ctx.arc(128, 330, 170, Math.PI, 0)
    ctx.fill()
    for (const [x, c] of [[88, '#5b6fb5'], [168, '#c8324c']] as const) {
      ctx.fillStyle = c
      ctx.beginPath()
      ctx.arc(x, 150, 26, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(x, 250, 40, 70, 0, Math.PI, 0)
      ctx.fill()
    }
    ctx.fillStyle = '#ef4b6b'
    ctx.font = '48px Georgia'
    ctx.textAlign = 'center'
    ctx.fillText('♥', 128, 110)
  })
}

/** A world map poster, loosely drawn, with a dotted flight path. */
export function mapTexture() {
  return make('map', 512, 320, (ctx) => {
    ctx.fillStyle = '#e8eef0'
    ctx.fillRect(0, 0, 512, 320)
    ctx.fillStyle = '#b9cdb0'
    const blobs = [
      [110, 110, 70, 50], [150, 210, 35, 60], [270, 100, 45, 35], [290, 190, 40, 55],
      [370, 110, 85, 50], [420, 230, 35, 25],
    ]
    for (const [x, y, rx, ry] of blobs) {
      ctx.beginPath()
      ctx.ellipse(x, y, rx, ry, 0.3, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.strokeStyle = '#c8324c'
    ctx.lineWidth = 4
    ctx.setLineDash([10, 10])
    ctx.beginPath()
    ctx.moveTo(380, 120)
    ctx.quadraticCurveTo(320, 30, 268, 92)
    ctx.stroke()
    ctx.setLineDash([])
    for (const [x, y] of [[380, 120], [268, 92]]) {
      ctx.fillStyle = '#c8324c'
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, Math.PI * 2)
      ctx.fill()
    }
  })
}
