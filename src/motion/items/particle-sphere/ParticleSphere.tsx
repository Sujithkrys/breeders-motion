import React, { useEffect, useMemo } from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { AdditiveBlending, BufferAttribute, BufferGeometry, NormalBlending, ShaderMaterial, Vector3 } from "three";
import { easing, useLayout } from "../../kit";

export type ParticleSphereProps = {
  background: string;
  colorA: string; // bottom
  colorB: string; // equator
  colorC: string; // top
  count: number;
  twist: number; // radians at the poles at full pulse
  breathe: number; // radius gain at full pulse
  ease: string;
};

const rgb = (hex: string) => {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255] as const;
};
const isLight = (hex: string) => {
  const [r, g, b] = rgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b > 0.6;
};

const vertexShader = /* glsl */ `
uniform float uRot;
uniform float uTwist;
uniform float uBreath;
uniform float uPulse;
uniform float uPhase;
uniform float uSize;
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uC;
attribute float aSeed;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec3 p = position;
  float h = p.y;
  float ang = uRot + uTwist * uPulse * h;
  float c = cos(ang);
  float s = sin(ang);
  p.xz = vec2(c * p.x - s * p.z, s * p.x + c * p.z);
  float r = 1.0 + uBreath * uPulse + 0.025 * sin(uPhase * 2.0 + aSeed * 6.2831);
  p *= r;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.6 + 0.8 * fract(aSeed * 7.31)) / -mv.z;
  float k = clamp((h + 1.0) * 0.5, 0.0, 1.0);
  vColor = k < 0.5 ? mix(uA, uB, k * 2.0) : mix(uB, uC, k * 2.0 - 1.0);
  vAlpha = mix(0.28, 1.0, clamp(p.z / r * 0.5 + 0.5, 0.0, 1.0));
}
`;

// Colours are passed as raw sRGB and written without colour-space conversion, so points match the palette hex exactly.
const fragmentShader = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  gl_FragColor = vec4(vColor, (1.0 - smoothstep(0.12, 0.5, d)) * vAlpha);
}
`;

const buildSphere = (count: number) => {
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (2 * (i + 0.5)) / count;
    const ring = Math.sqrt(1 - y * y);
    const theta = i * golden;
    const jitter = 1 + (random(`ps-r-${i}`) - 0.5) * 0.07;
    pos[i * 3] = Math.cos(theta) * ring * jitter;
    pos[i * 3 + 1] = y * jitter;
    pos[i * 3 + 2] = Math.sin(theta) * ring * jitter;
    seed[i] = random(`ps-s-${i}`);
  }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(pos, 3));
  geo.setAttribute("aSeed", new BufferAttribute(seed, 1));
  return geo;
};

type CloudProps = { count: number; additive: boolean; scale: number; uniforms: Record<string, number | Vector3> };

const Cloud: React.FC<CloudProps> = ({ count, additive, scale, uniforms }) => {
  const geo = useMemo(() => buildSphere(count), [count]);
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: additive ? AdditiveBlending : NormalBlending,
        uniforms: {
          uRot: { value: 0 },
          uTwist: { value: 0 },
          uBreath: { value: 0 },
          uPulse: { value: 0 },
          uPhase: { value: 0 },
          uSize: { value: 18 },
          uA: { value: new Vector3() },
          uB: { value: new Vector3() },
          uC: { value: new Vector3() },
        },
      }),
    [additive],
  );
  useEffect(() => () => geo.dispose(), [geo]);
  useEffect(() => () => mat.dispose(), [mat]);
  // Written during render so the values are in place before @remotion/three advances the frame.
  for (const [k, v] of Object.entries(uniforms)) {
    const slot = mat.uniforms[k];
    if (slot) slot.value = v;
  }
  return <points geometry={geo} material={mat} scale={scale} />;
};

export const ParticleSphere: React.FC<ParticleSphereProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames, u } = useLayout();
  const t = frame / durationInFrames;
  const pulse = easing(p.ease)(0.5 - 0.5 * Math.cos(t * Math.PI * 2));
  const fit = Math.min(1, (width / height) * 1.1);
  const light = isLight(p.background);
  const count = Math.round(Math.min(8000, Math.max(500, p.count)));
  const glow = 560 * u * Math.max(fit, 0.7);

  const uniforms = {
    uRot: t * Math.PI * 2,
    uTwist: p.twist,
    uBreath: p.breathe,
    uPulse: pulse,
    uPhase: t * Math.PI * 2,
    uSize: 19 * (height / 1080),
    uA: new Vector3(...rgb(p.colorA)),
    uB: new Vector3(...rgb(p.colorB)),
    uC: new Vector3(...rgb(p.colorC)),
  };

  return (
    <AbsoluteFill style={{ background: p.background }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <svg width={glow * 2} height={glow * 2} viewBox="0 0 200 200">
          <defs>
            <radialGradient id="ps-glow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor={p.colorB} stopOpacity={(light ? 0.16 : 0.22) * (0.75 + 0.25 * pulse)} />
              <stop offset="1" stopColor={p.colorB} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="100" fill="url(#ps-glow)" />
        </svg>
      </AbsoluteFill>
      <AbsoluteFill>
        <ThreeCanvas width={width} height={height} dpr={1} flat camera={{ position: [0, 0, 5.2], fov: 35 }} gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}>
          <group rotation={[0.38, 0, -0.12]}>
            <Cloud count={count} additive={!light} scale={fit} uniforms={uniforms} />
          </group>
        </ThreeCanvas>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
