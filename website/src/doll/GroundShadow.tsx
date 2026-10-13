import { useMemo } from 'react'
import * as THREE from 'three'

/** A soft round shadow under the doll: a blurred disc, cheap and steady. */
export function GroundShadow({ opacity }: { opacity: number }) {
  const texture = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const ctx = c.getContext('2d')!
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
    g.addColorStop(0, 'rgba(40,30,30,0.9)')
    g.addColorStop(0.45, 'rgba(40,30,30,0.55)')
    g.addColorStop(1, 'rgba(40,30,30,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 256)
    return new THREE.CanvasTexture(c)
  }, [])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0.1]} scale={[2.3, 2, 1]} raycast={() => null}>
      <planeGeometry />
      <meshBasicMaterial map={texture} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  )
}
