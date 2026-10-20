import { targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { DotGridWave, SHARPNESS, type DotGridWaveProps } from "./DotGridWave";

const palettes = [
  {
    name: "Sky",
    swatch: ["#050B16", "#1E3354", "#8FD0FF"],
    values: { background: "#050B16", dot: "#1E3354", crest: "#8FD0FF", ink: "#F2F8FF" },
  },
  {
    name: "Lime",
    swatch: ["#0B0F06", "#2A3418", "#D6FF5C"],
    values: { background: "#0B0F06", dot: "#2A3418", crest: "#D6FF5C", ink: "#F6FFE0" },
  },
  {
    name: "Coral",
    swatch: ["#140907", "#3A1D17", "#FF8466"],
    values: { background: "#140907", dot: "#3A1D17", crest: "#FF8466", ink: "#FFF0EB" },
  },
  {
    name: "Violet",
    swatch: ["#0B0814", "#2A2145", "#B79BFF"],
    values: { background: "#0B0814", dot: "#2A2145", crest: "#B79BFF", ink: "#F4F0FF" },
  },
  {
    name: "Paper",
    swatch: ["#F3F0EA", "#D6D0C4", "#1C1A17"],
    values: { background: "#F3F0EA", dot: "#D6D0C4", crest: "#1C1A17", ink: "#1C1A17" },
  },
];

export default defineMotion<DotGridWaveProps>({
  slug: "dot-grid-wave",
  name: "Dot Grid Wave",
  description: "A calm dot grid where a diagonal wave swells and brightens the dots as it rolls through.",
  category: "backgrounds",
  tags: ["dots", "grid", "wave", "pattern", "loop"],
  addedAt: "2026-09-12",
  durationInFrames: 150,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: DotGridWave,
  defaultProps: {
    ...palettes[0].values,
    title: "Ride the wave",
    spacing: 120,
    bands: 1.5,
    speed: 1,
  } as DotGridWaveProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title (blank hides)", maxLength: 32 },
    { type: "color", key: "background", label: "Background" },
    { type: "color", key: "dot", label: "Dots" },
    { type: "color", key: "crest", label: "Crest" },
    { type: "number", key: "spacing", label: "Spacing", min: 110, max: 180, step: 10, unit: "px" },
    { type: "number", key: "bands", label: "Bands", min: 1, max: 4, step: 0.5 },
    { type: "number", key: "speed", label: "Speed", min: 1, max: 3, step: 1, unit: "×" },
  ],
  prompt: (p, c) => {
    const s = p.spacing;
    return [
      targetLine(c.target, "a seamless looping dot-grid wave background", c.width, c.height, c.seconds),
      `Background ${p.background}. One full-frame inline SVG of circles.`,
      "",
      `Dot grid: ${s}px spacing, centred in the frame (as many whole columns and rows as fit).`,
      `For a dot at (x, y): d = (x + y) / (width + height), v = (0.5 + 0.5·cos(2π(${p.bands}·d − ${Math.round(p.speed)}·t)))^${SHARPNESS}, t = frame / total.`,
      `That gives ${p.bands} crest${p.bands === 1 ? "" : "s"} across the diagonal, rolling from top-left to bottom-right ${Math.round(p.speed)}× per loop.`,
      `Dot radius goes from ${(s * 0.03).toFixed(1)}px to ${(s * 0.115).toFixed(1)}px with v; colour blends ${p.dot} → ${p.crest}; opacity 55% → 100%.`,
      `Dots with v > 0.2 also get a halo: a ${p.crest} circle 2.4× the radius at 16% × v opacity.`,
      "Whole-number cycles make the last frame flow into frame 0 with no jump.",
      p.title.trim()
        ? `Centred title "${p.title}" in ${p.ink}: Geist weight 650, 156px (120px in 9:16), -0.04em tracking, over a soft ${p.background} radial pool (85% → 0%) so it stays readable.`
        : "No title.",
    ].join("\n");
  },
});
