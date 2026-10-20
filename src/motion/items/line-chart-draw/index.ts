import { EASE_OPTIONS, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { DRAW_START, LineChartDraw, niceDomain, parseLabels, parseValues, type LineChartDrawProps } from "./LineChartDraw";

// One accent on the line, the tip dot and a faint flat area; the tooltip is the system's button colour.
const palettes = systemPalettes((t) => ({
  background: t.bg,
  ink: t.ink,
  ink2: t.ink2,
  ink3: t.ink3,
  line: t.line,
  accent: t.accent,
  tooltip: t.button,
  tooltipInk: t.onButton,
  success: t.success,
  error: t.error,
}));

export default defineMotion<LineChartDrawProps>({
  slug: "line-chart-draw",
  name: "Line Chart Draw",
  description: "A single accent line draws itself across a quiet grid while a dot and tooltip ride its tip.",
  category: "charts",
  tags: ["chart", "line", "tooltip", "data", "growth"],
  addedAt: "2026-10-08",
  durationInFrames: 150,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: LineChartDraw,
  defaultProps: {
    ...palettes[0].values,
    title: "Monthly recurring revenue",
    labels: "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct",
    values: "24,31,28,42,39,55,61,58,72,84",
    draw: 55,
    ease: "enter",
  } as LineChartDrawProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title", maxLength: 40 },
    { type: "text", key: "values", label: "Values (comma-separated)", maxLength: 100 },
    { type: "text", key: "labels", label: "Labels (comma-separated)", maxLength: 120 },
    { type: "color", key: "accent", label: "Line" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "draw", label: "Draw length", min: 35, max: 60, step: 5, unit: "%" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const { values } = parseValues(p.values);
    const n = values.length;
    const labels = parseLabels(p.labels, n);
    const { lo, hi, step } = niceDomain(Math.min(...values), Math.max(...values));
    const total = Math.round(c.seconds * c.fps);
    const drawEnd = Math.round(DRAW_START + (p.draw / 100) * total);
    const first = values[0];
    const delta = first !== 0 ? Math.round(((values[n - 1] - first) / Math.abs(first)) * 100) : null;
    return [
      targetLine(c.target, "a report-style line chart whose single accent line draws itself on, with a tooltip riding its tip", c.width, c.height, c.seconds),
      `Background: flat ${p.background}, no card, no gradient, no glow. Text ${p.ink}, secondary ${p.ink2}, labels ${p.ink3}, gridlines ${p.line}. The only colour is ${p.accent}, on the line, its tip dot and the area beneath.`,
      `Type: Inter everywhere; Geist Mono with tabular figures only for axis labels and numbers. Title "${p.title}" 44px weight 500, -0.035em. The last value is 96px weight 600, -0.045em, ${p.ink}. Tiny labels are 18px mono capitals at +0.12em in ${p.ink3}. Weights are 400/500/600 only, in sentence case.`,
      `Data: ${labels.map((l, i) => `${l} ${values[i]}`).join(", ")}, parsed from comma-separated string props.`,
      `Geometry at 16:9 (px at 1080 on the short side): 200px side margins, so the plot spans about 75% of the width. Header: "${labels[0]} – ${labels[n - 1]}" over the title on the left; on the right the last value${delta !== null ? `, beside a delta chip "${delta >= 0 ? "+" : "−"}${Math.abs(delta)}%" in ${delta >= 0 ? p.success : p.error} on a 12% tint of it, 18px mono, 8px radius` : ""}.`,
      `The Y axis runs ${lo}–${hi} in steps of ${step}, with solid 1.5px gridlines in ${p.line} and a baseline in ${p.ink} at 20%. Tick and month labels are 18px mono in ${p.ink3}; the label under the tip turns ${p.ink} at weight 500.`,
      `Line: a monotone cubic through the points (no overshoot), 2.5px ${p.accent}, round caps. Under it is a flat ${p.accent} fill at 8% opacity, clipped to the tip's x. There are no gradients and no glow.`,
      `Tip: an 8px ${p.accent} dot with a 2.5px ${p.background} ring, and a dashed 1.5px drop line to the baseline in ${p.ink} at 25%. Tooltip 112px above it: 152×80, 16px radius, ${p.tooltip} with ${p.tooltipInk} text, a 14px rotated-square pointer, the nearest label in 15px mono capitals at 60%, and the live value at 30px weight 500.`,
      `Motion at 30fps, ${total} frames. Frames 0–22: the header fades in and rises 24px, ease enter ${bezierText("enter")}. From frame 4, gridlines draw left to right over 24 frames, 3 frames apart.`,
      `Frames ${DRAW_START}–${drawEnd}: the line draws on with strokeDasharray/strokeDashoffset, ease ${p.ease} ${bezierText(p.ease)}. An arc-length lookup keeps the dot, drop line and tooltip on the tip. The tooltip fades in and rises 12px over frames ${DRAW_START}–${DRAW_START + 18}, and the last value counts up over the same span as the draw. The delta chip fades in over frames ${drawEnd - 6}–${drawEnd + 14}.`,
      `Everything settles by frame ${drawEnd + 14}; the last 12 frames are a completely still hold, with the tooltip resting on the last point.`,
    ].join("\n");
  },
});
