import React, { useEffect, useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { AdditiveBlending, BufferAttribute, BufferGeometry, NormalBlending, ShaderMaterial, Vector3 } from "three";
import { easing, useLayout } from "../../kit";

export type WavePlaneProps = {
  background: string;
  colorA: string; // left
  colorB: string; // right
  colorC: string; // crest highlight
  amplitude: number;
  frequency: number;
  cycles: number; // wave cycles per loop (integer keeps the loop seamless)
  ease: string;
};

const HALF_W = 7;
const Z_NEAR = 4;
const Z_FAR = -7;

const rgb = (hex: string) => {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255] as const;
};
const isLight = (hex: string) => {
  const [r, g, b] = rgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b > 0.6;
};

// Rows and columns as plain line segments: a cleaner grid than a triangle wireframe, which shows diagonals.
const buildGrid = () => {
  const rows = 44;
  const cols = 64;
  const segX = 110;
  const segZ = 72;
  const pts: number[] = [];
  for (let r = 0; r <= rows; r++) {
    const z = Z_FAR + ((Z_NEAR - Z_FAR) * r) / rows;
    for (let s = 0; s < segX; s++) {
      const x0 = -HALF_W + (2 * HALF_W * s) / segX;
      const x1 = -HALF_W + (2 * HALF_W * (s + 1)) / segX;
      pts.push(x0, 0, z, x1, 0, z);
    }
  }
  for (let c = 0; c <= cols; c++) {
    const x = -HALF_W + (2 * HALF_W * c) / cols;
    for (let s = 0; s < segZ; s++) {
      const z0 = Z_FAR + ((Z_NEAR - Z_FAR) * s) / segZ;
      const z1 = Z_FAR + ((Z_NEAR - Z_FAR) * (s + 1)) / segZ;
      pts.push(x, 0, z0, x, 0, z1);
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(new Float32Array(pts), 3));
  return geo;
};

const vertexShader = /* glsl */ `
uniform float uPhase;
uniform float uAmp;
uniform float uFreq;
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uC;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec3 p = position;
  float w = sin(p.x * 0.55 * uFreq + uPhase) * 0.5
          + sin(p.z * 0.8 * uFreq - uPhase * 2.0) * 0.3
          + sin(length(p.xz - vec2(-2.0, -1.5)) * 1.1 * uFreq - uPhase * 2.0) * 0.35;
  p.y = w * uAmp;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  float kx = clamp((p.x + ${HALF_W.toFixed(1)}) / ${(HALF_W * 2).toFixed(1)}, 0.0, 1.0);
  vec3 col = mix(uA, uB, kx);
  vColor = mix(col, uC, smoothstep(0.25, 1.0, w) * 0.65);
  float far = smoothstep(${Z_FAR.toFixed(1)}, ${(Z_FAR + 4).toFixed(1)}, p.z);
  float side = 1.0 - smoothstep(${(HALF_W - 2.5).toFixed(1)}, ${HALF_W.toFixed(1)}, abs(p.x));
  vAlpha = far * side * mix(0.55, 1.0, smoothstep(-0.6, 0.9, w));
}
`;

// Raw sRGB out, so lines match the palette hex exactly.
const fragmentShader = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main() {
  gl_FragColor = vec4(vColor, vAlpha);
}
`;

type FieldProps = { additive: boolean; uniforms: Record<string, number | Vector3> };

const Field: React.FC<FieldProps> = ({ additive, uniforms }) => {
  const geo = useMemo(() => buildGrid(), []);
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: additive ? AdditiveBlending : NormalBlending,
        uniforms: {
          uPhase: { value: 0 },
          uAmp: { value: 0.6 },
          uFreq: { value: 1 },
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
  return <lineSegments geometry={geo} material={mat} />;
};

export const WavePlane: React.FC<WavePlaneProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useLayout();
  const t = frame / durationInFrames;
  const swell = easing(p.ease)(0.5 - 0.5 * Math.cos(t * Math.PI * 2));
  const light = isLight(p.background);

  const uniforms = {
    uPhase: t * Math.PI * 2 * Math.max(1, Math.round(p.cycles)),
    uAmp: p.amplitude * (0.6 + 0.4 * swell),
    uFreq: p.frequency,
    uA: new Vector3(...rgb(p.colorA)),
    uB: new Vector3(...rgb(p.colorB)),
    uC: new Vector3(...rgb(p.colorC)),
  };

  return (
    <AbsoluteFill style={{ background: p.background }}>
      <ThreeCanvas width={width} height={height} dpr={1} flat camera={{ position: [0, 3.2, 7.5], fov: 40 }} gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}>
        <Field additive={!light} uniforms={uniforms} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
