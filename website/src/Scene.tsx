import { useEffect } from 'react'
import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, Lightformer, OrbitControls } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { useDoll } from './store'
import { Doll } from './doll/Doll'
import { GroundShadow } from './doll/GroundShadow'
import { Places } from './places/Places'
import { placeInfo } from './places/list'

/** On narrow screens, widen the view so the doll and some of the room still fit. */
function ResponsiveFov() {
  const get = useThree((s) => s.get)
  const aspect = useThree((s) => s.size.width / s.size.height)
  useEffect(() => {
    const camera = get().camera as THREE.PerspectiveCamera
    camera.fov = THREE.MathUtils.clamp(30 * Math.sqrt(1.4 / aspect), 30, 46)
    camera.updateProjectionMatrix()
  }, [get, aspect])
  return null
}

export function Scene() {
  const night = useDoll((s) => s.night)
  const place = useDoll((s) => s.place)
  const azimuth = placeInfo(place).azimuth
  const background = night ? '#151827' : '#efe9e3'

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 1.4, 6.6], fov: 30 }}
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      aria-label="3D view of the Heart Doll"
    >
      <color attach="background" args={[background]} />

      <ambientLight intensity={night ? 0.12 : 0.45} />
      <directionalLight
        position={[2.5, 4, 3]}
        intensity={night ? 0.35 : 1.6}
        color={night ? '#9fb0ff' : '#fff4e8'}
      />
      <directionalLight position={[-3, 2, -2]} intensity={night ? 0.15 : 0.5} color="#dfe8ff" />
      {/* soft studio reflections, built here so nothing is downloaded */}
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={night ? 0.3 : 1.6} position={[0, 4, 2]} scale={[6, 2, 1]} />
        <Lightformer form="rect" intensity={night ? 0.15 : 0.8} position={[-4, 1, 1]} scale={[2, 4, 1]} />
        <Lightformer form="rect" intensity={night ? 0.15 : 0.6} position={[4, 1, -1]} scale={[2, 4, 1]} />
      </Environment>

      <ResponsiveFov />
      <Doll />
      <Places />

      <GroundShadow opacity={night ? 0.7 : 0.5} />

      <OrbitControls
        makeDefault
        target={[0, 1.05, 0]}
        enablePan={false}
        minDistance={3}
        maxDistance={7.5}
        minAzimuthAngle={-azimuth}
        maxAzimuthAngle={azimuth}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI / 2 - 0.04}
      />

      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur intensity={night ? 1.1 : 0.55} radius={0.6} luminanceThreshold={1} luminanceSmoothing={0.25} />
      </EffectComposer>
    </Canvas>
  )
}
