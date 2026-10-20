// The glass heart and the liquid inside it.
import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HEART_NOTCH_Y, HEART_TIP_Y, HEART_TOP_Y, heartGeometry, heightForVolume } from "./heartShape";
import { createLiquidMaterial } from "./liquidMaterial";
import { HEART_POS } from "./layout";
import type { World } from "./world";

const INSET = 0.075; // glass thickness
const BUBBLES = 16;

export function Heart({ world }: { world: RefObject<World> }) {
  const group = useRef<THREE.Group>(null);
  const glass = useMemo(() => heartGeometry(0), []);
  const inner = useMemo(() => heartGeometry(INSET), []);
  const liquid = useMemo(createLiquidMaterial, []);
  const stream = useRef<THREE.Mesh>(null);
  const bubbles = useRef<THREE.InstancedMesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const halo = useRef<THREE.Mesh>(null);
  const haloTex = useMemo(radialTexture, []);

  // Inside the glass, the liquid runs from just above the tip to just
  // under the top of the lobes.
  const bottom = HEART_TIP_Y + INSET + 0.05;
  const top = HEART_TOP_Y - INSET + 0.04;

  // Sloshing: the surface's slope in x and z, each a damped spring.
  const slosh = useRef({ x: 0, vx: 0, z: 0, vz: 0, ripple: 0, level: 0 });
  const bubbleState = useMemo(() => Array.from({ length: BUBBLES }, () => ({ x: 0, y: -99, z: 0, v: 0, r: 0 })), []);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const center = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dtRaw) => {
    const w = world.current;
    const g = group.current;
    if (!w || !g) return;
    const dt = Math.min(dtRaw, 1 / 20);
    const t = state.clock.elapsedTime;
    const flow = w.flow;

    // ----- the heartbeat: scale, light and glow ---------------------------
    const s = 1 + 0.055 * w.beat;
    g.scale.setScalar(s);
    g.getWorldPosition(center);

    // ----- level and slosh -----------------------------------------------------
    const sl = slosh.current;
    // The level glides a touch behind the volume, like a real pour settling.
    sl.level += (flow.level - sl.level) * Math.min(1, dt * 10);
    const h = heightForVolume(sl.level);
    const surfaceLocal = bottom + h * (top - bottom);
    if (!w.calm) {
      const k = 70, c = 3.2;
      // Tilting the phone throws the liquid the other way.
      sl.vx += (-k * sl.x - c * sl.vx - w.rigVel.y * 0.9) * dt;
      sl.vz += (-k * sl.z - c * sl.vz + w.rigVel.x * 0.9) * dt;
      sl.x += sl.vx * dt;
      sl.z += sl.vz * dt;
      sl.x = THREE.MathUtils.clamp(sl.x, -0.35, 0.35);
      sl.z = THREE.MathUtils.clamp(sl.z, -0.35, 0.35);
      const stirring = (flow.pouring("them") || flow.pouring("you") ? 0.8 : 0) + w.beat * 0.7;
      sl.ripple += (Math.max(stirring, 0.12) - sl.ripple) * Math.min(1, dt * 3);
    } else {
      sl.x = sl.z = sl.vx = sl.vz = 0;
      sl.ripple = 0;
    }

    const u = liquid.uniforms;
    u.uTime.value = t;
    u.uCenter.value.copy(center);
    u.uSurfaceY.value = sl.level <= 0.002 ? -100 : center.y + surfaceLocal * s;
    u.uTilt.value.set(sl.x, sl.z);
    u.uRipple.value = sl.ripple;
    u.uGlow.value = w.glow * 0.6 + w.beat * 0.5;

    // ----- Them's pour: a stream from the top, while it's filling ----------
    const st = stream.current;
    if (st) {
      const pouring = flow.pouring("them") && !w.calm;
      const from = HEART_NOTCH_Y - 0.02;
      const to = Math.max(surfaceLocal, bottom);
      const len = Math.max(0.001, from - to);
      st.visible = pouring && len > 0.02;
      st.position.set(0, (from + to) / 2, 0);
      st.scale.set(1 + Math.sin(t * 30) * 0.12, len, 1 + Math.cos(t * 26) * 0.12);
    }

    // ----- Your pour: bubbles rising from the tip ----------------------------
    const bm = bubbles.current;
    if (bm) {
      const pouring = flow.pouring("you") && !w.calm;
      bubbleState.forEach((b, i) => {
        if (b.y < -50 && pouring && Math.random() < dt * 9) {
          b.x = (Math.random() - 0.5) * 0.22; b.z = (Math.random() - 0.5) * 0.16;
          b.y = bottom + 0.06; b.v = 0.3 + Math.random() * 0.5; b.r = 0.012 + Math.random() * 0.022;
        }
        if (b.y > -50) {
          b.v = Math.min(b.v + dt * 1.6, 1.4);
          b.y += b.v * dt;
          b.x += Math.sin(t * 8 + i) * dt * 0.05;
          if (b.y > surfaceLocal - 0.02) { b.y = -99; sl.vx += (Math.random() - 0.5) * 0.4; }
        }
        tmp.position.set(b.x, b.y, b.z);
        tmp.scale.setScalar(b.y > -50 ? b.r : 0);
        tmp.updateMatrix();
        bm.setMatrixAt(i, tmp.matrix);
      });
      bm.instanceMatrix.needsUpdate = true;
    }

    // ----- light from inside the heart -------------------------------------------
    if (light.current) {
      light.current.intensity = sl.level * 3 + w.glow * 4 + w.beat * 9;
      light.current.position.y = surfaceLocal * 0.5;
    }
    if (halo.current) {
      const m = halo.current.material as THREE.MeshBasicMaterial;
      // A soft pink haze on the paper behind the heart.
      m.opacity = (0.08 + sl.level * 0.18 + w.glow * 0.35 + w.beat * 0.25) * 0.45;
      halo.current.scale.setScalar(1 + w.beat * 0.08);
    }
  });

  return (
    <group position={HEART_POS}>
      {/* A warm glow behind the heart. */}
      <mesh ref={halo} position={[0, 0, -0.9]} renderOrder={-1}>
        <planeGeometry args={[5.2, 5.2]} />
        <meshBasicMaterial map={haloTex} transparent depthWrite={false} toneMapped={false} />
      </mesh>

      <group ref={group}>
        <mesh geometry={inner} material={liquid.material} />

        <mesh ref={stream} visible={false}>
          <cylinderGeometry args={[0.028, 0.034, 1, 12, 1, true]} />
          <meshBasicMaterial color="#ff4d6d" toneMapped={false} />
        </mesh>

        <instancedMesh ref={bubbles} args={[undefined, undefined, BUBBLES]}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshBasicMaterial color="#ffd0d8" transparent opacity={0.55} toneMapped={false} />
        </instancedMesh>

        {/* Frosted glass, soft like the website: the liquid shows through,
            gently blurred, with no hard reflections. */}
        <mesh geometry={glass}>
          <meshPhysicalMaterial
            color="#ffffff"
            transmission={1}
            roughness={0.2}
            thickness={0.9}
            ior={1.3}
            attenuationColor="#f6e1dd"
            attenuationDistance={2.5}
            clearcoat={0.35}
            clearcoatRoughness={0.4}
            specularIntensity={0.45}
            envMapIntensity={0.7}
          />
        </mesh>

        <pointLight ref={light} color="#ff3d62" distance={5.5} decay={1.6} intensity={0} />
      </group>
    </group>
  );
}

/** A soft round glow, drawn once into a small texture. */
function radialTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,70,100,1)");
  grad.addColorStop(0.35, "rgba(200,30,70,0.45)");
  grad.addColorStop(1, "rgba(120,0,40,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
