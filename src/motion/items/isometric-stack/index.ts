import { EASE_OPTIONS, bezierText, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { IsometricStack, type IsometricStackProps } from "./IsometricStack";

const palettes = [
  { name: "Matcha", swatch: ["#3F8F5A", "#8CCB6B", "#E3F58F"], values: { background: "#EEF1E6", colorA: "#3F8F5A", colorB: "#8CCB6B", colorC: "#E3F58F" } },
  { name: "Terracotta", swatch: ["#B4532A", "#E9824F", "#FFD3A5"], values: { background: "#1A100C", colorA: "#B4532A", colorB: "#E9824F", colorC: "#FFD3A5" } },
  { name: "Lilac", swatch: ["#5B3FC4", "#9B7BFF", "#E7DCFF"], values: { background: "#120E1C", colorA: "#5B3FC4", colorB: "#9B7BFF", colorC: "#E7DCFF" } },
  { name: "Sky", swatch: ["#2F6FDB", "#6FB3F2", "#CFE9FF"], values: { background: "#EAF2F8", colorA: "#2F6FDB", colorB: "#6FB3F2", colorC: "#CFE9FF" } },
  { name: "Rose", swatch: ["#BE185D", "#F472B6", "#FFD1E3"], values: { background: "#170A10", colorA: "#BE185D", colorB: "#F472B6", colorC: "#FFD1E3" } },
  { name: "Concrete", swatch: ["#3F3F46", "#71717A", "#D4D4D8"], values: { background: "#101012", colorA: "#3F3F46", colorB: "#71717A", colorC: "#D4D4D8" } },
];

export default defineMotion<IsometricStackProps>({
  slug: "isometric-stack",
  name: "Isometric Stack",
  description: "Shaded isometric blocks drop in one by one and stack into a stepped tower.",
  category: "3d",
  tags: ["css 3d", "isometric", "blocks", "build", "reveal"],
  addedAt: "2026-10-02",
  durationInFrames: 150,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: IsometricStack,
  defaultProps: {
    ...palettes[0].values,
    layers: 3,
    stagger: 5,
    drop: 3,
    ease: "snappy",
  } as IsometricStackProps,
  palettes,
  controls: [
    { type: "color", key: "colorA", label: "Base colour" },
    { type: "color", key: "colorC", label: "Top colour" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "layers", label: "Layers", min: 2, max: 4, step: 1 },
    { type: "number", key: "stagger", label: "Stagger", min: 2, max: 8, step: 1, unit: "f" },
    { type: "number", key: "drop", label: "Drop height", min: 1, max: 6, step: 0.5 },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const L = Math.round(p.layers);
    const count = Array.from({ length: L }, (_, k) => (L - k) ** 2).reduce((a, b) => a + b, 0);
    const size = Math.round(640 / (L * 1.414));
    return [
      targetLine(c.target, `${count} isometric blocks dropping in and stacking into a ${L}-layer stepped tower`, c.width, c.height, c.seconds),
      `Background ${p.background}. Pure CSS 3D, no WebGL: each face is its own div with transform "rotateX(54.7356deg) rotateZ(45deg) translate3d(…) [rotateY(90deg) | rotateX(90deg)]" and no preserve-3d parent.`,
      "",
      `Blocks are ${size}px cubes on an integer grid. Layer k (0 at the bottom) fills an (${L} − k)² square tucked into the back corner, so steps descend toward the viewer.`,
      `Layer colours blend ${p.colorA} (bottom) → ${p.colorB} → ${p.colorC} (top). Each block shows three faces from its colour: top lightened 22% with a 135° gradient and a thin white edge, left face the base colour, right face darkened 28%.`,
      "Draw faces back to front, sorted by x + y + z then z; hide a face once the neighbouring block that covers it has landed.",
      "A blurred dark square shadow sits under the tower on the ground plane.",
      "",
      `Motion: blocks drop layer by layer, back to front, one every ${p.stagger} frames (compressed if needed so the last lands by 62% of the clip).`,
      `Each falls ${p.drop} block heights over 16 frames with ${p.ease} easing ${bezierText(p.ease)}, fading in over the first quarter of its fall. Hold the finished tower to the end.`,
    ].join("\n");
  },
});

