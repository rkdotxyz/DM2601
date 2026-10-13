import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Decal } from '@react-three/drei'
import { DEFAULT_COLOUR, dollState, useDoll } from '../store'
import { createBodyGeometry, FACE, radiusAt, surfacePoint } from './profile'
import { faceTexture, heartGlowTexture, heartPatchTexture, knitTexture, stickerTexture } from './textures'
import { clearPaint, endStroke, paintTexture, paintTo } from './paint'
import { heartLevel } from './heartbeat'
import { Accessories } from './Accessories'

const noRaycast = () => null

/** The body's fabric. Shared by the body and the feet; its colour eases towards the chosen one. */
function useFabric() {
  const bodyColour = useDoll((s) => s.bodyColour)
  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: DEFAULT_COLOUR,
        roughness: 0.92,
        sheen: 1,
        sheenRoughness: 0.55,
        sheenColor: new THREE.Color('#ffffff').multiplyScalar(0.35),
        bumpMap: knitTexture(),
        bumpScale: 1.4,
      }),
    [],
  )
  const target = useMemo(() => new THREE.Color(), [])
  useFrame((_, dt) => {
    target.set(bodyColour)
    material.color.lerp(target, 1 - Math.exp(-dt * 10))
  })
  return material
}

function Seam({ theta, colour }: { theta: number; colour: string }) {
  const geometry = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let y = 0.06; y <= 1.985; y += 0.03) pts.push(surfacePoint(theta, y, 0.004))
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 96, 0.005, 6, false)
  }, [theta])
  return (
    <mesh geometry={geometry} raycast={noRaycast}>
      <meshStandardMaterial color={colour} roughness={1} />
    </mesh>
  )
}

function Feet({ material }: { material: THREE.Material }) {
  const geometry = useMemo(() => new THREE.SphereGeometry(1, 32, 20), [])
  const z = radiusAt(0.1) + 0.06
  return (
    <>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          geometry={geometry}
          material={material}
          position={[side * 0.3, 0.1, z]}
          rotation={[0.15, side * 0.32, 0]}
          scale={[0.19, 0.11, 0.3]}
          castShadow
        />
      ))}
    </>
  )
}

/** The fabric heart. It glows red with the same rhythm as the real doll. */
function HeartPatch() {
  const material = useRef<THREE.MeshStandardMaterial>(null)
  const light = useRef<THREE.PointLight>(null)
  const p = surfacePoint(0, FACE.heartY)
  useFrame(() => {
    const { them, you, night } = useDoll.getState()
    const level = heartLevel(dollState(them, you), performance.now())
    if (material.current) material.current.emissiveIntensity = level * (night ? 4.5 : 3.2)
    if (light.current) light.current.intensity = level * (night ? 2.2 : 1.2)
  })
  return (
    <>
      <Decal position={[p.x, p.y, p.z]} rotation={Math.PI} scale={[0.5, 0.5, 0.5]} depthTest polygonOffsetFactor={-1} raycast={noRaycast}>
        <meshStandardMaterial
          ref={material}
          map={heartPatchTexture()}
          emissiveMap={heartGlowTexture()}
          emissive="#ff2a4d"
          emissiveIntensity={0}
          roughness={0.85}
          transparent
          alphaTest={0.4}
          depthWrite={false}
          polygonOffset
          polygonOffsetUnits={-4}
        />
      </Decal>
      <pointLight ref={light} color="#ff3b5c" position={[0, FACE.heartY, p.z + 0.35]} distance={1.5} decay={2} intensity={0} />
    </>
  )
}

function Face() {
  const y = FACE.eyeY - 0.07
  const p = surfacePoint(0, y)
  return (
    <Decal position={[p.x, p.y, p.z]} rotation={Math.PI} scale={[0.62, 0.31, 0.5]} depthTest polygonOffsetFactor={-1} raycast={noRaycast}>
      <meshStandardMaterial map={faceTexture()} roughness={0.8} transparent alphaTest={0.4} depthWrite={false} polygonOffset polygonOffsetUnits={-4} />
    </Decal>
  )
}

function Stickers() {
  const stickers = useDoll((s) => s.stickers)
  return (
    <>
      {stickers.map((s) => (
        <Decal
          key={s.id}
          position={s.position}
          rotation={Math.PI + s.spin}
          scale={[s.size, s.size, 0.4]}
          depthTest
          polygonOffsetFactor={-1}
          renderOrder={3}
          raycast={noRaycast}
        >
          <meshStandardMaterial
            map={stickerTexture(s.kind)}
            emissiveMap={stickerTexture(s.kind)}
            emissive="#ffffff"
            emissiveIntensity={0.28}
            roughness={0.4}
            transparent
            alphaTest={0.3}
            depthWrite={false}
            polygonOffset
            polygonOffsetUnits={-6}
          />
        </Decal>
      ))}
    </>
  )
}

export function Doll() {
  const fabric = useFabric()
  const body = useRef<THREE.Mesh>(null)
  const geometry = useMemo(() => createBodyGeometry(), [])
  const painting = useRef(false)
  // OrbitControls (makeDefault) is paused while a stroke is being drawn, so
  // dragging on the doll draws and dragging anywhere else turns the view.
  const getThree = useThree((s) => s.get)
  const setOrbit = (enabled: boolean) => {
    const controls = getThree().controls as { enabled: boolean } | null
    if (controls) controls.enabled = enabled
  }
  const paintVersion = useDoll((s) => s.paintVersion)
  const bodyColour = useDoll((s) => s.bodyColour)

  useEffect(() => {
    if (paintVersion > 0) clearPaint()
  }, [paintVersion])

  const paintAt = (e: ThreeEvent<PointerEvent>) => {
    if (!e.uv || !body.current) {
      endStroke()
      return
    }
    const local = body.current.worldToLocal(e.point.clone())
    const { brushColour, brushSize, eraser, markPainted } = useDoll.getState()
    paintTo({ u: e.uv.x, v: e.uv.y, y: local.y }, brushColour, brushSize, eraser)
    if (!eraser) markPainted()
  }

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (useDoll.getState().tab !== 'sketch') return
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    painting.current = true
    setOrbit(false)
    endStroke()
    paintAt(e)
  }
  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (painting.current) paintAt(e)
  }
  const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
    painting.current = false
    setOrbit(true)
    endStroke()
    ;(e.target as Element).releasePointerCapture?.(e.pointerId)
  }
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    const state = useDoll.getState()
    if (state.tab !== 'stickers' || e.delta > 6 || !body.current) return
    e.stopPropagation()
    const local = body.current.worldToLocal(e.point.clone())
    state.addSticker([local.x, local.y, local.z])
  }

  const seamColour = useMemo(() => new THREE.Color(bodyColour).multiplyScalar(0.92).getStyle(), [bodyColour])

  return (
    <group>
      <mesh
        ref={body}
        geometry={geometry}
        material={fabric}
        castShadow
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onClick}
      >
        <Face />
        <HeartPatch />
        <Stickers />
      </mesh>
      {/* the drawing layer, a hair above the fabric. Stickers render after it, so they stay on top. */}
      <mesh geometry={geometry} scale={1.004} raycast={noRaycast} renderOrder={2}>
        <meshStandardMaterial map={paintTexture} transparent depthWrite={false} roughness={0.85} polygonOffset polygonOffsetFactor={-4} />
      </mesh>
      <Seam theta={1.25} colour={seamColour} />
      <Seam theta={-1.25} colour={seamColour} />
      <Feet material={fabric} />
      <Accessories />
    </group>
  )
}
