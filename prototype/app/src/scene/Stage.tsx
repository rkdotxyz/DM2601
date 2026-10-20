// The 3D scene: camera, light, the heart, tubes and people, floating motes,
// and the Director that moves it all from the doll's status.
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { Heart } from "./Heart";
import { Tube } from "./Tube";
import { Figure } from "./Figure";
import { FRAME, THEM_DISC, TUBE_THEM, TUBE_YOU, YOU_DISC } from "./layout";
import { createWorld, lubDub, type World } from "./world";
import { tilt } from "../fx/tilt";
import { choosePhoto } from "./photo";
import * as sound from "../fx/sound";
import { beatFeel } from "../fx/haptics";
import type { DollEventPing } from "../app/useDoll";

type Props = {
  them: boolean;
  online: boolean;
  state: string;
  you: boolean;
  pending: boolean;
  ping: DollEventPing | null;
  calm: boolean;
  onToggle: () => void;
};

export function Stage({ them, you, online, state, pending, ping, calm, onToggle }: Props) {
  const world = useRef<World>(createWorld());

  // For development: inspect and fast-forward the scene from the console.
  if (import.meta.env.DEV) (window as unknown as { __world: World }).__world = world.current;

  // Hand React's latest values to the frame loop.
  useEffect(() => {
    const w = world.current;
    w.them = them; w.you = you; w.calm = calm; w.pending = pending; w.dollState = state;
    w.flow.set("them", them);
    w.flow.set("you", you);
    if (calm) w.flow.settle();
  }, [them, you, calm, pending, state]);

  // Fade the scene in once its first frame is drawn, instead of popping in.
  const [ready, setReady] = useState(false);
  const themTag = useRef<HTMLDivElement>(null);
  const youTag = useRef<HTMLDivElement>(null);

  return (
    <>
    <Canvas
      className={`stage-canvas${ready ? " ready" : ""}`}
      dpr={[1, 2]}
      camera={{ fov: 30, near: 0.1, far: 60, position: [0, FRAME.cy, 12] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={() => {
        requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
      }}
    >
      <Director world={world} ping={ping} />
      <Rig world={world}>
        <Heart world={world} />
        <Tube person="them" curve={TUBE_THEM} world={world} />
        <Tube person="you" curve={TUBE_YOU} world={world} />
        <Figure person="them" position={THEM_DISC} world={world} />
        <Figure person="you" position={YOU_DISC} world={world} onTap={onToggle} />
        <Anchor at={THEM_TAG} target={themTag} />
        <Anchor at={YOU_TAG} target={youTag} />
      </Rig>
      {/* The website's paper, as the scene's own background: the frosted
          glass shows it through, softly blurred. */}
      <color attach="background" args={["#efe9e3"]} />

      {/* The website's studio lighting (website/src/Scene.tsx). */}
      <ambientLight intensity={0.45} />
      <directionalLight position={[2.5, 4, 3]} intensity={1.6} color="#fff4e8" />
      <directionalLight position={[-3, 2, -2]} intensity={0.5} color="#dfe8ff" />
      {/* soft studio reflections, built here so nothing is downloaded */}
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={1.6} position={[0, 4, 2]} scale={[6, 2, 1]} />
        <Lightformer form="rect" intensity={0.8} position={[-4, 1, 1]} scale={[2, 4, 1]} />
        <Lightformer form="rect" intensity={0.6} position={[4, 1, -1]} scale={[2, 4, 1]} />
      </Environment>
    </Canvas>
    <div ref={themTag} className="anchor"><NameTag name="Them" status={them ? "here" : "away"} on={them} /></div>
    <div ref={youTag} className="anchor">
      <div className="tag-row">
        <NameTag name="You" status={!online ? "…" : you ? "here" : "away"} on={you} />
        <PhotoButton />
      </div>
    </div>
    </>
  );
}

const THEM_TAG = new THREE.Vector3(0.62, THEM_DISC.y + 0.55, 0);
const YOU_TAG = new THREE.Vector3(0.68, YOU_DISC.y + 0.73, 0);

/** Keeps an HTML element over a point in the scene, as it tilts. */
function Anchor({ at, target }: { at: THREE.Vector3; target: RefObject<HTMLDivElement | null> }) {
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    const el = target.current;
    if (!el) return;
    v.copy(at);
    // The anchor lives inside the tilting rig: use its world position.
    v.applyMatrix4(rigMatrix);
    v.project(camera);
    const x = (v.x * 0.5 + 0.5) * size.width;
    const y = (-v.y * 0.5 + 0.5) * size.height;
    // The tag's left edge sits at the point, just beside the person.
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translateY(-50%)`;
    el.style.opacity = "1";
  });
  return null;
}

// The rig's world matrix, shared with the anchors each frame.
const rigMatrix = new THREE.Matrix4();

/** Pick your own photo for the locket. */
function PhotoButton() {
  return (
    <label className="photo-btn" title="Use your own photo">
      <input type="file" accept="image/*" className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void choosePhoto(f); e.target.value = ""; }} />
      <svg viewBox="0 0 24 24" aria-hidden><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.2l1.3-2h6l1.3 2h1.2A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z" /><circle cx="12" cy="12.5" r="3.4" /></svg>
      <span className="sr-only">Use your own photo</span>
    </label>
  );
}

function NameTag({ name, status, on }: { name: string; status: string; on: boolean }) {
  return <div className={`name-tag${on ? " on" : ""}`}><b>{name}</b><span>{status}</span></div>;
}

/** Fits the composition to the canvas, and tilts it with the phone. */
function Rig({ world, children }: { world: RefObject<World>; children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const { camera, size } = useThree();
  const cur = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const half = THREE.MathUtils.degToRad(cam.fov / 2);
    const aspect = size.width / Math.max(1, size.height);
    const zH = FRAME.h / 2 / Math.tan(half);
    const zW = FRAME.w / 2 / (Math.tan(half) * aspect);
    cam.position.z = Math.max(zH, zW) + 0.3;
    cam.updateProjectionMatrix();
  }, [camera, size]);

  useFrame((state, dtRaw) => {
    const g = group.current;
    const w = world.current;
    if (!g || !w) return;
    const dt = Math.min(dtRaw, 1 / 20);
    const c = cur.current;
    const tx = w.calm ? 0 : tilt.x, ty = w.calm ? 0 : tilt.y;
    const nx = c.x + (tx - c.x) * Math.min(1, dt * 5);
    const ny = c.y + (ty - c.y) * Math.min(1, dt * 5);
    w.rigVel.x = (nx - c.x) / Math.max(dt, 1e-3);
    w.rigVel.y = (ny - c.y) / Math.max(dt, 1e-3);
    c.x = nx; c.y = ny;
    // A slow float, plus the tilt.
    const t = state.clock.elapsedTime;
    g.rotation.y = c.x * 0.32 + (w.calm ? 0 : Math.sin(t * 0.25) * 0.04);
    g.rotation.x = c.y * 0.16;
    state.camera.position.x = -c.x * 0.35;
    state.camera.lookAt(0, FRAME.cy, 0);
    g.updateMatrixWorld();
    rigMatrix.copy(g.matrixWorld);
  });

  return <group ref={group}>{children}</group>;
}

/** Moves time forward: the flow, the heartbeat, and the sounds and feel that go with them. */
function Director({ world, ping }: { world: RefObject<World>; ping: DollEventPing | null }) {
  const clock = useThree((s) => s.clock);
  const mem = useRef({ full: false, beatPhase: 0, beatStart: 0, beats: 0, prog: { them: 0, you: 0 } });

  // The doll person pressed Heart.
  useEffect(() => {
    if (ping?.event !== "heart") return;
    world.current.heartPingAt = clock.elapsedTime;
    sound.chime();
    beatFeel(false);
  }, [ping, world, clock]);

  useFrame((state, dtRaw) => {
    const w = world.current;
    const m = mem.current;
    const dt = Math.min(dtRaw, 1 / 20);
    const t = state.clock.elapsedTime;
    const flow = w.flow;
    flow.step(dt);

    // Sounds of liquid: a pour while it travels, a bloop as it reaches the heart.
    let moving = 0;
    for (const p of ["them", "you"] as const) {
      const before = m.prog[p], now = flow.progress[p];
      if (now !== before) moving = Math.max(moving, flow.target[p] === 2 ? 1 : 0.6);
      if (before < 1 && now >= 1 && flow.target[p] === 2) sound.bloop(p === "them" ? 1.15 : 0.9);
      m.prog[p] = now;
    }
    sound.pourLevel(w.calm ? 0 : moving);

    // Full: both here and the heart has filled up. Then it beats.
    const full = w.them && w.you && flow.level >= 0.999;
    if (full && !m.full) { m.beatStart = t; m.beats = 0; sound.together(); }
    if (!full && m.full && !(w.them && w.you)) sound.apart();
    m.full = full;
    w.brimming = full;

    w.glow += ((full ? 1 : flow.level * 0.3) - w.glow) * Math.min(1, dt * 2);
    if (full) {
      const phase = ((t - m.beatStart) % 1 + 1) % 1;
      w.beat = w.calm ? 0 : lubDub(phase);
      if (m.beatPhase < 0.07 && phase >= 0.07) {
        sound.heartbeat(0.9);
        if (m.beats < 3) beatFeel(true); // a few beats you can feel, then just sound
        m.beats++;
      }
      m.beatPhase = phase;
    } else {
      w.beat *= Math.max(0, 1 - dt * 6);
      m.beatPhase = 0;
    }
  });
  return null;
}
