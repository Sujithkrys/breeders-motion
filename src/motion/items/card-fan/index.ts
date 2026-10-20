import { EASE_OPTIONS, FINAL_HOLD, RADIUS, STROKE, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { CARD_W, CardFan, FAN, isDark, type CardFanProps } from "./CardFan";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  line: t.line,
  ink: t.ink,
  ink3: t.ink3,
  accent: t.accent,
  onAccent: t.onAccent,
}));

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
    ...palettes[0].values,
    label: "Breeders",
    last4: "2048",
    spread: 360,
    tilt: 9,
    ease: "enter",
  } as CardFanProps,
  palettes,
  controls: [
    { type: "text", key: "label", label: "Label", maxLength: 18 },
    { type: "text", key: "last4", label: "Last four", maxLength: 4 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "spread", label: "Spread", min: 160, max: 520, step: 20, unit: "px" },
    { type: "number", key: "tilt", label: "Tilt", min: 0, max: 18, step: 1, unit: "°" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const wide = c.width > c.height;
    const w = wide ? CARD_W : 560;
    const h = Math.round(w * 0.63);
    const dark = isDark(p.background);
    const end = c.seconds * c.fps;
    return [
      targetLine(c.target, "three flat payment cards fanning out of a stack", c.width, c.height, c.seconds),
      `Background: flat ${p.background}. No gradients, glows or coloured shadows anywhere.`,
      `Type: Inter. Front label "${p.label}" 34px weight 500, -0.02em, in ${p.onAccent}. Card numbers in Geist Mono 30px weight 400, +0.12em tracking.`,
      `Cards: ${w}×${h}px (sizes at 1080 on the short side), radius ${RADIUS.card}, stacked at the centre.`,
      `- back left: ${p.card} with a 1px ${p.line} border, "•••• 7310" in ${p.ink3}`,
      `- back right: flat ${p.ink}, "•••• 0941" in ${p.ink3}`,
      `- front: flat ${p.accent}. A contactless mark (${STROKE.ring}px stroke, ${p.onAccent} at 85%), a 88×66 chip (radius ${RADIUS.chip}, ${p.onAccent} at 30%), "•••• ${p.last4}" and two overlapping 52px circles (${p.onAccent} at 75% and 40%).`,
      dark ? "No shadows on this dark canvas." : "Each card has shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06).",
      "",
      `Frames 0–${FAN.out[0]}: hold the stack.`,
      `Frames ${FAN.out[0]}–${FAN.out[1]}: the back cards slide to ±${p.spread}px${wide ? "" : " (scaled to fit the narrower frame)"} and rotate ±${p.tilt}°, and the front card lifts ${Math.round(p.spread * 0.19)}px. Ease: ${p.ease}, ${bezierText(p.ease)}.`,
      `Hold to frame ${FAN.back[0]}. Frames ${FAN.back[0]}–${FAN.back[1]}: settle back to the stack on travel, ${bezierText("travel")}.`,
      `Frames ${end - FINAL_HOLD}–${end}: hold still, so the loop is seamless.`,
    ].join("\n");
  },
});
