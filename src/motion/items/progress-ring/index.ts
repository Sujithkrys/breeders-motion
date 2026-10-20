import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { FILL_AT, ProgressRing, RING, type ProgressRingProps } from "./ProgressRing";

const palettes = [
  { name: "Magenta", swatch: ["#0F0811", "#FF5FA2", "#B03CFF"], values: { background: "#0F0811", gradA: "#FF5FA2", gradB: "#B03CFF", text: "#F8EEF7" } },
  { name: "Citrus", swatch: ["#0E0C06", "#FFD23F", "#FF7A1A"], values: { background: "#0E0C06", gradA: "#FFD23F", gradB: "#FF7A1A", text: "#F7F2E4" } },
  { name: "Mint", swatch: ["#EEF6F2", "#2FD3A0", "#138A72"], values: { background: "#EEF6F2", gradA: "#2FD3A0", gradB: "#138A72", text: "#10221C" } },
  { name: "Ocean", swatch: ["#070C16", "#5EE7FF", "#3B6CFF"], values: { background: "#070C16", gradA: "#5EE7FF", gradB: "#3B6CFF", text: "#EAF1FB" } },
  { name: "Blush", swatch: ["#F8EEEA", "#FF8A65", "#E5395B"], values: { background: "#F8EEEA", gradA: "#FF8A65", gradB: "#E5395B", text: "#2A1714" } },
];

export default defineMotion<ProgressRingProps>({
  slug: "progress-ring",
  name: "Progress Ring",
  description: "A gradient progress ring sweeps to its target while the percentage counts up in the centre.",
  category: "ui",
  tags: ["progress", "ring", "counter", "stats", "gauge"],
  addedAt: "2026-10-06",
  durationInFrames: 150,
  fps: 30,
  ratios: ["1:1", "16:9", "9:16"],
  component: ProgressRing,
  defaultProps: {
    ...palettes[0].values,
    label: "Weekly goal",
    caption: "12% ahead of last week",
    target: 78,
    thickness: 40,
    fillTime: 66,
    ease: "enter",
  } as ProgressRingProps,
  palettes,
  controls: [
    { type: "text", key: "label", label: "Label", maxLength: 22 },
    { type: "text", key: "caption", label: "Caption", maxLength: 32 },
    { type: "number", key: "target", label: "Target", min: 5, max: 100, step: 1, unit: "%" },
    { type: "color", key: "gradA", label: "Gradient start" },
    { type: "color", key: "gradB", label: "Gradient end" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "thickness", label: "Thickness", min: 20, max: 56, step: 2, unit: "px" },
    { type: "number", key: "fillTime", label: "Fill time", min: 36, max: 100, step: 2, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const R = Math.round((RING - p.thickness) / 2 - 24);
    return [
      targetLine(c.target, "a circular progress ring with a gradient stroke filling to a target while the number counts up", c.width, c.height, c.seconds),
      `Background ${p.background}. Font Geist. Centred column: a ${RING}px ring, then a caption pill 48px below. Everything fades in and scales 0.96 → 1 over 0.4s.`,
      `Ring: SVG circle, radius ${R}, stroke ${p.thickness}px. Track in ${p.text} at 8%. Progress arc starts at 12 o'clock, round caps, stroke is a diagonal linear gradient ${p.gradA} → ${p.gradB}, drawn with strokeDasharray. Under it the same arc blurred (stdDeviation ${Math.round(p.thickness * 0.55)}) at 55% for a glow, and a small white dot (85%) riding the arc's head.`,
      `From ${secs(FILL_AT, c.fps)} to ${secs(FILL_AT + p.fillTime, c.fps)} the arc fills 0 → ${p.target}% with ease ${p.ease} ${bezierText(p.ease)}.`,
      `Centre: the rounded value counts up in sync at 168px weight 700, -0.05em, tabular figures, ${p.text}, followed by "%" at 68px weight 600 and 50%. Below it "${p.label}" at 30px weight 400, 55%.`,
      `As the fill finishes, the caption pill rises 18px and fades in: 60px tall, radius 30, ${p.gradA} at 13% fill with a 30% border, a trend-up arrow in ${p.gradA} and "${p.caption}" at 26px weight 500.`,
      "Hold the final state to the end.",
    ].join("\n");
  },
});
