import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { LiquidToggle, OFF_AT, ON_AT, TRACK, type LiquidToggleProps } from "./LiquidToggle";

const palettes = [
  { name: "Lime", swatch: ["#0A0D08", "#B8F23A", "#23281F"], values: { background: "#0A0D08", trackOff: "#23281F", accent: "#B8F23A", knob: "#FFFFFF", text: "#F1F5EC" } },
  { name: "Coral", swatch: ["#120B0A", "#FF6B4A", "#2A1F1D"], values: { background: "#120B0A", trackOff: "#2A1F1D", accent: "#FF6B4A", knob: "#FFFFFF", text: "#F8EEEC" } },
  { name: "Violet", swatch: ["#0D0B14", "#8B6CFF", "#241F33"], values: { background: "#0D0B14", trackOff: "#241F33", accent: "#8B6CFF", knob: "#FFFFFF", text: "#EFEDF7" } },
  { name: "Meadow", swatch: ["#F3EFE6", "#2BB673", "#DCD6C9"], values: { background: "#F3EFE6", trackOff: "#DCD6C9", accent: "#2BB673", knob: "#FFFFFF", text: "#1D1B16" } },
  { name: "Sky", swatch: ["#E9F2FB", "#1E88F0", "#CBD8E6"], values: { background: "#E9F2FB", trackOff: "#CBD8E6", accent: "#1E88F0", knob: "#FFFFFF", text: "#0E1B2B" } },
];

export default defineMotion<LiquidToggleProps>({
  slug: "liquid-toggle",
  name: "Liquid Toggle",
  description: "A big switch whose knob stretches like a drop of liquid as it slides, filling the track and flipping its label.",
  category: "ui",
  tags: ["toggle", "switch", "liquid", "control", "loop"],
  addedAt: "2026-10-02",
  durationInFrames: 120,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: LiquidToggle,
  defaultProps: {
    ...palettes[0].values,
    title: "Focus mode",
    offText: "Off",
    onText: "On",
    stretch: 32,
    travel: 22,
    ease: "smooth",
  } as LiquidToggleProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title", maxLength: 22 },
    { type: "text", key: "offText", label: "Off label", maxLength: 14 },
    { type: "text", key: "onText", label: "On label", maxLength: 14 },
    { type: "color", key: "accent", label: "On colour" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "stretch", label: "Stretch", min: 0, max: 45, step: 1, unit: "%" },
    { type: "number", key: "travel", label: "Travel time", min: 14, max: 30, step: 1, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const d = TRACK.h - TRACK.pad * 2;
    const travel = TRACK.w - TRACK.pad * 2 - d;
    return [
      targetLine(c.target, "a large toggle switch whose knob stretches like liquid as it travels", c.width, c.height, c.seconds),
      `Background ${p.background}. Font Geist. Everything centred in one column with a 76px gap.`,
      `Track: ${TRACK.w}×${TRACK.h} pill, fill ${p.trackOff}, soft inset shadow. Knob: ${d}px ${p.knob} circle inset ${TRACK.pad}px, vertical gradient, soft drop shadow and a faint top highlight. It travels ${travel}px.`,
      `Switch on at ${secs(ON_AT, c.fps)} and off at ${secs(OFF_AT, c.fps)}, each taking ${secs(p.travel, c.fps)}. The leading edge moves over the first ${100 - p.stretch}% of that time and the trailing edge over the last ${100 - p.stretch}%, so the knob stretches into a pill mid-travel (height squashes up to 20%), then snaps round again. Keep the knob inside the track; if it overshoots, let it squish against the end.`,
      `Track fill: a ${p.accent} pill layer whose right edge follows the knob's right edge, faded in as the toggle turns on; a ${p.accent} glow (90px blur, 38%) grows under the track.`,
      `Below: "${p.title}" at 60px weight 650, -0.04em, ${p.text}. Under it the state at 40px: "${p.offText}" in ${p.text} at 45% slides up and out while "${p.onText}" in ${p.accent} slides up into a 56px window, and back.`,
      `Ease ${p.ease} ${bezierText(p.ease)}. Loop seamlessly: off → on → off.`,
    ].join("\n");
  },
});
