// The doll person: the Heart Doll itself, the same knitted body as in the
// customiser website, in the same soft studio light. Its fabric heart glows
// exactly like the real doll's LED for the current state.
import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Decal } from "@react-three/drei";
import * as THREE from "three";
import { createBodyGeometry, FACE, radiusAt, surfacePoint } from "./profile";
import { faceTexture, heartGlowTexture, heartPatchTexture, knitTexture } from "./textures";
import { heartLevel } from "./heartbeat";
import type { World } from "../world";

const noRaycast = () => null;
// The customiser's heather-grey fabric: dimmed while the doll person is
// away, its true colour when they're here.
const AWAY = new THREE.Color("#a09e9c");
const HERE = new THREE.Color("#bdbbb9");

export function Doll({ world, on }: { world: RefObject<World>; on: RefObject<number> }) {
  const geometry = useMemo(createBodyGeometry, []);
  const fabric = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: AWAY,
    roughness: 0.92,
    sheen: 1,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color("#ffd2da").multiplyScalar(0.45),
    bumpMap: knitTexture(),
    bumpScale: 1.4,
  }), []);
  const heart = useRef<THREE.MeshStandardMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const heartAt = surfacePoint(0, FACE.heartY);
  const faceAt = surfacePoint(0, FACE.eyeY - 0.07);

  useFrame(() => {
    const w = world.current;
    if (!w) return;
    fabric.color.copy(AWAY).lerp(HERE, on.current ?? 0);
    // The real doll's LED pattern for this state: breathing, 60% or 100%.
    const level = heartLevel(w.dollState, performance.now());
    if (heart.current) heart.current.emissiveIntensity = level * 4.2;
    if (light.current) light.current.intensity = level * 2.4;
  });

  return (
    <group>
      <mesh geometry={geometry} material={fabric} raycast={noRaycast}>
        <Decal position={[faceAt.x, faceAt.y, faceAt.z]} rotation={Math.PI} scale={[0.62, 0.31, 0.5]} depthTest polygonOffsetFactor={-1}>
          <meshStandardMaterial map={faceTexture()} roughness={0.8} transparent alphaTest={0.4} depthWrite={false} polygonOffset polygonOffsetUnits={-4} />
        </Decal>
        <Decal position={[heartAt.x, heartAt.y, heartAt.z]} rotation={Math.PI} scale={[0.5, 0.5, 0.5]} depthTest polygonOffsetFactor={-1}>
          <meshStandardMaterial ref={heart} map={heartPatchTexture()} emissiveMap={heartGlowTexture()} emissive="#ff2a4d"
            emissiveIntensity={0} roughness={0.85} transparent alphaTest={0.4} depthWrite={false} polygonOffset polygonOffsetUnits={-4} />
        </Decal>
      </mesh>
      <pointLight ref={light} color="#ff3b5c" position={[0, FACE.heartY, heartAt.z + 0.35]} distance={1.6} decay={2} intensity={0} />
      <Seam theta={1.25} />
      <Seam theta={-1.25} />
      {[-1, 1].map((side) => (
        <mesh key={side} material={fabric} position={[side * 0.3, 0.1, radiusAt(0.1) + 0.06]}
          rotation={[0.15, side * 0.32, 0]} scale={[0.19, 0.11, 0.3]} raycast={noRaycast}>
          <sphereGeometry args={[1, 32, 20]} />
        </mesh>
      ))}
    </group>
  );
}

function Seam({ theta }: { theta: number }) {
  const geometry = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let y = 0.06; y <= 1.985; y += 0.03) pts.push(surfacePoint(theta, y, 0.004));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 96, 0.005, 6, false);
  }, [theta]);
  return (
    <mesh geometry={geometry} raycast={noRaycast}>
      <meshStandardMaterial color="#4c4645" roughness={1} />
    </mesh>
  );
}
