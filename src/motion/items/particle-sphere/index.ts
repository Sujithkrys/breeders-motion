import { EASE_OPTIONS, bezierText, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { ParticleSphere, type ParticleSphereProps } from "./ParticleSphere";

const palettes = [
  { name: "Lagoon", swatch: ["#0D9488", "#5EEAD4", "#ECFDF5"], values: { background: "#050F0E", colorA: "#0D9488", colorB: "#5EEAD4", colorC: "#ECFDF5" } },
  { name: "Solar", swatch: ["#F43F5E", "#FB923C", "#FDE68A"], values: { background: "#0F0905", colorA: "#F43F5E", colorB: "#FB923C", colorC: "#FDE68A" } },
  { name: "Nebula", swatch: ["#6D28D9", "#D946EF", "#FBCFE8"], values: { background: "#0A0814", colorA: "#6D28D9", colorB: "#D946EF", colorC: "#FBCFE8" } },
  { name: "Ink", swatch: ["#FF5F3D", "#C026D3", "#3730A3"], values: { background: "#F3F0EA", colorA: "#FF5F3D", colorB: "#C026D3", colorC: "#3730A3" } },
  { name: "Arctic", swatch: ["#3B82F6", "#7DD3FC", "#FFFFFF"], values: { background: "#060B14", colorA: "#3B82F6", colorB: "#7DD3FC", colorC: "#FFFFFF" } },
  { name: "Mono", swatch: ["#52525B", "#A1A1AA", "#FAFAFA"], values: { background: "#0B0B0C", colorA: "#52525B", colorB: "#A1A1AA", colorC: "#FAFAFA" } },
];

export default defineMotion<ParticleSphereProps>({
  slug: "particle-sphere",
  name: "Particle Sphere",
  description: "Thousands of points on a sphere that breathe and twist, shaded by height.",
  category: "3d",
  tags: ["three", "particles", "points", "shader", "loop"],
  addedAt: "2026-09-24",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: ParticleSphere,
  defaultProps: {
    ...palettes[0].values,
    count: 4000,
    twist: 1.6,
    breathe: 0.14,
    ease: "enter",
  } as ParticleSphereProps,
  palettes,
  controls: [
    { type: "color", key: "colorA", label: "Bottom colour" },
    { type: "color", key: "colorC", label: "Top colour" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "count", label: "Points", min: 1500, max: 6000, step: 500 },
    { type: "number", key: "twist", label: "Twist", min: 0, max: 3, step: 0.1, unit: "rad" },
    { type: "number", key: "breathe", label: "Breathe", min: 0, max: 0.25, step: 0.01 },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) =>
    [
      targetLine(c.target, `a sphere of ${Math.round(p.count)} points that breathes and twists`, c.width, c.height, c.seconds),
      `Background ${p.background}. Use Three.js (react-three-fiber via @remotion/three ThreeCanvas, transparent canvas, dpr 1), driven only by useCurrentFrame(); no Math.random, use remotion random(seed).`,
      "",
      "Points: a Fibonacci sphere of radius 1 with ±3.5% seeded radial jitter, rendered as THREE.Points with a ShaderMaterial (round soft dots, depthWrite off, additive blending on dark backgrounds, normal on light). Camera at z 5.2, fov 35; the sphere is tilted 0.38 rad on X and −0.12 on Z.",
      "Point size about 4px at 1080 (19 / view depth), varied 0.6–1.4× per point; back-facing points fade to 28% opacity.",
      `Colour by height, raw sRGB: ${p.colorA} at the bottom → ${p.colorB} at the equator → ${p.colorC} at the top. A soft ${p.colorB} radial glow sits behind the sphere.`,
      "",
      `Motion: the sphere turns once around Y per loop. A pulse = ease(0.5 − 0.5·cos(2πt)) with ${p.ease} easing ${bezierText(p.ease)} rises and falls once per loop.`,
      `At full pulse the radius grows by ${p.breathe} and each point turns by ${p.twist} rad × its height (poles twist opposite ways); each point also shimmers ±2.5% in radius at twice the loop rate. Loop seamlessly.`,
    ].join("\n"),
});
