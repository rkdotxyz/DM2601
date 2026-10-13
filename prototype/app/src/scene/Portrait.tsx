// You: your photo in a floating rose-gold locket. Faded
// and cool while you're away; warm, full colour and ringed with light
// when you're here.
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getPhoto, subscribePhoto } from "./photo";
import type { World } from "./world";

const R = 0.37; // the photo's radius

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uOn;
  uniform float uGlow;
  varying vec2 vUv;
  void main() {
    vec3 c = texture2D(uMap, vUv).rgb;
    float grey = dot(c, vec3(0.299, 0.587, 0.114));
    // Away: faded, cool and dim, like a photo in a dark room.
    vec3 away = mix(vec3(grey), c, 0.15) * vec3(0.78, 0.8, 0.88) * 0.55;
    // Here: full colour, warmed by the heart's light.
    vec3 here = c * vec3(1.04, 0.97, 0.95);
    vec3 col = mix(away, here, uOn);
    // A soft vignette, and a warm glow creeping in from the edge.
    float d = distance(vUv, vec2(0.5));
    col *= 1.0 - smoothstep(0.3, 0.52, d) * 0.45;
    col += vec3(1.0, 0.25, 0.35) * smoothstep(0.35, 0.5, d) * (0.18 * uOn + 0.35 * uGlow);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

export function Portrait({ world, on }: { world: RefObject<World>; on: RefObject<number> }) {
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uMap: { value: null as THREE.Texture | null }, uOn: { value: 0 }, uGlow: { value: 0 } },
    vertexShader: vertex,
    fragmentShader: fragment,
  }), []);
  const halo = useRef<THREE.MeshStandardMaterial>(null);
  const float = useRef<THREE.Group>(null);

  // Load the photo, and again whenever you pick a new one.
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const load = () => loader.load(getPhoto(), (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      material.uniforms.uMap.value?.dispose();
      material.uniforms.uMap.value = tex;
    });
    load();
    return subscribePhoto(load);
  }, [material]);

  useFrame((state) => {
    const w = world.current;
    if (!w) return;
    const t = state.clock.elapsedTime;
    const o = on.current ?? 0;
    material.uniforms.uOn.value = o;
    material.uniforms.uGlow.value = w.beat;
    if (halo.current) halo.current.emissiveIntensity = o * (0.9 + w.beat * 2.5);
    if (float.current) {
      float.current.position.y = 0.62 + (w.calm ? 0 : Math.sin(t * 1.15) * 0.035);
      float.current.rotation.z = w.calm ? 0 : Math.sin(t * 0.7) * 0.025;
    }
  });

  return (
    <group ref={float} position={[0, 0.62, 0]}>
      {/* a ring of light behind the locket */}
      <mesh position={[0, 0, -0.05]}>
        <torusGeometry args={[R + 0.07, 0.014, 12, 96]} />
        <meshStandardMaterial ref={halo} color="#3a2026" emissive="#ff3b63" emissiveIntensity={0} toneMapped={false} />
      </mesh>
      {/* the locket: a rose-gold back and rim */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.03]}>
        <cylinderGeometry args={[R + 0.035, R + 0.035, 0.05, 72]} />
        <meshPhysicalMaterial color="#d9a596" metalness={0.85} roughness={0.28} clearcoat={0.6} envMapIntensity={1.4} />
      </mesh>
      <mesh>
        <torusGeometry args={[R + 0.012, 0.026, 20, 96]} />
        <meshPhysicalMaterial color="#e8b8aa" metalness={0.9} roughness={0.18} clearcoat={1} envMapIntensity={1.8} />
      </mesh>
      {/* the photo */}
      <mesh material={material} position={[0, 0, 0.002]}>
        <circleGeometry args={[R, 72]} />
      </mesh>
    </group>
  );
}
