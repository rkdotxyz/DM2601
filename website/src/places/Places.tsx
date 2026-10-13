import { useMemo, type ReactNode } from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import { useDoll } from '../store'
import { mapTexture, photoTexture, seeded, skyTexture, wallTexture, weaveTexture, woodTexture } from './materials'
import { stickerTexture, stripeTexture } from '../doll/textures'

/*
  The places the doll can sit. In every one, the surface under the doll is
  at y = 0 and the doll faces +z, towards the camera. Rooms are real 3D
  boxes, so orbiting the camera never shows an edge.
*/

const noRaycast = () => null

// ---------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------

interface RoomProps {
  floorY: number
  /** z of the wall behind the doll. */
  back: number
  wall: string
  floor: THREE.Texture
  /** Leave out the back wall (the window builds its own, with a hole). */
  open?: boolean
}

/** Floor, four walls and a ceiling, all facing inwards. */
function Room({ floorY, back, wall, floor, open }: RoomProps) {
  const W = 26
  const D = 26
  const H = 15
  const cz = back + D / 2
  const wallMap = wallTexture(wall)
  const wallMat = <meshStandardMaterial map={wallMap} roughness={0.95} />
  return (
    <group raycast={noRaycast}>
      <mesh position={[0, floorY, cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial map={floor} roughness={0.8} />
      </mesh>
      {!open && (
        <mesh position={[0, floorY + H / 2, back]}>
          <planeGeometry args={[W, H]} />
          {wallMat}
        </mesh>
      )}
      <mesh position={[-W / 2, floorY + H / 2, cz]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[D, H]} />
        {wallMat}
      </mesh>
      <mesh position={[W / 2, floorY + H / 2, cz]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[D, H]} />
        {wallMat}
      </mesh>
      <mesh position={[0, floorY + H / 2, back + D]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[W, H]} />
        {wallMat}
      </mesh>
      <mesh position={[0, floorY + H, cz]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#f4f1ec" roughness={1} />
      </mesh>
      {/* skirting board along the back wall */}
      <mesh position={[0, floorY + 0.25, back + 0.06]}>
        <boxGeometry args={[W, 0.5, 0.12]} />
        <meshStandardMaterial color="#f6f3ee" roughness={0.6} />
      </mesh>
    </group>
  )
}

function Wood({ base, grain = '#5a3a22', repeat = [1, 1] as [number, number] }: { base: string; grain?: string; repeat?: [number, number] }) {
  return <meshStandardMaterial map={woodTexture(base, grain, repeat)} roughness={0.55} />
}

function Fabric({ colour, repeat = [4, 4] as [number, number] }: { colour: string; repeat?: [number, number] }) {
  return <meshPhysicalMaterial map={weaveTexture(colour, repeat)} roughness={0.95} sheen={0.6} sheenColor="#ffffff" />
}

/** A lamp's light: soft by day, the main light at night. */
function LampLight({ position, colour = '#ffcf8a', day = 0.8, night = 9 }: { position: [number, number, number]; colour?: string; day?: number; night?: number }) {
  const isNight = useDoll((s) => s.night)
  return <pointLight position={position} color={colour} intensity={isNight ? night : day} distance={14} decay={1.6} />
}

/** A lampshade that glows when the lamp is on at night. */
function Shade({ top, bottom, height, colour }: { top: number; bottom: number; height: number; colour: string }) {
  const night = useDoll((s) => s.night)
  return (
    <mesh>
      <cylinderGeometry args={[top, bottom, height, 40, 1, true]} />
      <meshStandardMaterial color={colour} emissive="#ffc77a" emissiveIntensity={night ? 1.6 : 0.15} side={THREE.DoubleSide} roughness={0.9} />
    </mesh>
  )
}

function Books({ from, to, seed, z = 0, maxHeight = 2.6 }: { from: number; to: number; seed: number; z?: number; maxHeight?: number }) {
  const books = useMemo(() => {
    const rand = seeded(seed)
    const palette = ['#8e3b46', '#355c7d', '#c9a227', '#6b8f71', '#d9cbb4', '#3e3a4f', '#c46d4f', '#5c7aa3']
    const out: { x: number; w: number; h: number; d: number; colour: string }[] = []
    let x = from
    while (x < to) {
      const w = 0.22 + rand() * 0.22
      out.push({ x: x + w / 2, w, h: maxHeight * (0.65 + rand() * 0.35), d: 1.5 + rand() * 0.4, colour: palette[Math.floor(rand() * palette.length)] })
      x += w + 0.02
    }
    return out
  }, [from, to, seed, maxHeight])
  return (
    <group position={[0, 0, z]}>
      {books.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, 0]}>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial color={b.colour} roughness={0.7} />
        </mesh>
      ))}
    </group>
  )
}

function Plant({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const leaves = useMemo(() => {
    const rand = seeded(11)
    return Array.from({ length: 9 }, (_, i) => ({ a: (i / 9) * Math.PI * 2 + rand() * 0.4, tilt: 0.35 + rand() * 0.45, h: 0.9 + rand() * 0.5 }))
  }, [])
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.5, 0.38, 0.8, 32]} />
        <meshStandardMaterial color="#c8714a" roughness={0.85} />
      </mesh>
      {leaves.map((l, i) => (
        <group key={i} position={[0, 0.8, 0]} rotation={[l.tilt * Math.cos(l.a), 0, l.tilt * Math.sin(l.a)]}>
          <mesh position={[0, l.h / 2, 0]} scale={[0.22, l.h / 2, 0.07]}>
            <sphereGeometry args={[1, 12, 10]} />
            <meshStandardMaterial color={i % 2 ? '#4f8a5b' : '#5f9e68'} roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ---------------------------------------------------------------------
// The places
// ---------------------------------------------------------------------

function Bedside() {
  const wood = { base: '#b9895c', grain: '#6b4423' }
  return (
    <group>
      <Room floorY={-4.6} back={-2.2} wall="#e9dccb" floor={woodTexture('#a77b52', '#5a3a22', [3, 6])} />
      <RoundedBox args={[5.4, 0.32, 3.6]} radius={0.08} position={[0, -0.16, 0.1]}>
        <Wood {...wood} />
      </RoundedBox>
      <mesh position={[0, -2.45, 0]}>
        <boxGeometry args={[5.1, 4.3, 3.3]} />
        <Wood base="#a87a4f" grain="#5e3c1f" />
      </mesh>
      <RoundedBox args={[4.6, 1.5, 0.1]} radius={0.04} position={[0, -1.2, 1.67]}>
        <Wood {...wood} />
      </RoundedBox>
      <mesh position={[0, -1.2, 1.78]}>
        <sphereGeometry args={[0.1, 16, 12]} />
        <meshStandardMaterial color="#d4b16a" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* table lamp */}
      <group position={[-2.5, 0, -0.6]} scale={0.85}>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.5, 0.55, 0.2, 32]} />
          <meshStandardMaterial color="#e7e0d6" roughness={0.4} />
        </mesh>
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 2.2, 12]} />
          <meshStandardMaterial color="#c9a46a" metalness={0.7} roughness={0.35} />
        </mesh>
        <group position={[0, 2.55, 0]}>
          <Shade top={0.55} bottom={0.95} height={1.1} colour="#f3e6d2" />
        </group>
      </group>
      <LampLight position={[-2.5, 2.1, -0.6]} />
      {/* a few books */}
      <group position={[2.55, 0, -0.45]} scale={0.8}>
        {[['#355c7d', 0.28, 0.1], ['#c46d4f', 0.24, -0.15], ['#d9cbb4', 0.3, 0.05]].map(([c, h, r], i) => (
          <mesh key={i} position={[0, 0.15 + i * 0.29, 0]} rotation={[0, r as number, 0]}>
            <boxGeometry args={[1.5, h as number, 1.1]} />
            <meshStandardMaterial color={c as string} roughness={0.7} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function Bed() {
  const night = useDoll((s) => s.night)
  return (
    <group>
      <Room floorY={-3.2} back={-5.9} wall="#dfe6ee" floor={woodTexture('#b08860', '#5a3a22', [3, 6])} />
      <RoundedBox args={[16, 1.4, 12]} radius={0.6} smoothness={5} position={[0, -0.7, -0.6]}>
        <Fabric colour="#f1eee8" repeat={[10, 8]} />
      </RoundedBox>
      <RoundedBox args={[16.2, 0.45, 2.4]} radius={0.2} position={[0, 0.02, 3.6]}>
        <Fabric colour="#9bb3a3" repeat={[10, 2]} />
      </RoundedBox>
      {[
        [-2.0, '#fbf8f3', 0.08],
        [2.0, '#dfe8f0', -0.08],
      ].map(([x, colour, r]) => (
        <RoundedBox key={x as number} args={[2.7, 1.3, 1.8]} radius={0.62} smoothness={6} position={[(x as number) * 1.05, 0.72, -3.4]} rotation={[-0.55, r as number, 0]}>
          <Fabric colour={colour as string} />
        </RoundedBox>
      ))}
      {/* channel-tufted headboard */}
      {Array.from({ length: 9 }, (_, i) => (
        <RoundedBox key={i} args={[1.82, 5.6, 0.8]} radius={0.38} smoothness={4} position={[(i - 4) * 1.88, 2.3, -5.3]}>
          <Fabric colour="#c9b8a6" repeat={[1, 3]} />
        </RoundedBox>
      ))}
      {/* a wall light */}
      <mesh position={[5.5, 4.2, -5.8]}>
        <sphereGeometry args={[0.35, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#f4ead8" emissive="#ffc77a" emissiveIntensity={night ? 2 : 0.2} side={THREE.DoubleSide} />
      </mesh>
      <LampLight position={[5.5, 4, -5]} night={7} />
    </group>
  )
}

/** A curtain: a plane with soft folds. */
function Curtain({ x, colour }: { x: number; colour: string }) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(1.8, 8.2, 40, 1)
    const pos = g.attributes.position
    for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 9) * 0.12)
    g.computeVertexNormals()
    return g
  }, [])
  return (
    <mesh geometry={geometry} position={[x, 3.1, -1.0]}>
      <meshPhysicalMaterial color={colour} roughness={0.9} sheen={0.6} side={THREE.DoubleSide} />
    </mesh>
  )
}

function WindowSill() {
  const night = useDoll((s) => s.night)
  const wallMap = wallTexture('#eee7dd')
  const wall = <meshStandardMaterial map={wallMap} roughness={0.95} />
  const back = -1.35
  const [x0, x1, y0, y1] = [-4.2, 4.2, 0.2, 6.6]
  const frame = <meshStandardMaterial color="#fbfaf7" roughness={0.5} />
  return (
    <group>
      <Room floorY={-5} back={back} wall="#eee7dd" floor={woodTexture('#a77b52', '#5a3a22', [3, 6])} open />
      {/* the wall around the window opening */}
      <mesh position={[(-13 + x0) / 2, 2.5, back]}>
        <planeGeometry args={[x0 + 13, 15]} />
        {wall}
      </mesh>
      <mesh position={[(13 + x1) / 2, 2.5, back]}>
        <planeGeometry args={[13 - x1, 15]} />
        {wall}
      </mesh>
      <mesh position={[0, (y1 + 10) / 2, back]}>
        <planeGeometry args={[x1 - x0, 10 - y1]} />
        {wall}
      </mesh>
      <mesh position={[0, (-5 + y0) / 2, back]}>
        <planeGeometry args={[x1 - x0, y0 + 5]} />
        {wall}
      </mesh>
      {/* frame, mullions and glass */}
      {[
        [0, y1, x1 - x0 + 0.5, 0.25],
        [0, y0, x1 - x0 + 0.5, 0.25],
        [x0, (y0 + y1) / 2, 0.25, y1 - y0],
        [x1, (y0 + y1) / 2, 0.25, y1 - y0],
        [-1.45, (y0 + y1) / 2, 0.14, y1 - y0],
        [1.45, (y0 + y1) / 2, 0.14, y1 - y0],
        [0, 4.6, x1 - x0, 0.14],
      ].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, back - 0.1]}>
          <boxGeometry args={[w, h, 0.3]} />
          {frame}
        </mesh>
      ))}
      <mesh position={[0, (y0 + y1) / 2, back - 0.15]}>
        <planeGeometry args={[x1 - x0, y1 - y0]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.08} roughness={0.05} />
      </mesh>
      {/* the view: a big sky far behind, so it shifts naturally as you orbit */}
      <mesh position={[0, 6.5, -12]}>
        <planeGeometry args={[34, 22]} />
        <meshBasicMaterial map={skyTexture(night)} toneMapped={false} />
      </mesh>
      {/* the sill */}
      <RoundedBox args={[10, 0.35, 2.6]} radius={0.06} position={[0, -0.175, -0.05]}>
        <meshStandardMaterial color="#fbfaf7" roughness={0.5} />
      </RoundedBox>
      <Curtain x={-5.1} colour="#e6b7a9" />
      <Curtain x={5.1} colour="#e6b7a9" />
      <Plant position={[2.25, 0, -0.4]} scale={0.75} />
      <directionalLight position={[0, 6, -10]} intensity={night ? 0.25 : 1.4} color={night ? '#8fa2ff' : '#fff1dc'} />
    </group>
  )
}

function Bookshelf() {
  const wood = { base: '#c49a6c', grain: '#7a5230', repeat: [3, 1] as [number, number] }
  const half = 3.6
  return (
    <group>
      <Room floorY={-6.5} back={-1.45} wall="#e3e8e2" floor={woodTexture('#a77b52', '#5a3a22', [3, 6])} />
      {[0, 3.75, -3.5].map((y) => (
        <RoundedBox key={y} args={[half * 2 + 0.6, 0.3, 2.5]} radius={0.04} position={[0, y - 0.15, 0]}>
          <Wood {...wood} />
        </RoundedBox>
      ))}
      <mesh position={[0, 0.3, -1.25]}>
        <boxGeometry args={[half * 2 + 0.6, 9.6, 0.12]} />
        <Wood base="#b88c5f" grain="#7a5230" repeat={[3, 2]} />
      </mesh>
      {[-half - 0.15, half + 0.15].map((x) => (
        <mesh key={x} position={[x, 0.3, 0]}>
          <boxGeometry args={[0.3, 9.6, 2.5]} />
          <Wood {...wood} />
        </mesh>
      ))}
      <Books from={-half + 0.1} to={-1.3} seed={3} z={-0.2} />
      <group position={[1.45, 0, -0.2]} rotation={[0, 0, -0.2]}>
        <mesh position={[0, 1.05, 0]}>
          <boxGeometry args={[0.32, 2.1, 1.7]} />
          <meshStandardMaterial color="#6b8f71" roughness={0.7} />
        </mesh>
      </group>
      <Books from={1.75} to={2.45} seed={9} z={-0.2} maxHeight={2.3} />
      <Plant position={[3.0, 0, -0.1]} scale={0.6} />
      <group position={[0, -3.5, 0]}>
        <Books from={-half + 0.1} to={half - 0.1} seed={21} z={-0.2} maxHeight={2.9} />
      </group>
      <group position={[0, 3.75, 0]}>
        <Books from={-half + 0.1} to={0.4} seed={33} z={-0.2} maxHeight={2.4} />
      </group>
    </group>
  )
}

/** A desk lamp: base, two arm pieces and a head. */
function DeskLamp({ position }: { position: [number, number, number] }) {
  const metal = <meshStandardMaterial color="#2f3a4a" metalness={0.5} roughness={0.4} />
  return (
    <group position={position}>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.55, 0.6, 0.16, 32]} />
        {metal}
      </mesh>
      <mesh position={[0.25, 1.1, 0]} rotation={[0, 0, -0.25]}>
        <cylinderGeometry args={[0.05, 0.05, 2.1, 10]} />
        {metal}
      </mesh>
      <mesh position={[0.95, 2.45, 0]} rotation={[0, 0, -1.15]}>
        <cylinderGeometry args={[0.05, 0.05, 1.6, 10]} />
        {metal}
      </mesh>
      <group position={[1.65, 2.6, 0]} rotation={[0, 0, 0.6]}>
        <Shade top={0.12} bottom={0.5} height={0.6} colour="#2f3a4a" />
      </group>
    </group>
  )
}

function Desk() {
  const night = useDoll((s) => s.night)
  return (
    <group>
      <Room floorY={-4.8} back={-3.4} wall="#e4e9e1" floor={woodTexture('#9c7350', '#5a3a22', [3, 6])} />
      <RoundedBox args={[13, 0.3, 5.6]} radius={0.06} position={[0, -0.15, -0.5]}>
        <Wood base="#d8b88e" grain="#8a6440" repeat={[2, 1]} />
      </RoundedBox>
      {/* laptop */}
      <group position={[3.1, 0, -1.3]} rotation={[0, -0.4, 0]}>
        <RoundedBox args={[2.8, 0.1, 1.9]} radius={0.04} position={[0, 0.05, 0]}>
          <meshStandardMaterial color="#c9ccd1" metalness={0.6} roughness={0.35} />
        </RoundedBox>
        <group position={[0, 0.1, -0.95]} rotation={[-0.25, 0, 0]}>
          <RoundedBox args={[2.8, 1.8, 0.06]} radius={0.03} position={[0, 0.9, 0]}>
            <meshStandardMaterial color="#c9ccd1" metalness={0.6} roughness={0.35} />
          </RoundedBox>
          <mesh position={[0, 0.92, 0.035]}>
            <planeGeometry args={[2.55, 1.55]} />
            <meshStandardMaterial color="#1d2433" emissive="#8fb4ff" emissiveIntensity={night ? 0.7 : 0.25} />
          </mesh>
        </group>
      </group>
      {/* mug */}
      <group position={[-2.3, 0, 0.5]} scale={0.85}>
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.38, 0.35, 0.9, 32]} />
          <meshStandardMaterial color="#e88d67" roughness={0.4} />
        </mesh>
        <mesh position={[0.42, 0.48, 0]}>
          <torusGeometry args={[0.2, 0.06, 10, 24]} />
          <meshStandardMaterial color="#e88d67" roughness={0.4} />
        </mesh>
      </group>
      {/* framed photo of someone far away */}
      <group position={[-1.9, 0, -2.0]} rotation={[-0.12, 0.25, 0]}>
        <RoundedBox args={[1.2, 1.5, 0.1]} radius={0.03} position={[0, 0.75, 0]}>
          <Wood base="#7a5233" grain="#3e2615" />
        </RoundedBox>
        <mesh position={[0, 0.75, 0.055]}>
          <planeGeometry args={[0.95, 1.2]} />
          <meshStandardMaterial map={photoTexture()} roughness={0.5} />
        </mesh>
      </group>
      {/* notebook */}
      <mesh position={[1.9, 0.05, 0.9]} rotation={[0, 0.35, 0]}>
        <boxGeometry args={[1.1, 0.1, 1.5]} />
        <meshStandardMaterial color="#355c7d" roughness={0.8} />
      </mesh>
      <DeskLamp position={[-4.7, 0, -1.8]} />
      <LampLight position={[-3.1, 2.4, -1.8]} night={8} />
    </group>
  )
}

function Sofa() {
  return (
    <group>
      <Room floorY={-2.3} back={-3.6} wall="#efe6da" floor={woodTexture('#a77b52', '#5a3a22', [3, 6])} />
      {/* three seat cushions: the doll sits on the middle one */}
      {[-3.75, 0, 3.75].map((x) => (
        <RoundedBox key={x} args={[3.65, 1, 4.2]} radius={0.38} smoothness={5} position={[x, -0.5, 0.2]}>
          <Fabric colour="#7f9b8e" />
        </RoundedBox>
      ))}
      <RoundedBox args={[11.8, 1.4, 5.2]} radius={0.3} position={[0, -1.6, -0.2]}>
        <Fabric colour="#6a8478" />
      </RoundedBox>
      <RoundedBox args={[11.8, 3.6, 1]} radius={0.4} position={[0, 0.6, -2.55]}>
        <Fabric colour="#6a8478" />
      </RoundedBox>
      {/* three back cushions */}
      {[-3.75, 0, 3.75].map((x) => (
        <RoundedBox key={x} args={[3.6, 2.7, 1.1]} radius={0.5} smoothness={5} position={[x, 1.2, -1.75]} rotation={[-0.14, 0, 0]}>
          <Fabric colour="#87a396" />
        </RoundedBox>
      ))}
      {[-5.4, 5.4].map((x) => (
        <RoundedBox key={x} args={[1.3, 2.6, 5.2]} radius={0.55} smoothness={5} position={[x, -0.3, -0.2]}>
          <Fabric colour="#7f9b8e" />
        </RoundedBox>
      ))}
      <RoundedBox args={[1.7, 1.7, 0.6]} radius={0.3} smoothness={5} position={[-2.6, 0.75, -0.95]} rotation={[-0.2, 0.25, 0.18]}>
        <Fabric colour="#e0b45a" repeat={[2, 2]} />
      </RoundedBox>
      <RoundedBox args={[1.6, 1.6, 0.6]} radius={0.3} smoothness={5} position={[2.7, 0.72, -0.95]} rotation={[-0.2, -0.25, -0.14]}>
        <meshPhysicalMaterial map={stripeTexture('#efe6da', '#c46d4f', 4, true)} roughness={0.9} sheen={0.5} />
      </RoundedBox>
      {/* art on the wall */}
      <group position={[0, 5.2, -3.55]}>
        <mesh>
          <boxGeometry args={[4.4, 2.8, 0.1]} />
          <meshStandardMaterial color="#2d2a28" />
        </mesh>
        <mesh position={[0, 0, 0.06]}>
          <planeGeometry args={[4.1, 2.5]} />
          <meshStandardMaterial map={skyTexture(true)} roughness={0.7} />
        </mesh>
      </group>
      {/* floor lamp */}
      <group position={[7.3, -2.3, -2.4]}>
        <mesh position={[0, 3, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 6, 12]} />
          <meshStandardMaterial color="#2d2a28" metalness={0.5} roughness={0.4} />
        </mesh>
        <group position={[0, 6.4, 0]}>
          <Shade top={0.7} bottom={1.1} height={1.2} colour="#f3e6d2" />
        </group>
      </group>
      <LampLight position={[7.3, 4, -2.4]} night={10} />
    </group>
  )
}

function Suitcase() {
  const leather = <meshStandardMaterial color="#8a5a3a" roughness={0.6} />
  return (
    <group>
      <Room floorY={-3.35} back={-3.2} wall="#e7e3dc" floor={woodTexture('#cbbfae', '#8d7e69', [4, 8])} />
      <RoundedBox args={[4.6, 3, 2.5]} radius={0.3} smoothness={4} position={[0, -1.5, 0]}>
        <meshStandardMaterial color="#3d7f8c" roughness={0.45} />
      </RoundedBox>
      {[-1.25, 1.25].map((x) => (
        <mesh key={x} position={[x, -1.5, 0]}>
          <boxGeometry args={[0.32, 3.04, 2.54]} />
          {leather}
        </mesh>
      ))}
      {/* wheels */}
      {[-1.9, 1.9].map((x) =>
        [-0.9, 0.9].map((z) => (
          <mesh key={`${x}${z}`} position={[x, -3.15, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.2, 0.2, 0.18, 16]} />
            <meshStandardMaterial color="#2d2a28" roughness={0.6} />
          </mesh>
        )),
      )}
      {/* travel stickers on the lid, around the doll */}
      {(
        [
          ['heart', -1.55, 0.55, 0.7, -0.3],
          ['rainbow', 1.55, 0.6, 0.8, 0.2],
          ['star', 1.7, -0.55, 0.55, 0.5],
          ['cloud', -1.6, -0.6, 0.6, -0.1],
        ] as const
      ).map(([kind, x, z, size, r]) => (
        <mesh key={kind} position={[x, 0.006, z]} rotation={[-Math.PI / 2, 0, r]}>
          <planeGeometry args={[size, size]} />
          <meshStandardMaterial map={stickerTexture(kind)} transparent alphaTest={0.3} roughness={0.4} />
        </mesh>
      ))}
      {/* a map on the wall: home, and where you are now */}
      <group position={[-3.4, 2.35, -3.15]} scale={0.85}>
        <mesh>
          <boxGeometry args={[4.3, 2.85, 0.08]} />
          <meshStandardMaterial color="#f8f6f1" />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[4, 2.5]} />
          <meshStandardMaterial map={mapTexture()} roughness={0.8} />
        </mesh>
      </group>
      {/* a postcard from home */}
      <group position={[3.0, 2.3, -3.15]} rotation={[0, 0, 0.06]} scale={0.85}>
        <mesh>
          <boxGeometry args={[1.7, 2.1, 0.06]} />
          <meshStandardMaterial color="#fbfaf6" />
        </mesh>
        <mesh position={[0, 0.05, 0.04]}>
          <planeGeometry args={[1.45, 1.8]} />
          <meshStandardMaterial map={photoTexture()} roughness={0.6} />
        </mesh>
      </group>
      <Plant position={[5.2, -3.35, -1.8]} scale={1.8} />
    </group>
  )
}

const SCENES: Record<string, () => ReactNode> = {
  bedside: Bedside,
  bed: Bed,
  window: WindowSill,
  shelf: Bookshelf,
  desk: Desk,
  sofa: Sofa,
  suitcase: Suitcase,
}

/** The current place, or nothing for the studio. */
export function Places() {
  const place = useDoll((s) => s.place)
  const Scene = SCENES[place]
  return Scene ? <Scene /> : null
}
