import { targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { CELL, SignalRipple, type SignalRippleProps } from "./SignalRipple";

const palettes = [
  {
    name: "Magenta",
    swatch: ["#0D0610", "#FF4FB8", "#FFC2E6"],
    values: { background: "#0D0610", ring: "#FF4FB8", core: "#FFC2E6", grid: "#FF4FB8", ink: "#FFF1F9" },
  },
  {
    name: "Amber",
    swatch: ["#0E0A04", "#FFB23F", "#FFE6B0"],
    values: { background: "#0E0A04", ring: "#FFB23F", core: "#FFE6B0", grid: "#FFB23F", ink: "#FFF6E6" },
  },
  {
    name: "Mint",
    swatch: ["#04110D", "#3CF0B4", "#C9FFEB"],
    values: { background: "#04110D", ring: "#3CF0B4", core: "#C9FFEB", grid: "#3CF0B4", ink: "#EAFFF7" },
  },
  {
    name: "Paper",
    swatch: ["#F4F1EC", "#E2462F", "#2A2520"],
    values: { background: "#F4F1EC", ring: "#E2462F", core: "#FF8A6A", grid: "#2A2520", ink: "#1E1A16" },
  },
  {
    name: "Sky",
    swatch: ["#050C18", "#5AB0FF", "#D6ECFF"],
    values: { background: "#050C18", ring: "#5AB0FF", core: "#D6ECFF", grid: "#5AB0FF", ink: "#EEF6FF" },
  },
];

export default defineMotion<SignalRippleProps>({
  slug: "signal-ripple",
  name: "Signal Ripple",
  description: "Concentric ripples pulse out from a glowing core over a faint grid, in a seamless loop.",
  category: "backgrounds",
  tags: ["ripple", "pulse", "radar", "grid", "loop"],
  addedAt: "2026-09-30",
  durationInFrames: 150,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: SignalRipple,
  defaultProps: {
    ...palettes[0].values,
    title: "Always on",
    rings: 5,
    speed: 1,
    thickness: 2,
  } as SignalRippleProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title (blank hides)", maxLength: 32 },
    { type: "color", key: "background", label: "Background" },
    { type: "color", key: "ring", label: "Ripples" },
    { type: "color", key: "core", label: "Core" },
    { type: "number", key: "rings", label: "Ripples", min: 3, max: 8, step: 1 },
    { type: "number", key: "speed", label: "Speed", min: 1, max: 3, step: 1, unit: "×" },
    { type: "number", key: "thickness", label: "Thickness", min: 1, max: 5, step: 0.5, unit: "px" },
  ],
  prompt: (p, c) => {
    const n = Math.round(p.rings);
    const sp = Math.round(p.speed);
    const life = c.seconds / sp;
    return [
      targetLine(c.target, "a seamless looping signal-ripple background", c.width, c.height, c.seconds),
      `Background ${p.background}. One full-frame inline SVG.`,
      "",
      `Grid: lines every ${CELL}px through the centre, ${p.grid} at 16% opacity, 1.25px. Over it, an SVG radialGradient rect fades to ${p.background} towards the corners (0% at centre, 55% halfway, 100% at the corner).`,
      `Ripples: ${n} circles centred in the frame, evenly phased. Each grows from 30px to the corner distance over ${life.toFixed(2).replace(/\.?0+$/, "")}s with an ease-out curve (1 − (1 − q)^1.7), so ${n * sp} ripples are born per loop.`,
      `Ripple stroke ${p.ring}, ${p.thickness}px growing to ${(p.thickness * 2.2).toFixed(1).replace(/\.0$/, "")}px; opacity fades in over the first 6% of its life, then falls as (1 − q)^1.3. Each has a 7× wider halo stroke at 10%.`,
      `Core: an 11px ${p.core} dot plus a 260px radialGradient glow (${p.core} 60% → ${p.ring} 22% → transparent). Both swell 12–30% each time a ripple is born.`,
      "Drive everything from t = frame / total with whole-number cycles, so the last frame flows into frame 0.",
      p.title.trim()
        ? `Centred title "${p.title}" in ${p.ink}: Geist weight 650, 156px (120px in 9:16), -0.04em tracking. It stays still.`
        : "No title.",
    ].join("\n");
  },
});
