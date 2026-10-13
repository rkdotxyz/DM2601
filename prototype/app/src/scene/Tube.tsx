// A glass tube from a person to the heart, and the liquid travelling in it.
import { useMemo, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createTubeLiquidMaterial } from "./liquidMaterial";
import type { Person } from "./flow";
import type { World } from "./world";

export function Tube({ person, curve, world }: { person: Person; curve: THREE.Curve<THREE.Vector3>; world: RefObject<World> }) {
  const glass = useMemo(() => new THREE.TubeGeometry(curve, 180, 0.085, 22, false), [curve]);
  const core = useMemo(() => new THREE.TubeGeometry(curve, 180, 0.054, 16, false), [curve]);
  const liquid = useMemo(createTubeLiquidMaterial, []);
  const state = useMemo(() => ({ flow: 0, last: 0 }), []);

  useFrame((s, dt) => {
    const w = world.current;
    if (!w) return;
    const fill = w.flow.tube(person);
    const moving = Math.abs(fill - state.last) > 1e-5 || w.flow.pouring(person);
    state.last = fill;
    // Bands race while liquid is moving; a slow trickle while connected.
    const here = person === "them" ? w.them : w.you;
    const want = w.calm ? 0 : moving ? 1 : here && fill >= 1 ? 0.35 : 0;
    state.flow += (want - state.flow) * Math.min(1, dt * 4);
    const u = liquid.uniforms;
    u.uFill.value = fill <= 0.001 ? -1 : fill;
    u.uFlow.value = state.flow;
    u.uTime.value = s.clock.elapsedTime * (0.6 + state.flow * 0.6);
    u.uGlow.value = w.glow * 0.5 + w.beat * 0.4;
  });

  return (
    <group>
      <mesh geometry={core} material={liquid.material} />
      <mesh geometry={glass} renderOrder={1}>
        <meshPhysicalMaterial color="#3a1220" transparent opacity={0.28} roughness={0.15} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <mesh geometry={glass} renderOrder={3}>
        <meshPhysicalMaterial
          color="#000000"
          roughness={0.03}
          clearcoat={1}
          clearcoatRoughness={0.04}
          envMapIntensity={3}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
