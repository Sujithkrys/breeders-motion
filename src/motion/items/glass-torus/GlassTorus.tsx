import React, { useEffect, useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { PMREMGenerator, TorusKnotGeometry } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { alpha, progress, useLayout } from "../../kit";

export type GlassTorusProps = {
  background: string;
  base: string;
  rimA: string;
  rimB: string;
  turns: number; // full turns per loop
  roughness: number; // 0 = mirror gloss
  ease: string;
};

const isLight = (hex: string) => {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150;
};

// Built in useMemo (not an effect) so the env map exists on the very first rendered frame of an export.
const useStudioEnv = () => {
  const gl = useThree((s) => s.gl);
  const target = useMemo(() => {
    const pmrem = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const rt = pmrem.fromScene(room, 0.04);
    room.dispose();
    pmrem.dispose();
    return rt;
  }, [gl]);
  useEffect(() => () => target.dispose(), [target]);
  return target.texture;
};

type KnotProps = { base: string; rimA: string; rimB: string; roughness: number; rotX: number; rotY: number; lift: number; scale: number };

const Knot: React.FC<KnotProps> = (p) => {
  const env = useStudioEnv();
  const geo = useMemo(() => new TorusKnotGeometry(1, 0.32, 200, 28, 2, 3), []);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <>
      <ambientLight intensity={0.12} />
      <directionalLight position={[-3, 4, 6]} intensity={1.5} color="#FFFFFF" />
      <directionalLight position={[-6, 2, -4]} intensity={5} color={p.rimA} />
      <directionalLight position={[6, -1.5, -4]} intensity={5} color={p.rimB} />
      <group position={[0, p.lift, 0]} rotation={[0.32, 0, 0.12]} scale={p.scale}>
        <mesh geometry={geo} rotation={[p.rotX, p.rotY, 0]}>
          <meshPhysicalMaterial
            color={p.base}
            envMap={env}
            envMapIntensity={0.9}
            metalness={0.08}
            roughness={p.roughness}
            clearcoat={1}
            clearcoatRoughness={0.03}
            iridescence={0.3}
            iridescenceIOR={1.35}
          />
        </mesh>
      </group>
    </>
  );
};

export const GlassTorus: React.FC<GlassTorusProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames, u } = useLayout();
  const t = frame / durationInFrames;
  const spin = progress(frame, 0, durationInFrames * 0.86, p.ease);
  const fit = Math.min(1, (width / height) * 1.25);
  const light = isLight(p.background);
  const glow = 620 * u * Math.max(fit, 0.75);

  return (
    <AbsoluteFill style={{ background: p.background }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <svg width={glow * 2} height={glow * 2} viewBox="0 0 200 200" style={{ position: "absolute" }}>
          <defs>
            <radialGradient id="gt-glow-a" cx="0.42" cy="0.44" r="0.5">
              <stop offset="0" stopColor={p.rimA} stopOpacity={light ? 0.28 : 0.32} />
              <stop offset="1" stopColor={p.rimA} stopOpacity={0} />
            </radialGradient>
            <radialGradient id="gt-glow-b" cx="0.6" cy="0.56" r="0.5">
              <stop offset="0" stopColor={p.rimB} stopOpacity={light ? 0.24 : 0.3} />
              <stop offset="1" stopColor={p.rimB} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="100" fill="url(#gt-glow-a)" />
          <circle cx="100" cy="100" r="100" fill="url(#gt-glow-b)" />
        </svg>
        <div
          style={{
            position: "absolute",
            top: height * (0.5 + 0.385 * fit),
            width: height * 0.5 * fit,
            height: height * 0.045 * fit,
            borderRadius: "50%",
            background: light ? alpha("#000000", 0.16) : alpha("#000000", 0.55),
            filter: `blur(${26 * u}px)`,
            transform: `scaleX(${1 + 0.06 * Math.sin(t * Math.PI * 2)})`,
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill>
        <ThreeCanvas width={width} height={height} dpr={1} flat camera={{ position: [0, 0, 10], fov: 30 }} gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}>
          <Knot
            base={p.base}
            rimA={p.rimA}
            rimB={p.rimB}
            roughness={p.roughness}
            rotY={spin * Math.PI * 2 * Math.round(p.turns)}
            rotX={0.22 * Math.sin(t * Math.PI * 2)}
            lift={0.08 * Math.sin(t * Math.PI * 2)}
            scale={fit}
          />
        </ThreeCanvas>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
