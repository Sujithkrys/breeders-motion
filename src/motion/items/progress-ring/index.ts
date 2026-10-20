import { EASE_OPTIONS, FINAL_HOLD, STROKE, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { CAPTION_IN, ENTER, FILL_AT, ProgressRing, ringSize, type ProgressRingProps } from "./ProgressRing";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  line: t.line,
  ink: t.ink,
  ink2: t.ink2,
  ink3: t.ink3,
  accent: t.accent,
}));

const DURATION = 150;

export default defineMotion<ProgressRingProps>({
  slug: "progress-ring",
  name: "Progress Ring",
  description: "A flat progress ring sweeps to its target while the percentage counts up in the centre.",
  category: "ui",
  tags: ["progress", "ring", "counter", "stats", "gauge"],
  addedAt: "2026-10-06",
  durationInFrames: DURATION,
  fps: 30,
  ratios: ["1:1", "16:9", "9:16"],
  component: ProgressRing,
  defaultProps: {
    ...palettes[0].values,
    label: "Weekly goal",
    caption: "12% ahead of last week",
    target: 78,
    fillTime: 66,
    ease: "enter",
  } as ProgressRingProps,
  palettes,
  controls: [
    { type: "text", key: "label", label: "Label", maxLength: 22 },
    { type: "text", key: "caption", label: "Caption", maxLength: 32 },
    { type: "number", key: "target", label: "Target", min: 5, max: 100, step: 1, unit: "%" },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "fillTime", label: "Fill time", min: 36, max: 100, step: 2, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const wide = c.width > c.height;
    const ring = ringSize(wide);
    const fillEnd = FILL_AT + p.fillTime;
    const capFrom = fillEnd - 6;
    return [
      targetLine(c.target, "a flat progress ring that fills to a target while the number counts up", c.width, c.height, c.seconds),
      `Background: flat ${p.background}, no gradient, glow or texture. ${wide ? "Ring on the left with the label and caption pill 104px to its right" : "Ring centred with the label and caption pill 52px below it"}.`,
      `Type: Inter only. The value ${wide ? 200 : 176}px weight 600, -0.045em, tabular figures, ${p.ink}, then "%" at ${wide ? 72 : 64}px weight 400 in ${p.ink3}. "${p.label}" ${wide ? 56 : 46}px weight 400, -0.035em, ${p.ink}. Caption "${p.caption}" 25px weight 500 in ${p.ink2}. Sentence case, hierarchy by grey only.`,
      `Geometry: a ${ring}px SVG ring with a ${STROKE.bar}px track in ${p.line} and a ${STROKE.bar}px arc in solid ${p.accent} with round caps, starting at 12 o'clock and drawn with strokeDasharray. No gradient, no blur, no glow, no head dot.`,
      `Caption pill: 60px tall, fully rounded (999), ${p.card} fill with a ${STROKE.hair}px ${p.line} border, a trend-up line icon in ${p.accent} (${STROKE.ring}px stroke) before the text. ${p.accent} is the only colour in the frame.`,
      `Motion: frames 0–${ENTER} everything fades in and scales 0.96 → 1 (enter ${bezierText("enter")}).`,
      `Frames ${FILL_AT}–${fillEnd} (${secs(FILL_AT, c.fps)}–${secs(fillEnd, c.fps)}): the arc fills 0 → ${p.target}% and the number counts up in sync, ${p.ease} ${bezierText(p.ease)}.`,
      `Frames ${capFrom}–${capFrom + CAPTION_IN}: the caption pill fades in and rises 16px (enter).`,
      `Frames ${DURATION - FINAL_HOLD}–${DURATION}: hold the final state completely still.`,
    ].join("\n");
  },
});
