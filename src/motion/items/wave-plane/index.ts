import { EASE_OPTIONS, bezierText, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { WavePlane, type WavePlaneProps } from "./WavePlane";

const palettes = [
  { name: "Tide", swatch: ["#22D3EE", "#3B5BFF", "#E0F2FE"], values: { background: "#050A16", colorA: "#22D3EE", colorB: "#3B5BFF", colorC: "#E0F2FE" } },
  { name: "Synth", swatch: ["#FF4D8D", "#FF9F43", "#FFE3F0"], values: { background: "#0D0614", colorA: "#FF4D8D", colorB: "#FF9F43", colorC: "#FFE3F0" } },
  { name: "Aurora", swatch: ["#34D399", "#A3E635", "#ECFCCB"], values: { background: "#04100C", colorA: "#34D399", colorB: "#A3E635", colorC: "#ECFCCB" } },
  { name: "Paper", swatch: ["#FF6B3D", "#8B5CF6", "#1F1F24"], values: { background: "#F5F2EC", colorA: "#FF6B3D", colorB: "#8B5CF6", colorC: "#1F1F24" } },
  { name: "Amethyst", swatch: ["#A78BFA", "#F472B6", "#FFFFFF"], values: { background: "#0B0912", colorA: "#A78BFA", colorB: "#F472B6", colorC: "#FFFFFF" } },
  { name: "Steel", swatch: ["#9CA3AF", "#E5E7EB", "#FFFFFF"], values: { background: "#0B0C0E", colorA: "#9CA3AF", colorB: "#E5E7EB", colorC: "#FFFFFF" } },
];

export default defineMotion<WavePlaneProps>({
  slug: "wave-plane",
  name: "Wave Plane",
  description: "A wireframe grid rippling with layered sine waves, seen from a low angle.",
  category: "3d",
  tags: ["three", "wireframe", "waves", "grid", "loop"],
  addedAt: "2026-09-15",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: WavePlane,
  defaultProps: {
    ...palettes[0].values,
    amplitude: 0.6,
    frequency: 1,
    cycles: 1,
    ease: "enter",
  } as WavePlaneProps,
  palettes,
  controls: [
    { type: "color", key: "colorA", label: "Left colour" },
    { type: "color", key: "colorB", label: "Right colour" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "amplitude", label: "Amplitude", min: 0.2, max: 1.2, step: 0.05 },
    { type: "number", key: "frequency", label: "Frequency", min: 0.6, max: 1.6, step: 0.1 },
    { type: "number", key: "cycles", label: "Cycles per loop", min: 1, max: 3, step: 1 },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) =>
    [
      targetLine(c.target, "a wireframe grid rippling with sine waves, seen at an angle", c.width, c.height, c.seconds),
      `Background ${p.background}. Use Three.js (react-three-fiber via @remotion/three ThreeCanvas, transparent canvas, dpr 1), driven only by useCurrentFrame().`,
      "",
      "Grid: a 14 × 11 plane (x −7…7, z −7…4) drawn as THREE.LineSegments: 45 rows and 65 columns of thin lines, each subdivided finely, no triangle diagonals.",
      "Camera at (0, 3.2, 7.5), fov 40, looking at the origin, so the grid recedes to a horizon in the upper third.",
      `Displace y in a vertex shader: w = 0.5·sin(0.55·f·x + φ) + 0.3·sin(0.8·f·z − 2φ) + 0.35·sin(1.1·f·|xz − (−2, −1.5)| − 2φ), y = w × amplitude, with f = ${p.frequency}.`,
      `Colour (raw sRGB): ${p.colorA} on the left blending to ${p.colorB} on the right; crests blend up to 65% toward ${p.colorC}. Troughs sit at 55% opacity; the far 4 units and the outer 2.5 units on each side fade out.`,
      "Additive blending on dark backgrounds, normal blending on light ones; depthWrite off.",
      "",
      `Motion: φ = 2π × ${Math.round(p.cycles)} × t, so the waves travel ${Math.round(p.cycles)} cycle${Math.round(p.cycles) > 1 ? "s" : ""} per loop.`,
      `Amplitude swells between ${(p.amplitude * 0.6).toFixed(2)} and ${p.amplitude} once per loop via ease(0.5 − 0.5·cos(2πt)) with ${p.ease} easing ${bezierText(p.ease)}. Loop seamlessly.`,
    ].join("\n"),
});
