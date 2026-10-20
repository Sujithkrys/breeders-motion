import { EASE_OPTIONS, bezierText, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { CardFan, type CardFanProps } from "./CardFan";

const palettes = [
  { name: "Aurora", swatch: ["#7C5CFF", "#0067FC", "#22D3EE"], values: { front1: "#7C5CFF", front2: "#0067FC", front3: "#22D3EE" } },
  { name: "Ember", swatch: ["#FFB347", "#FF5F3D", "#C8264B"], values: { front1: "#FFB347", front2: "#FF5F3D", front3: "#C8264B" } },
  { name: "Mint", swatch: ["#7CF2C4", "#14B8A6", "#0F5F66"], values: { front1: "#7CF2C4", front2: "#14B8A6", front3: "#0F5F66" } },
  { name: "Orchid", swatch: ["#F9A8D4", "#D946EF", "#6D28D9"], values: { front1: "#F9A8D4", front2: "#D946EF", front3: "#6D28D9" } },
  { name: "Mono", swatch: ["#5A5A62", "#2A2A2F", "#0E0E10"], values: { front1: "#5A5A62", front2: "#2A2A2F", front3: "#0E0E10" } },
];

export default defineMotion<CardFanProps>({
  slug: "card-fan",
  name: "Card Fan",
  description: "Three payment cards fan out from a stack, hold, and settle back.",
  category: "ui",
  tags: ["fintech", "cards", "wallet", "loop"],
  addedAt: "2026-10-20",
  durationInFrames: 120,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: CardFan,
  defaultProps: {
    background: "#0B0B0D",
    ...palettes[0].values,
    backA: "#F4F1EA",
    backB: "#45454D",
    label: "Breeders",
    last4: "2048",
    spread: 360,
    tilt: 9,
    ease: "smooth",
  } as CardFanProps,
  palettes,
  controls: [
    { type: "text", key: "label", label: "Label", maxLength: 18 },
    { type: "text", key: "last4", label: "Last four", maxLength: 4 },
    { type: "color", key: "front2", label: "Front card" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "spread", label: "Spread", min: 160, max: 520, step: 20, unit: "px" },
    { type: "number", key: "tilt", label: "Tilt", min: 0, max: 18, step: 1, unit: "°" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) =>
    [
      targetLine(c.target, "three payment cards fanning out of a stack", c.width, c.height, c.seconds),
      `Background ${p.background}. Font Geist; card numbers in Geist Mono with 0.12em tracking.`,
      "",
      "Cards are 680×428 with radius 48, stacked at the centre:",
      `- back left: ${p.backA} gradient, "•••• 7310"`,
      `- back right: ${p.backB} → #101012, "•••• 0941"`,
      `- front: 135° gradient ${p.front1} → ${p.front2} → ${p.front3}, label "${p.label}", chip, contactless mark, "•••• ${p.last4}", soft ${p.front2} glow`,
      "",
      `0% → 38% of the loop: back cards slide out to ±${p.spread}px and rotate ±${p.tilt}°; the front card lifts ${Math.round(p.spread * 0.19)}px.`,
      `Hold to 80%, then settle back. Ease ${p.ease} ${bezierText(p.ease)}. Loop seamlessly.`,
    ].join("\n"),
});
