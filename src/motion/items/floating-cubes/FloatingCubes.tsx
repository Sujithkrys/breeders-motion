import React, { useEffect, useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { PMREMGenerator } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { easing, useLayout } from "../../kit";

export type FloatingCubesProps = {
  background: string;
  colorA: string;
  colorB: string;
  colorC: string;
  grid: number; // cubes per side
  height: number; // wave height in cube sizes
  waves: number; // wavelengths across the grid
  ease: string;
};

const SPACING = 1.3;

const mixHex = (a: string, b: string, t: number) => {
  const pa = parseInt(a.replace("#", "").slice(0, 6), 16);
  const pb = parseInt(b.replace("#", "").slice(0, 6), 16);
  const ch = (s: number) => Math.round((((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t)).toString(16).padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
};

const ramp = (a: string, b: string, c: string, t: number) => (t < 0.5 ? mixHex(a, b, t * 2) : mixHex(b, c, t * 2 - 1));

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

type Cube = { key: string; x: number; z: number; y: number; spin: number; color: string };

const Grid: React.FC<{ cubes: Cube[]; scale: number; keyLight: string }> = ({ cubes, scale, keyLight }) => {
  const env = useStudioEnv();
  const geo = useMemo(() => new RoundedBoxGeometry(1, 1, 1, 3, 0.16), []);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[-4, 9, 5]} intensity={1.9} color="#FFFFFF" />
      <directionalLight position={[6, 3, -2]} intensity={0.8} color={keyLight} />
      <group scale={scale} rotation={[0, Math.PI / 4, 0]} position={[0, -0.35, 0]}>
        {cubes.map((c) => (
          <mesh key={c.key} geometry={geo} position={[c.x, c.y, c.z]} rotation={[0, c.spin, 0]}>
            <meshPhysicalMaterial color={c.color} envMap={env} envMapIntensity={0.55} roughness={0.34} metalness={0} clearcoat={0.6} clearcoatRoughness={0.22} />
          </mesh>
        ))}
      </group>
    </>
  );
};

export const FloatingCubes: React.FC<FloatingCubesProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useLayout();
  const t = frame / durationInFrames;
  const n = Math.max(2, Math.round(p.grid));
  const ease = easing(p.ease);
  const fit = Math.min(1, (width / height) * 0.8);
  const scale = (4.3 / (n * SPACING)) * fit;

  const cubes: Cube[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const d = (i + j) / (2 * (n - 1));
      const local = (((t - d * p.waves) % 1) + 1) % 1;
      const s = 0.5 - 0.5 * Math.cos(local * Math.PI * 2);
      const h = ease(s);
      cubes.push({
        key: `${i}-${j}`,
        x: (i - (n - 1) / 2) * SPACING,
        z: (j - (n - 1) / 2) * SPACING,
        y: h * p.height,
        spin: h * 0.35,
        color: ramp(p.colorA, p.colorB, p.colorC, d),
      });
    }
  }

  return (
    <AbsoluteFill style={{ background: p.background }}>
      <ThreeCanvas width={width} height={height} dpr={1} flat camera={{ position: [0, 7.2, 9], fov: 30 }} gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}>
        <Grid cubes={cubes} scale={scale} keyLight={p.colorB} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
