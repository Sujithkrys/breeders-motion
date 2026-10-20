import { EASE_OPTIONS, bezierText, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { FloatingCubes, type FloatingCubesProps } from "./FloatingCubes";

const palettes = [
  { name: "Ember", swatch: ["#FFB347", "#FF5F3D", "#C8264B"], values: { background: "#140C0A", colorA: "#FFB347", colorB: "#FF5F3D", colorC: "#C8264B" } },
  { name: "Sorbet", swatch: ["#FFC6A8", "#FF8FA3", "#B59CFF"], values: { background: "#F6EFE9", colorA: "#FFC6A8", colorB: "#FF8FA3", colorC: "#B59CFF" } },
  { name: "Matcha", swatch: ["#D9F99D", "#4ADE80", "#0F766E"], values: { background: "#0B110C", colorA: "#D9F99D", colorB: "#4ADE80", colorC: "#0F766E" } },
  { name: "Glacier", swatch: ["#A5F3FC", "#60A5FA", "#6366F1"], values: { background: "#0A0F1A", colorA: "#A5F3FC", colorB: "#60A5FA", colorC: "#6366F1" } },
  { name: "Grape", swatch: ["#F0ABFC", "#C026D3", "#6D28D9"], values: { background: "#100A18", colorA: "#F0ABFC", colorB: "#C026D3", colorC: "#6D28D9" } },
  { name: "Stone", swatch: ["#E7E5E4", "#A8A29E", "#57534E"], values: { background: "#111113", colorA: "#E7E5E4", colorB: "#A8A29E", colorC: "#57534E" } },
];

export default defineMotion<FloatingCubesProps>({
  slug: "floating-cubes",
  name: "Floating Cubes",
  description: "A diamond grid of rounded cubes bobbing in a travelling wave, coloured across the grid.",
  category: "3d",
  tags: ["three", "cubes", "wave", "grid", "loop"],
  addedAt: "2026-10-06",
  durationInFrames: 150,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: FloatingCubes,
  defaultProps: {
    ...palettes[0].values,
    grid: 5,
    height: 0.9,
    waves: 1,
    ease: "soft",
  } as FloatingCubesProps,
  palettes,
  controls: [
    { type: "color", key: "colorA", label: "Start colour" },
    { type: "color", key: "colorB", label: "Middle colour" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "grid", label: "Grid size", min: 3, max: 7, step: 1 },
    { type: "number", key: "height", label: "Wave height", min: 0.3, max: 1.6, step: 0.1 },
    { type: "number", key: "waves", label: "Waves across", min: 0.5, max: 2, step: 0.25 },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const n = Math.round(p.grid);
    return [
      targetLine(c.target, `a ${n}×${n} grid of rounded cubes bobbing in a travelling wave`, c.width, c.height, c.seconds),
      `Background ${p.background}. Use Three.js (react-three-fiber via @remotion/three ThreeCanvas, transparent canvas, dpr 1, no tone mapping), driven only by useCurrentFrame().`,
      "",
      `Cubes: RoundedBoxGeometry 1×1×1, radius 0.16, 3 segments, spaced 1.3 apart on the XZ plane; the grid is rotated 45° on Y so it reads as a diamond and is scaled so its side is about 4.3 units (smaller in 1:1 and 9:16).`,
      "Camera at (0, 7.2, 9), fov 30, looking at the centre.",
      `Colour runs along the diagonal (i + j): ${p.colorA} → ${p.colorB} → ${p.colorC}. MeshPhysicalMaterial roughness 0.34, clearcoat 0.6, RoomEnvironment env map at 0.55.`,
      `Lights: white key from upper left (1.9), ${p.colorB} fill from the right (0.8), ambient 0.25.`,
      "",
      `Wave: each cube's phase is t − ${p.waves} × (i + j) / (2(n − 1)); height = ${p.height} × ease(0.5 − 0.5·cos(2π·phase)), with ${p.ease} easing ${bezierText(p.ease)}.`,
      "Each cube also turns up to 0.35 rad on Y in step with its height. One wave cycle per loop, so it loops seamlessly.",
    ].join("\n");
  },
});
