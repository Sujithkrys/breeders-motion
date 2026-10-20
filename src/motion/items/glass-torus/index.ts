import { EASE_OPTIONS, bezierText, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { GlassTorus, type GlassTorusProps } from "./GlassTorus";

const palettes = [
  { name: "Fuchsia", swatch: ["#E0409A", "#FF9A3C", "#7C5CFF"], values: { background: "#0F0A12", base: "#E0409A", rimA: "#FF9A3C", rimB: "#7C5CFF" } },
  { name: "Ember", swatch: ["#FF5A36", "#FFC24B", "#C81E5B"], values: { background: "#120A08", base: "#FF5A36", rimA: "#FFC24B", rimB: "#C81E5B" } },
  { name: "Citrus", swatch: ["#B8E62E", "#FFD23F", "#16A34A"], values: { background: "#0C0E08", base: "#B8E62E", rimA: "#FFD23F", rimB: "#16A34A" } },
  { name: "Lagoon", swatch: ["#22B8B0", "#7DD3FC", "#4F46E5"], values: { background: "#06121A", base: "#22B8B0", rimA: "#7DD3FC", rimB: "#4F46E5" } },
  { name: "Porcelain", swatch: ["#F4F1EC", "#FF7A59", "#6C8CFF"], values: { background: "#ECE7DF", base: "#F4F1EC", rimA: "#FF7A59", rimB: "#6C8CFF" } },
  { name: "Graphite", swatch: ["#3A3A40", "#F5F5F7", "#9CA3AF"], values: { background: "#0C0C0E", base: "#3A3A40", rimA: "#F5F5F7", rimB: "#9CA3AF" } },
];

export default defineMotion<GlassTorusProps>({
  slug: "glass-torus",
  name: "Glass Torus",
  description: "A glossy clearcoat torus knot turns under studio light with coloured rim lights.",
  category: "3d",
  tags: ["three", "torus knot", "glossy", "studio", "loop"],
  addedAt: "2026-10-18",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: GlassTorus,
  defaultProps: {
    ...palettes[0].values,
    turns: 1,
    roughness: 0.14,
    ease: "enter",
  } as GlassTorusProps,
  palettes,
  controls: [
    { type: "color", key: "base", label: "Knot" },
    { type: "color", key: "rimA", label: "Rim light left" },
    { type: "color", key: "rimB", label: "Rim light right" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "turns", label: "Turns per loop", min: 1, max: 3, step: 1 },
    { type: "number", key: "roughness", label: "Roughness", min: 0, max: 0.5, step: 0.02 },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) =>
    [
      targetLine(c.target, "a glossy torus knot turning under studio lighting", c.width, c.height, c.seconds),
      `Background ${p.background}. Use Three.js (react-three-fiber via @remotion/three ThreeCanvas, transparent canvas, dpr 1, no tone mapping), driven only by useCurrentFrame().`,
      "",
      "Geometry: TorusKnotGeometry(radius 1, tube 0.32, 200 tubular × 28 radial segments, p 2, q 3), tilted 0.32 rad on X and 0.12 rad on Z, filling about 68% of the frame height (camera at z 10, fov 30; scale down to fit 9:16).",
      `Material: MeshPhysicalMaterial colour ${p.base}, metalness 0.08, roughness ${p.roughness}, clearcoat 1 (clearcoat roughness 0.03), iridescence 0.3, env map from RoomEnvironment through PMREMGenerator at intensity 0.9.`,
      `Lights: white key from upper front-left (1.5), rim light ${p.rimA} from back-left (5), rim light ${p.rimB} from back-right (5), ambient 0.12.`,
      `Behind the knot, two soft radial glows in ${p.rimA} and ${p.rimB} (about 30% opacity); a blurred dark ellipse shadow below it.`,
      "",
      `Motion: the knot makes ${Math.round(p.turns)} full turn${Math.round(p.turns) > 1 ? "s" : ""} around Y over 0–86% of the loop with ${p.ease} easing ${bezierText(p.ease)}, then rests.`,
      "Underneath, a sine wobble of ±0.22 rad on X and a ±0.08 float on Y run once per loop. Loop seamlessly.",
    ].join("\n"),
});
