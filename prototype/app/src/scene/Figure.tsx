// A person on a glass disc: the doll person is the Heart Doll itself, and
// you are your photo in a floating locket. Dim when away; warm and lit when
// here. You can tap yourself; the doll hops when its Heart is pressed.
import { useRef, useState, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DISC_R } from "./layout";
import { Doll } from "./doll/Doll";
import { Portrait } from "./Portrait";
import type { Person } from "./flow";
import type { World } from "./world";

const RING_OFF = new THREE.Color("#3a2a31");
const RING_ON = new THREE.Color("#ff3b63");

type Props = {
  person: Person;
  position: THREE.Vector3;
  world: RefObject<World>;
  onTap?: () => void;
};

export function Figure({ person, position, world, onTap }: Props) {
  const fig = useRef<THREE.Group>(null);
  const on = useRef(0); // 0 away .. 1 here, eased; the doll and the locket read it
  const ring = useRef<THREE.MeshStandardMaterial>(null);
  const pendingRing = useRef<THREE.Mesh>(null);
  const ripple = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);
  // Springs: squash (scale y), hop (height), and how "on" the figure looks.
  const sp = useRef({ squash: 0, squashV: 0, hop: 0, hopV: 0, on: 0, lastTap: -10, lastPing: -10 });

  useFrame((state, dtRaw) => {
    const w = world.current;
    const g = fig.current;
    if (!w || !g) return;
    const dt = Math.min(dtRaw, 1 / 20);
    const t = state.clock.elapsedTime;
    const s = sp.current;
    const here = person === "them" ? w.them : w.you;

    // A tap squashes you; the doll's Heart press makes them hop.
    if (person === "you" && w.tapAt !== s.lastTap) { s.lastTap = w.tapAt; s.squashV -= 7; }
    if (person === "them" && w.heartPingAt !== s.lastPing) { s.lastPing = w.heartPingAt; s.hopV += 2.6; s.squashV += 3; }
    if (w.calm) { s.squash = s.squashV = s.hop = s.hopV = 0; }
    else {
      s.squashV += (-260 * s.squash - 14 * s.squashV) * dt;
      s.squash += s.squashV * dt;
      s.hopV += (-9.8 * 1.4) * dt;
      s.hop = Math.max(0, s.hop + s.hopV * dt);
      if (s.hop === 0 && s.hopV < 0) { if (s.hopV < -1) s.squashV -= 2.5; s.hopV = 0; }
    }

    s.on += ((here ? 1 : 0) - s.on) * Math.min(1, dt * 4);
    // Here and alone: breathe slowly, like the doll's LED. Together: beat.
    const breathe = here && !w.brimming && !w.calm ? (1 - Math.cos((t / 4) * Math.PI * 2)) / 2 : 0;
    const beat = w.beat;
    const hoverLift = hover && person === "you" ? 0.04 : 0;

    g.position.y = s.hop + hoverLift + breathe * 0.02;
    g.scale.set(1 - s.squash * 0.5, 1 + s.squash, 1 - s.squash * 0.5);
    g.rotation.y = person === "them" && !w.calm ? Math.sin(t * 0.4) * 0.16 : 0;
    on.current = s.on;
    if (ring.current) {
      ring.current.color.copy(RING_OFF).lerp(RING_ON, s.on);
      ring.current.emissive.copy(RING_ON);
      ring.current.emissiveIntensity = s.on * (0.5 + breathe * 1.4 + beat * 2.2);
    }

    if (pendingRing.current) {
      pendingRing.current.visible = person === "you" && w.pending;
      pendingRing.current.rotation.z = -t * 5;
    }
    if (ripple.current) {
      const age = t - w.heartPingAt;
      const m = ripple.current.material as THREE.MeshBasicMaterial;
      const show = person === "them" && age < 1.2 && !w.calm;
      ripple.current.visible = show;
      if (show) {
        ripple.current.scale.setScalar(1 + age * 1.6);
        m.opacity = 0.7 * (1 - age / 1.2);
      }
    }
  });

  const tap = onTap ? {
    onClick: (e: { stopPropagation: () => void }) => { e.stopPropagation(); onTap(); },
    onPointerOver: () => { setHover(true); document.body.style.cursor = "pointer"; },
    onPointerOut: () => { setHover(false); document.body.style.cursor = ""; },
  } : {};

  return (
    <group position={position} scale={1.18}>
      {/* the disc */}
      <mesh position={[0, -0.04, 0]}>
        <cylinderGeometry args={[DISC_R, DISC_R * 1.04, 0.08, 64]} />
        <meshPhysicalMaterial color="#2a1c22" roughness={0.3} clearcoat={1} clearcoatRoughness={0.12} envMapIntensity={1.2} />
      </mesh>
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[DISC_R - 0.035, 0.012, 12, 96]} />
        <meshStandardMaterial ref={ring} color={RING_OFF} emissive={RING_ON} emissiveIntensity={0} toneMapped={false} />
      </mesh>

      {/* waiting for the doll's answer to your tap */}
      <mesh ref={pendingRing} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <torusGeometry args={[DISC_R + 0.06, 0.012, 8, 64, Math.PI * 0.55]} />
        <meshBasicMaterial color="#ff7a92" toneMapped={false} />
      </mesh>

      {/* the doll person pressed Heart */}
      <mesh ref={ripple} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <torusGeometry args={[DISC_R, 0.01, 8, 96]} />
        <meshBasicMaterial color="#ff5c7a" transparent toneMapped={false} />
      </mesh>

      {/* the person */}
      <group ref={fig}>
        {person === "them"
          ? <group scale={0.5}><Doll world={world} on={on} /></group>
          : <Portrait world={world} on={on} />}
      </group>

      {/* a generous, invisible target for your finger */}
      {onTap && (
        <mesh position={[0, 0.6, 0]} {...tap}>
          <sphereGeometry args={[0.72, 12, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}
