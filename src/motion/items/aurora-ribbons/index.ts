import { targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { AuroraRibbons, RIBBONS, type AuroraRibbonsProps } from "./AuroraRibbons";

const palettes = [
  {
    name: "Polar",
    swatch: ["#39F2A0", "#26C9C3", "#9B6BFF"],
    values: { background: "#040A12", c1: "#39F2A0", c2: "#26C9C3", c3: "#9B6BFF", ink: "#F0FFF8" },
  },
  {
    name: "Solar",
    swatch: ["#FF7A45", "#FFC24B", "#FF3D7A"],
    values: { background: "#0E0606", c1: "#FF7A45", c2: "#FFC24B", c3: "#FF3D7A", ink: "#FFF3EC" },
  },
  {
    name: "Orchid",
    swatch: ["#E15BFF", "#7A5CFF", "#FF8BD0"],
    values: { background: "#0A0613", c1: "#E15BFF", c2: "#7A5CFF", c3: "#FF8BD0", ink: "#FBF2FF" },
  },
  {
    name: "Daybreak",
    swatch: ["#F7F3FF", "#B79CFF", "#FFB0CF", "#8FD9FF"],
    values: { background: "#F7F3FF", c1: "#B79CFF", c2: "#FFB0CF", c3: "#8FD9FF", ink: "#241B3A" },
  },
  {
    name: "Ice",
    swatch: ["#9AD8FF", "#E8F6FF", "#5C8DFF"],
    values: { background: "#060B14", c1: "#9AD8FF", c2: "#E8F6FF", c3: "#5C8DFF", ink: "#F4FAFF" },
  },
];

export default defineMotion<AuroraRibbonsProps>({
  slug: "aurora-ribbons",
  name: "Aurora Ribbons",
  description: "Three soft, blurred ribbons of light sway across the sky like an aurora, in a seamless loop.",
  category: "backgrounds",
  tags: ["aurora", "ribbons", "gradient", "glow", "loop"],
  addedAt: "2026-10-15",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: AuroraRibbons,
  defaultProps: {
    ...palettes[0].values,
    title: "Northern light",
    sway: 90,
    softness: 44,
  } as AuroraRibbonsProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title (blank hides)", maxLength: 32 },
    { type: "color", key: "background", label: "Sky" },
    { type: "color", key: "c1", label: "Ribbon 1" },
    { type: "color", key: "c2", label: "Ribbon 2" },
    { type: "color", key: "c3", label: "Ribbon 3" },
    { type: "number", key: "sway", label: "Sway", min: 30, max: 160, step: 10, unit: "px" },
    { type: "number", key: "softness", label: "Softness", min: 16, max: 80, step: 4, unit: "px" },
  ],
  prompt: (p, c) => {
    const colors = [p.c1, p.c2, p.c3];
    return [
      targetLine(c.target, "a seamless looping aurora-ribbon background", c.width, c.height, c.seconds),
      `Sky ${p.background}, plus a bottom-up linear-gradient horizon glow of ${p.c1} at 14% fading out by 55% height.`,
      "",
      "Three filled SVG ribbons, sampled at 27 points across the frame (and past both edges), joined with quadratic curves through midpoints:",
      ...RIBBONS.map(
        (r, i) =>
          `- ${colors[i]}: top edge at ${Math.round(r.y * 100)}% height + ${p.sway}px × (0.65·sin(2π(${r.k1}x + ${r.s1}t + ${r.ph})) + 0.35·sin(2π(${r.k2}x − ${r.s2}t + ${r.ph * 2})))`,
      ),
      "Each ribbon hangs down from its top edge by 22% of the short side × (0.55 + 0.45·sin(2π(0.8x + t + phase))), scaled 1 / 0.8 / 0.9 per ribbon (×1.3 in 9:16). x is 0→1 across, t = frame / total.",
      "Fill: vertical linearGradient from the next ribbon's colour at 0% (top) through 35% at 55% to the ribbon's own colour at 95% (bottom), so the lower edge glows like a curtain.",
      `Blur the ribbon layer ${p.softness}px; draw each lower edge again as a 3px stroke at 70% in a layer blurred ${Math.round(p.softness * 0.18)}px. Ribbon brightness breathes 75–100% once per loop.`,
      "Whole-number cycles make the last frame flow into frame 0 with no jump.",
      p.title.trim()
        ? `Centred title "${p.title}" in ${p.ink}: Geist weight 650, 156px (120px in 9:16), -0.04em tracking. It stays still.`
        : "No title.",
    ].join("\n");
  },
});
