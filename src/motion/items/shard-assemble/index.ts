import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { RADIUS, SHARD_COUNT, ShardAssemble, type ShardAssembleProps } from "./ShardAssemble";

const palettes = [
  { name: "Ember", swatch: ["#FF8A4C", "#E5383B", "#120A08"], values: { background: "#120A08", markA: "#FF8A4C", markB: "#E5383B", monogramColor: "#FFF6EE", nameColor: "#FFF1E8" } },
  { name: "Lagoon", swatch: ["#5EEAD4", "#0E7490", "#04141A"], values: { background: "#04141A", markA: "#5EEAD4", markB: "#0E7490", monogramColor: "#F0FFFC", nameColor: "#E6FBF8" } },
  { name: "Ultraviolet", swatch: ["#C084FC", "#6D28D9", "#0D0718"], values: { background: "#0D0718", markA: "#C084FC", markB: "#6D28D9", monogramColor: "#FFFFFF", nameColor: "#F3EAFF" } },
  { name: "Citrus", swatch: ["#E8FF6B", "#7BC42C", "#0F1206"], values: { background: "#0F1206", markA: "#E8FF6B", markB: "#7BC42C", monogramColor: "#0F1206", nameColor: "#F4FFD6" } },
  { name: "Paper", swatch: ["#F4F0E8", "#3A3A3F", "#0E0E10"], values: { background: "#F4F0E8", markA: "#3A3A3F", markB: "#0E0E10", monogramColor: "#F4F0E8", nameColor: "#141414" } },
];

export default defineMotion<ShardAssembleProps>({
  slug: "shard-assemble",
  name: "Shard Assemble",
  description: "Geometric shards fly in with motion blur, lock into a monogram mark, and the brand name wipes in beside it.",
  category: "logo",
  tags: ["logo", "reveal", "shards", "lockup", "intro"],
  addedAt: "2026-10-17",
  durationInFrames: 120,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: ShardAssemble,
  defaultProps: {
    ...palettes[0].values,
    monogram: "N",
    name: "Northwind",
    spread: 420,
    stagger: 3,
    ease: "smooth",
  } as ShardAssembleProps,
  palettes,
  controls: [
    { type: "text", key: "monogram", label: "Monogram", maxLength: 2 },
    { type: "text", key: "name", label: "Brand name", maxLength: 14 },
    { type: "color", key: "markA", label: "Mark" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "spread", label: "Fly-in distance", min: 200, max: 700, step: 20, unit: "px" },
    { type: "number", key: "stagger", label: "Stagger", min: 0, max: 6, step: 1, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const D = Math.round(c.seconds * c.fps);
    const vertical = c.height > c.width;
    const S = vertical ? 320 : 280;
    const dur = D * 0.24;
    const lockAt = D * 0.04 + (SHARD_COUNT - 1) * p.stagger + dur;
    const nameStart = lockAt + D * 0.06;
    const nameEnd = Math.max(nameStart + D * 0.12, Math.min(nameStart + D * 0.2, D * 0.74));
    return [
      targetLine(c.target, `a logo reveal where ${SHARD_COUNT} geometric shards assemble into a monogram mark and the name "${p.name}" wipes in`, c.width, c.height, c.seconds),
      `Background ${p.background}. Font Geist only.`,
      "",
      `Mark: a ${S}×${S} rounded square, radius ${Math.round(S * RADIUS)}px, 140° gradient ${p.markA} → ${p.markB}, soft ${p.markB} glow at 45% (0 34px 90px). Monogram "${p.monogram}" centred, Geist 700, -0.045em, ${p.monogramColor}.`,
      `Cut the square into ${SHARD_COUNT} clip-path polygons that all meet at (56%, 46%), so it looks crystalline. Each shard carries the full gradient so they join seamlessly.`,
      `Shards fly in from their own outward direction, ${Math.round(p.spread * 0.8)}–${Math.round(p.spread * 1.25)}px away, rotated up to ±55°, at 72% scale and 18px blur, all easing to rest over ${secs(dur, c.fps)}. They start ${p.stagger} frames apart in shuffled order from ${secs(D * 0.04, c.fps)}.`,
      `They lock at ${secs(lockAt, c.fps)}: the mark pulses 3.5% bigger and back, a top gloss and 2px inner rim light switch on, and the monogram rises 8% from 86% scale with blur.`,
      vertical
        ? `From ${secs(nameStart, c.fps)} to ${secs(nameEnd, c.fps)}, the mark rises while "${p.name}" wipes down into place below it (gap ${Math.round(S * 0.2)}px), so the stacked lockup ends centred.`
        : `From ${secs(nameStart, c.fps)} to ${secs(nameEnd, c.fps)}, the mark slides left while "${p.name}" wipes in from the left beside it (gap ${Math.round(S * 0.22)}px), so the lockup ends centred.`,
      `Name: Geist 650, ${vertical ? 116 : 124}px, -0.04em tracking, ${p.nameColor}; shrink to fit long names.`,
      `Ease ${p.ease} ${bezierText(p.ease)}. Hold the finished lockup to the end (last ${Math.round((1 - nameEnd / D) * 100)}%).`,
    ].join("\n");
  },
});
