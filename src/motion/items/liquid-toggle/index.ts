import { EASE_OPTIONS, RADIUS, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { CARD, LiquidToggle, OFF_AT, ON_AT, TRACK, type LiquidToggleProps } from "./LiquidToggle";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  line: t.line,
  track: t.line,
  knob: t.onAccent,
  ink: t.ink,
  ink2: t.ink2,
  ink3: t.ink3,
  accent: t.accent,
}));

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
    ease: "enter",
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
    const total = c.seconds * c.fps;
    return [
      targetLine(c.target, "a settings card with a large toggle whose knob stretches like liquid as it travels", c.width, c.height, c.seconds),
      `Background: flat ${p.background}, no gradient or glow. One accent, ${p.accent}, used only for the track's on fill.`,
      `Type: Inter. Title "${p.title}" 56px weight 400, -0.04em, line-height 1.1, ${p.ink}. Under it the state at 30px weight 400, -0.015em, in a 44px window: "${p.offText}" in ${p.ink3}, "${p.onText}" in ${p.ink2}.`,
      `Card: ${CARD.wide}px wide at 16:9 with the text on the left and the toggle on the right; ${CARD.narrow}px wide in 9:16 and 1:1 with the toggle above centred text. Padding ${CARD.pad}, 56px gap, radius ${RADIUS.card}, fill ${p.card}, 1px ${p.line} border, shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06) (none on a dark canvas).`,
      `Toggle: ${TRACK.w}×${TRACK.h} pill track in flat ${p.track}. Knob: ${d}px flat ${p.knob} circle inset ${TRACK.pad}px with a small drop shadow (0 1px 2px rgba(0,0,0,.08), 0 6px 16px rgba(0,0,0,.12); none on dark). It travels ${travel}px. No gradients, highlights or glows.`,
      `Track fill: a flat ${p.accent} pill whose right edge follows the knob's right edge, fading in over the first 60% of the switch.`,
      `Motion: the switch turns on at frame ${ON_AT} and off at frame ${OFF_AT}, each taking ${p.travel} frames (${p.ease}, ${bezierText(p.ease)}).`,
      `Within a switch, the leading edge moves over the first ${100 - p.stretch}% of that time and the trailing edge over the last ${100 - p.stretch}%. The knob stretches into a pill mid-travel (height squashes up to 20%), then rounds again. Keep the knob inside the track; if it overshoots, it squishes against the end.`,
      `The state label slides 28px up and crossfades with the switch progress.`,
      `Frames ${OFF_AT + p.travel}–${total} hold completely still in the off state, so the loop ends exactly where it starts (off → on → off).`,
    ].join("\n");
  },
});
