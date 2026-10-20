// The liquid: the heart's inner shape, cut off at a surface that stays
// level with the world (so it stays flat when the phone tilts) and wobbles
// like a real liquid. The trick for the surface itself: where the cut
// opens the mesh, you look at its inside (back faces), and those are
// painted as the bright top of the liquid.
import * as THREE from "three";

export type LiquidUniforms = {
  uSurfaceY: { value: number }; //    world height of the surface at the centre
  uCenter: { value: THREE.Vector3 }; // centre the surface tilts about
  uTilt: { value: THREE.Vector2 }; //  slope of the surface in x and z (sloshing)
  uRipple: { value: number }; //      small ripples, 0..1
  uTime: { value: number };
  uGlow: { value: number }; //        heartbeat glow, 0..1
  uDeep: { value: THREE.Color };
  uMid: { value: THREE.Color };
  uTop: { value: THREE.Color };
};

const vertex = /* glsl */ `
  varying vec3 vWorld;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vView = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragment = /* glsl */ `
  uniform float uSurfaceY;
  uniform vec3 uCenter;
  uniform vec2 uTilt;
  uniform float uRipple;
  uniform float uTime;
  uniform float uGlow;
  uniform vec3 uDeep;
  uniform vec3 uMid;
  uniform vec3 uTop;
  varying vec3 vWorld;
  varying vec3 vNormal;
  varying vec3 vView;

  float surfaceAt(vec3 p) {
    vec2 d = p.xz - uCenter.xz;
    float ripple = uRipple * 0.018 * (sin(d.x * 9.0 + uTime * 3.1) + sin(d.y * 11.0 - uTime * 2.3) * 0.6);
    return uSurfaceY + dot(d, uTilt) + ripple;
  }

  void main() {
    float s = surfaceAt(vWorld);
    float below = s - vWorld.y;
    if (below < 0.0) discard;

    if (!gl_FrontFacing) {
      // The top of the liquid, seen through the cut.
      float sheen = 0.5 + 0.5 * sin((vWorld.x - vWorld.z) * 14.0 + uTime * 1.7);
      vec3 col = mix(uTop, vec3(1.0, 0.86, 0.88), 0.18 + 0.12 * sheen * uRipple);
      gl_FragColor = vec4(col * (1.0 + uGlow * 0.35), 1.0);
      #include <colorspace_fragment>
      return;
    }

    vec3 n = normalize(vNormal);
    vec3 v = normalize(vView);
    // Deeper is darker; a thin bright band just under the surface.
    float depth = clamp(below / 1.4, 0.0, 1.0);
    vec3 col = mix(uMid, uDeep, smoothstep(0.0, 1.0, depth));
    col = mix(col, uTop, smoothstep(0.05, 0.0, below) * 0.8);
    // Light passing through: soft key light and a rim where the glass curves away.
    vec3 key = normalize(vec3(-0.4, 0.8, 0.6));
    float diff = 0.55 + 0.45 * max(dot(n, key), 0.0);
    float rim = pow(1.0 - max(dot(n, v), 0.0), 2.5);
    col = col * diff + uTop * rim * 0.35;
    float spec = pow(max(dot(reflect(-key, n), v), 0.0), 40.0);
    col += vec3(1.0, 0.9, 0.92) * spec * 0.12;
    col *= 1.0 + uGlow * 0.45;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

export function createLiquidMaterial() {
  const uniforms: LiquidUniforms = {
    uSurfaceY: { value: -10 },
    uCenter: { value: new THREE.Vector3() },
    uTilt: { value: new THREE.Vector2() },
    uRipple: { value: 0 },
    uTime: { value: 0 },
    uGlow: { value: 0 },
    uDeep: { value: new THREE.Color("#6e1428") },
    uMid: { value: new THREE.Color("#c8324c") },
    uTop: { value: new THREE.Color("#ec7a8e") },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vertex,
    fragmentShader: fragment,
    side: THREE.DoubleSide,
  });
  return { material, uniforms };
}

// ----- the liquid inside a tube ------------------------------------------
// The tube runs from a person (uv.x = 0) to the heart (uv.x = 1). Liquid
// fills it from the person's end up to uFill, with bright bands flowing
// along it while it moves.

export type TubeUniforms = {
  uFill: { value: number };
  uFlow: { value: number }; //  0..1, how visible the moving bands are
  uTime: { value: number };
  uGlow: { value: number };
  uDeep: { value: THREE.Color };
  uMid: { value: THREE.Color };
  uTop: { value: THREE.Color };
};

const tubeVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(mat3(modelMatrix) * normal);
    vView = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const tubeFragment = /* glsl */ `
  uniform float uFill;
  uniform float uFlow;
  uniform float uTime;
  uniform float uGlow;
  uniform vec3 uDeep;
  uniform vec3 uMid;
  uniform vec3 uTop;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    if (vUv.x > uFill) discard;
    vec3 n = normalize(vNormal);
    float facing = max(dot(n, normalize(vView)), 0.0);
    vec3 col = mix(uDeep, uMid, facing);
    col += uTop * pow(1.0 - facing, 2.0) * 0.5;
    // Bands of light travelling with the flow.
    // Soft, uneven pulses of light travelling with the flow.
    float x = vUv.x * 9.0 - uTime * 2.2;
    float bands = smoothstep(0.55, 1.0, sin(x * 3.14159) * 0.6 + sin(x * 1.37 + 1.3) * 0.4);
    col += uTop * bands * 0.32 * uFlow * facing;
    // The leading edge of the liquid is a touch brighter.
    col += uTop * smoothstep(0.03, 0.0, uFill - vUv.x) * 0.5 * step(uFill, 0.999);
    col *= 1.0 + uGlow * 0.4;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

export function createTubeLiquidMaterial() {
  const uniforms: TubeUniforms = {
    uFill: { value: 0 },
    uFlow: { value: 0 },
    uTime: { value: 0 },
    uGlow: { value: 0 },
    uDeep: { value: new THREE.Color("#7a1a2e") },
    uMid: { value: new THREE.Color("#c8324c") },
    uTop: { value: new THREE.Color("#ee8496") },
  };
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: tubeVertex, fragmentShader: tubeFragment });
  return { material, uniforms };
}
