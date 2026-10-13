import { useMemo, useRef, type ElementRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { QuadraticBezierLine, RoundedBox } from '@react-three/drei'
import { useDoll } from '../store'
import {
  BODY_HEIGHT,
  FACE,
  heightForRadius,
  radiusAt,
  surfacePoint,
  surfaceQuaternion,
} from './profile'
import { heartShape, knitTexture, sleepMaskTexture, stripeTexture } from './textures'

/*
  Accessories are plain three.js shapes, placed with the body's profile
  (profile.ts) so they sit on the doll whatever their size.
*/

const noRaycast = () => null

/** A group sitting on the body's surface, its +z pointing straight out. */
function OnSurface({ theta, y, offset = 0, children }: { theta: number; y: number; offset?: number; children: ReactNode }) {
  const p = surfacePoint(theta, y, offset)
  const q = surfaceQuaternion(theta, y)
  return (
    <group position={p} quaternion={q}>
      {children}
    </group>
  )
}

function Knit({ colour }: { colour: string }) {
  return <meshPhysicalMaterial color={colour} roughness={0.95} sheen={1} sheenRoughness={0.5} sheenColor="#ffffff" bumpMap={knitTexture()} bumpScale={1.2} side={THREE.DoubleSide} />
}

// ---------------------------------------------------------------------
// Headwear
// ---------------------------------------------------------------------

function Beanie() {
  const y0 = 1.6
  const geometry = useMemo(() => {
    const pts: THREE.Vector2[] = []
    for (let y = y0; y < BODY_HEIGHT; y += 0.02) pts.push(new THREE.Vector2(radiusAt(y) + 0.05, y))
    pts.push(new THREE.Vector2(0.03, BODY_HEIGHT + 0.045), new THREE.Vector2(0, BODY_HEIGHT + 0.05))
    return new THREE.LatheGeometry(pts, 64)
  }, [])
  const r0 = radiusAt(y0 + 0.03) + 0.06
  return (
    <group>
      <mesh geometry={geometry} castShadow>
        <Knit colour="#d9a03c" />
      </mesh>
      <mesh position={[0, y0 + 0.03, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 1.5]}>
        <torusGeometry args={[r0, 0.055, 16, 64]} />
        <Knit colour="#c98d2c" />
      </mesh>
      <mesh position={[0, BODY_HEIGHT + 0.1, 0]} castShadow>
        <sphereGeometry args={[0.13, 24, 16]} />
        <Knit colour="#f3ead8" />
      </mesh>
    </group>
  )
}

/** A long sleeping cap that flops over to one side. */
function Nightcap() {
  const y0 = heightForRadius(0.44)
  const r0 = radiusAt(y0) + 0.05
  const { geometry, tip } = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, y0, 0),
      new THREE.Vector3(0, y0 + 0.95, 0),
      new THREE.Vector3(0.62, y0 + 0.32, 0.08),
    )
    const tubular = 64
    const radial = 32
    const g = new THREE.TubeGeometry(curve, tubular, 1, radial, false)
    // Taper the tube: scale each ring around its point on the curve.
    const pos = g.attributes.position
    const v = new THREE.Vector3()
    for (let i = 0; i <= tubular; i++) {
      const t = i / tubular
      const c = curve.getPointAt(t)
      const r = r0 * Math.pow(1 - t, 0.85) + 0.025
      for (let j = 0; j <= radial; j++) {
        const k = i * (radial + 1) + j
        v.fromBufferAttribute(pos, k).sub(c).multiplyScalar(r).add(c)
        pos.setXYZ(k, v.x, v.y, v.z)
      }
    }
    g.computeVertexNormals()
    return { geometry: g, tip: curve.getPointAt(1) }
  }, [y0, r0])
  return (
    <group>
      <mesh geometry={geometry} castShadow>
        <meshPhysicalMaterial map={stripeTexture('#5b6fb5', '#eef0fa', 7, true)} roughness={0.9} sheen={1} sheenColor="#ffffff" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, y0 + 0.02, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 1.4]}>
        <torusGeometry args={[r0, 0.06, 16, 64]} />
        <Knit colour="#f4f2ee" />
      </mesh>
      <mesh position={tip}>
        <sphereGeometry args={[0.1, 24, 16]} />
        <Knit colour="#f4f2ee" />
      </mesh>
    </group>
  )
}

function PartyHat() {
  const yb = heightForRadius(0.33)
  return (
    <group position={[0, yb, 0]} rotation={[0.04, 0, -0.14]}>
      <mesh position={[0, 0.36, 0]}>
        <coneGeometry args={[0.35, 0.74, 48, 1, true]} />
        <meshStandardMaterial map={stripeTexture('#ef5d79', '#ffd66b', 5)} roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* a fluffy trim round the brim, where the hat meets the head */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.35, 0.045, 14, 64]} />
        <Knit colour="#fff6e8" />
      </mesh>
      <mesh position={[0, 0.76, 0]}>
        <sphereGeometry args={[0.075, 16, 12]} />
        <Knit colour="#7fd6c2" />
      </mesh>
    </group>
  )
}

/** A band whose top edge rises into points: one piece, so the crown has no gaps. */
function crownGeometry(y0: number, points: number, base: number, peak: number) {
  const segments = points * 16
  const positions: number[] = []
  const uvs: number[] = []
  const index: number[] = []
  const rBottom = radiusAt(y0) + 0.012
  for (let i = 0; i <= segments; i++) {
    const u = i / segments
    const a = u * Math.PI * 2
    const tri = 1 - Math.abs(((u * points) % 1) * 2 - 1) // 0 at the dips, 1 at the points
    const h = base + peak * tri ** 1.6
    const rTop = rBottom + 0.02 + h * 0.18 // flares out a little, like a real crown
    positions.push(Math.sin(a) * rBottom, 0, Math.cos(a) * rBottom)
    positions.push(Math.sin(a) * rTop, h, Math.cos(a) * rTop)
    uvs.push(u, 0, u, 1)
    if (i < segments) {
      const k = i * 2
      index.push(k, k + 2, k + 1, k + 1, k + 2, k + 3)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  g.setIndex(index)
  g.computeVertexNormals()
  return { geometry: g, rBottom }
}

function Crown() {
  const points = 6
  const base = 0.09
  const peak = 0.13
  const y0 = heightForRadius(0.43)
  const { geometry, rBottom } = useMemo(() => crownGeometry(y0, points, base, peak), [y0])
  const gold = <meshStandardMaterial color="#e8b84a" metalness={0.85} roughness={0.28} side={THREE.DoubleSide} />
  return (
    <group position={[0, y0, 0]}>
      <mesh geometry={geometry}>{gold}</mesh>
      {Array.from({ length: points }, (_, i) => {
        const a = ((i + 0.5) / points) * Math.PI * 2
        const r = rBottom + 0.02 + (base + peak) * 0.18
        return (
          <mesh key={i} position={[Math.sin(a) * r, base + peak + 0.02, Math.cos(a) * r]}>
            <sphereGeometry args={[0.024, 12, 8]} />
            {gold}
          </mesh>
        )
      })}
      {[-0.45, 0, 0.45].map((a, i) => {
        const r = rBottom + 0.02 + 0.045 * 0.18 + 0.008
        return (
          <mesh key={a} position={[Math.sin(a) * r, 0.045, Math.cos(a) * r]} scale={[1, 1, 0.6]}>
            <sphereGeometry args={[0.03, 16, 12]} />
            <meshPhysicalMaterial color={['#4fa3e0', '#ef4b6b', '#4fc28a'][i]} roughness={0.1} clearcoat={1} />
          </mesh>
        )
      })}
    </group>
  )
}

function HairBow() {
  const colour = '#f28cab'
  return (
    <OnSurface theta={0.8} y={1.74} offset={0.03}>
      <group rotation={[0, 0, 0.3]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.12, 0, 0]} rotation={[0, 0, s * 0.35]} scale={[0.15, 0.1, 0.06]}>
            <sphereGeometry args={[1, 24, 16]} />
            <Knit colour={colour} />
          </mesh>
        ))}
        <mesh scale={[0.055, 0.065, 0.06]}>
          <sphereGeometry args={[1, 16, 12]} />
          <Knit colour="#e1708f" />
        </mesh>
      </group>
    </OnSurface>
  )
}

function Flower() {
  return (
    <OnSurface theta={-0.75} y={1.7} offset={0.02}>
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.085, Math.sin(a) * 0.085, 0]} rotation={[0, 0, a]} scale={[0.075, 0.045, 0.03]}>
            <sphereGeometry args={[1, 16, 12]} />
            <Knit colour="#ffffff" />
          </mesh>
        )
      })}
      <mesh position={[0, 0, 0.02]} scale={[0.05, 0.05, 0.035]}>
        <sphereGeometry args={[1, 16, 12]} />
        <Knit colour="#f7c948" />
      </mesh>
    </OnSurface>
  )
}

// ---------------------------------------------------------------------
// Eyewear
// ---------------------------------------------------------------------

const eyeY = FACE.eyeY
const eyeX = FACE.eyeX
const frontZ = Math.sqrt(radiusAt(eyeY) ** 2 - eyeX ** 2)
const glassesZ = frontZ + 0.075

/**
 * Glasses arms that wrap around the head: from the hinge at the frame's
 * edge, back along the surface to just past the ear.
 */
function Arms({ colour, hingeX = 0.245 }: { colour: string; hingeX?: number }) {
  const geometries = useMemo(
    () =>
      [-1, 1].map((s) => {
        const y = eyeY + 0.02
        const pts = [new THREE.Vector3(s * hingeX, y, glassesZ - 0.01)]
        // ease from the frame's distance in front of the face down onto the fabric
        for (let i = 0; i <= 10; i++) {
          const t = i / 10
          const theta = s * (0.55 + t * 1.05)
          pts.push(surfacePoint(theta, y + t * 0.03, 0.045 * (1 - t) ** 2 + 0.013))
        }
        return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.011, 8, false)
      }),
    [hingeX],
  )
  return (
    <>
      {geometries.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshStandardMaterial color={colour} roughness={0.4} />
        </mesh>
      ))}
    </>
  )
}

function RoundGlasses({ colour, lens }: { colour: string; lens?: string }) {
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * eyeX, eyeY + 0.015, glassesZ]}>
          <mesh>
            <torusGeometry args={[0.092, 0.013, 12, 48]} />
            <meshStandardMaterial color={colour} roughness={0.35} metalness={0.2} />
          </mesh>
          {lens && (
            <mesh>
              <circleGeometry args={[0.088, 40]} />
              <meshPhysicalMaterial color={lens} roughness={0.05} metalness={0.3} transparent opacity={0.85} clearcoat={1} side={THREE.DoubleSide} />
            </mesh>
          )}
        </group>
      ))}
      <mesh position={[0, eyeY + 0.025, glassesZ]}>
        <torusGeometry args={[0.05, 0.011, 8, 24, Math.PI]} />
        <meshStandardMaterial color={colour} roughness={0.35} />
      </mesh>
      <Arms colour={colour} />
    </group>
  )
}

function HeartGlasses() {
  const { frame, lens } = useMemo(() => {
    const outer = heartShape(0.0064)
    const hole = heartShape(0.0047)
    outer.holes.push(new THREE.Path(hole.getPoints()))
    const frame = new THREE.ExtrudeGeometry(outer, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.006, bevelSegments: 3 })
    frame.center()
    const lens = new THREE.ShapeGeometry(heartShape(0.0049))
    lens.center()
    return { frame, lens }
  }, [])
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (eyeX + 0.005), eyeY + 0.03, glassesZ]} rotation={[0, 0, -s * 0.08]}>
          <mesh geometry={frame}>
            <meshPhysicalMaterial color="#f06b92" roughness={0.3} clearcoat={0.8} />
          </mesh>
          <mesh geometry={lens} position={[0, 0, 0.005]}>
            <meshPhysicalMaterial color="#ff8fb0" transparent opacity={0.55} roughness={0.05} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, eyeY + 0.05, glassesZ]}>
        <torusGeometry args={[0.03, 0.01, 8, 24, Math.PI]} />
        <meshStandardMaterial color="#f06b92" roughness={0.3} />
      </mesh>
      <Arms colour="#f06b92" hingeX={0.26} />
    </group>
  )
}

function SleepMask() {
  const top = radiusAt(eyeY + 0.11) + 0.03
  const bottom = radiusAt(eyeY - 0.11) + 0.03
  const span = 2.4
  return (
    <group position={[0, eyeY, 0]}>
      <mesh>
        <cylinderGeometry args={[top, bottom, 0.22, 64, 1, true, -span / 2, span]} />
        <meshPhysicalMaterial map={sleepMaskTexture()} roughness={0.8} sheen={1} sheenColor="#8c96d6" side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[(top + bottom) / 2, (top + bottom) / 2, 0.05, 64, 1, true, span / 2, Math.PI * 2 - span]} />
        <meshStandardMaterial color="#232a4f" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------------
// Extras
// ---------------------------------------------------------------------

function Scarf() {
  const y = 1.205
  const r = radiusAt(y) + 0.035
  const stripes = stripeTexture('#d9534f', '#f6efe6', 10, true)
  return (
    <group>
      <mesh position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 1.15]} castShadow>
        <torusGeometry args={[r, 0.038, 16, 72]} />
        <meshPhysicalMaterial map={stripes} roughness={0.95} sheen={1} sheenColor="#ffffff" bumpMap={knitTexture()} bumpScale={1} />
      </mesh>
      <OnSurface theta={1.05} y={0.98} offset={0.05}>
        <RoundedBox args={[0.16, 0.46, 0.05]} radius={0.02} rotation={[0, 0, 0.12]} castShadow>
          <meshPhysicalMaterial color="#d9534f" roughness={0.95} sheen={1} bumpMap={knitTexture()} bumpScale={1} />
        </RoundedBox>
        <RoundedBox args={[0.15, 0.36, 0.05]} radius={0.02} position={[0.09, 0.04, -0.02]} rotation={[0, 0, -0.05]}>
          <meshPhysicalMaterial color="#c4453f" roughness={0.95} sheen={1} bumpMap={knitTexture()} bumpScale={1} />
        </RoundedBox>
      </OnSurface>
    </group>
  )
}

function Backpack() {
  return (
    <OnSurface theta={Math.PI} y={0.88} offset={0.1}>
      <RoundedBox args={[0.58, 0.62, 0.24]} radius={0.09} smoothness={4} castShadow>
        <Knit colour="#7aa37a" />
      </RoundedBox>
      <RoundedBox args={[0.6, 0.24, 0.27]} radius={0.08} position={[0, 0.22, 0.01]}>
        <Knit colour="#5f8a5f" />
      </RoundedBox>
      <RoundedBox args={[0.34, 0.2, 0.06]} radius={0.04} position={[0, -0.12, 0.13]}>
        <Knit colour="#5f8a5f" />
      </RoundedBox>
      <mesh position={[0, 0.13, 0.15]}>
        <sphereGeometry args={[0.03, 12, 8]} />
        <meshStandardMaterial color="#e8b84a" metalness={0.8} roughness={0.3} />
      </mesh>
    </OnSurface>
  )
}

/** A crescent-moon plush to sleep with, leaning against the doll. */
function MoonBuddy() {
  const geometry = useMemo(() => {
    const R = 0.3
    const r = 0.25
    const cx = 0.15
    const cy = 0.07
    const d = Math.hypot(cx, cy)
    const dir = Math.atan2(cy, cx)
    const a = (R * R - r * r + d * d) / (2 * d)
    const alpha = Math.acos(a / R)
    const beta = Math.acos((d - a) / r)
    const s = new THREE.Shape()
    s.absarc(0, 0, R, dir + alpha, dir + Math.PI * 2 - alpha, false)
    s.absarc(cx, cy, r, dir + Math.PI + beta, dir + Math.PI - beta, true)
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 6, curveSegments: 48 })
    g.center()
    return g
  }, [])
  return (
    <group position={[0.98, 0.34, 0.32]} rotation={[0, -0.6, -0.15]}>
      <mesh geometry={geometry} castShadow>
        <meshPhysicalMaterial color="#f6d26b" roughness={0.9} sheen={1} sheenColor="#ffffff" bumpMap={knitTexture()} bumpScale={0.8} />
      </mesh>
    </group>
  )
}

/** A heart balloon tied to the doll, bobbing gently. */
function Balloon() {
  const balloon = useRef<THREE.Group>(null)
  const string = useRef<ElementRef<typeof QuadraticBezierLine>>(null)
  const anchor = useMemo(() => surfacePoint(-1.45, 0.62, 0.01), [])
  const base = useMemo(() => new THREE.Vector3(-1.0, 2.2, 0.15), [])
  const geometry = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(heartShape(0.015), { depth: 0.1, bevelEnabled: true, bevelThickness: 0.09, bevelSize: 0.07, bevelSegments: 8, curveSegments: 48 })
    g.center()
    return g
  }, [])
  const end = useMemo(() => new THREE.Vector3(), [])
  const mid = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (!balloon.current) return
    balloon.current.position.set(base.x + Math.sin(t * 0.7) * 0.05, base.y + Math.sin(t * 1.1) * 0.06, base.z)
    balloon.current.rotation.set(0, Math.sin(t * 0.5) * 0.25, Math.sin(t * 0.8) * 0.06)
    end.copy(balloon.current.position).add(new THREE.Vector3(0, -0.3, 0))
    mid.copy(anchor).lerp(end, 0.5).add(new THREE.Vector3(-0.12, 0, 0))
    string.current?.setPoints(anchor, end, mid)
  })
  return (
    <>
      <group ref={balloon} position={base}>
        <mesh geometry={geometry} castShadow>
          <meshPhysicalMaterial color="#ef4b6b" roughness={0.18} clearcoat={1} clearcoatRoughness={0.1} />
        </mesh>
      </group>
      <QuadraticBezierLine ref={string} start={anchor} end={base} color="#8a7b7a" lineWidth={1.2} raycast={noRaycast} />
    </>
  )
}

export function Accessories() {
  const headwear = useDoll((s) => s.headwear)
  const eyewear = useDoll((s) => s.eyewear)
  const extras = useDoll((s) => s.extras)
  return (
    <group>
      {headwear === 'beanie' && <Beanie />}
      {headwear === 'nightcap' && <Nightcap />}
      {headwear === 'party' && <PartyHat />}
      {headwear === 'crown' && <Crown />}
      {headwear === 'bow' && <HairBow />}
      {headwear === 'flower' && <Flower />}

      {eyewear === 'round' && <RoundGlasses colour="#6b4632" />}
      {eyewear === 'sunglasses' && <RoundGlasses colour="#1d1d22" lens="#20232c" />}
      {eyewear === 'heart' && <HeartGlasses />}
      {eyewear === 'sleepmask' && <SleepMask />}

      {extras.includes('scarf') && <Scarf />}
      {extras.includes('backpack') && <Backpack />}
      {extras.includes('moon') && <MoonBuddy />}
      {extras.includes('balloon') && <Balloon />}
    </group>
  )
}
