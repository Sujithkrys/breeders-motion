import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { GradientShine, SHINE, type GradientShineProps } from "./GradientShine";

const palettes = [
  { name: "Gilded", swatch: ["#0F0C07", "#FFF1C1", "#F5B83D", "#A8641A"], values: { background: "#0F0C07", g1: "#FFF1C1", g2: "#F5B83D", g3: "#A8641A", shine: "#FFFFFF", quiet: "#8A7F68" } },
  { name: "Coral", swatch: ["#1A0A0A", "#FFD1B8", "#FF6A4D", "#C2185B"], values: { background: "#1A0A0A", g1: "#FFD1B8", g2: "#FF6A4D", g3: "#C2185B", shine: "#FFF4EC", quiet: "#9B706A" } },
  { name: "Aqua", swatch: ["#031518", "#D9FFF6", "#2FE0C2", "#0B7A8C"], values: { background: "#031518", g1: "#D9FFF6", g2: "#2FE0C2", g3: "#0B7A8C", shine: "#FFFFFF", quiet: "#5E8C8A" } },
  { name: "Iris", swatch: ["#0D0820", "#F1D9FF", "#B26BFF", "#5B2BD6"], values: { background: "#0D0820", g1: "#F1D9FF", g2: "#B26BFF", g3: "#5B2BD6", shine: "#FFFFFF", quiet: "#857BA6" } },
  { name: "Porcelain", swatch: ["#F5F3EE", "#2B2B2B", "#7A7A7A"], values: { background: "#F5F3EE", g1: "#3A3A3A", g2: "#7A7A7A", g3: "#151515", shine: "#FFFFFF", quiet: "#8A877F" } },
  { name: "Chrome", swatch: ["#0A0A0B", "#FFFFFF", "#9A9AA2"], values: { background: "#0A0A0B", g1: "#FFFFFF", g2: "#9A9AA2", g3: "#E8E8EC", shine: "#FFFFFF", quiet: "#6E6E76" } },
];

export default defineMotion<GradientShineProps>({
  slug: "gradient-shine",
  name: "Gradient Shine",
  description: "One big gradient-filled word rises into place, then a soft band of light sweeps across it.",
  category: "text",
  tags: ["gradient", "shine", "wordmark", "metallic", "svg"],
  addedAt: "2026-10-07",
  durationInFrames: 150,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: GradientShine,
  defaultProps: {
    ...palettes[0].values,
    word: "Radiant",
    subline: "The new standard for launch day",
    bandWidth: 24,
    angle: 18,
    ease: "enter",
  } as GradientShineProps,
  palettes,
  controls: [
    { type: "text", key: "word", label: "Word", maxLength: 12 },
    { type: "text", key: "subline", label: "Subline", maxLength: 44 },
    { type: "color", key: "g2", label: "Gradient" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "bandWidth", label: "Shine width", min: 10, max: 40, step: 1, unit: "%" },
    { type: "number", key: "angle", label: "Shine angle", min: 0, max: 40, step: 1, unit: "°" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) =>
    [
      targetLine(c.target, `the word "${p.word}" filled with a gradient and swept by a band of light`, c.width, c.height, c.seconds),
      `Background ${p.background}, with a soft ${p.g2} radial glow (22% opacity) behind the word.`,
      `Draw the word as SVG <text> (no CSS background-clip): Geist ${SHINE.base}px (shrink to fit 86% of the width), weight 700, tracking -0.045em, centred.`,
      `Fill: a userSpaceOnUse <linearGradient> across the word, slightly diagonal: ${p.g1} 0% → ${p.g2} 55% → ${p.g3} 100%, drifting ±6% of the word width over the whole clip.`,
      `Shine: draw the same <text> again on top, filled by a second gradient that is a light band ${p.bandWidth}% of the word wide in ${p.shine} (opacity 0 → 0.22 → 0.92 → 0.22 → 0), rotated ${p.angle}° so it leans.`,
      "",
      `0 → ${secs(SHINE.reveal, c.fps)}: the word rises 34% of its height out of an overflow-hidden box, from a 10px blur and 0 opacity.`,
      `${secs(SHINE.sweepStart, c.fps)} → ${secs(SHINE.sweepStart + SHINE.sweepDur, c.fps)}: the band sweeps from just left of the word to just past its right edge.`,
      p.subline.trim()
        ? `Subline "${p.subline}" under the word: 42px, weight 400, tracking -0.012em, ${p.quiet}, fading up 18px from 0.7s to 1.6s.`
        : "No subline.",
      `Ease ${p.ease} ${bezierText(p.ease)}. Hold the lit word to the end.`,
    ].join("\n"),
});
