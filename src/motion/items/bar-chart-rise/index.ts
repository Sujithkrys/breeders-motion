import { EASE_OPTIONS, STAGGER, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { BAR_DUR, BAR_START, BarChartRise, barStep, fmt, niceScale, parseLabels, parseValues, type BarChartRiseProps } from "./BarChartRise";

// One accent on the peak bar; inactive bars sit in the canvas's `line` grey so they read on Paper.
const palettes = systemPalettes((t) => ({
  background: t.bg,
  ink: t.ink,
  ink2: t.ink2,
  ink3: t.ink3,
  line: t.line,
  bar: t.line,
  accent: t.accent,
  success: t.success,
  error: t.error,
}));

export default defineMotion<BarChartRiseProps>({
  slug: "bar-chart-rise",
  name: "Bar Chart Rise",
  description: "Grey bars rise one by one on a spring while the peak bar lands in the accent and its value counts up.",
  category: "charts",
  tags: ["chart", "bars", "data", "count-up", "report"],
  addedAt: "2026-10-16",
  durationInFrames: 150,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: BarChartRise,
  defaultProps: {
    ...palettes[0].values,
    title: "Weekly signups",
    labels: "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
    values: "42,68,55,90,74,98,81",
    stagger: STAGGER,
    ease: "spring",
  } as BarChartRiseProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title", maxLength: 40 },
    { type: "text", key: "values", label: "Values (comma-separated)", maxLength: 80 },
    { type: "text", key: "labels", label: "Labels (comma-separated)", maxLength: 120 },
    { type: "color", key: "accent", label: "Peak bar" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "stagger", label: "Stagger", min: 2, max: 4, step: 1, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const { values } = parseValues(p.values);
    const n = values.length;
    const labels = parseLabels(p.labels, n);
    const max = Math.max(...values);
    const hi = values.indexOf(max);
    const { top, step } = niceScale(max);
    const st = barStep(n, p.stagger);
    const stText = fmt(st, st % 1 === 0 ? 0 : 1);
    const hiStart = BAR_START + hi * st;
    const settle = Math.ceil(Math.max(BAR_START + (n - 1) * st + BAR_DUR + 8, hiStart + BAR_DUR + 16));
    const first = values[0];
    const delta = first > 0 ? Math.round(((values[n - 1] - first) / first) * 100) : null;
    const total = Math.round(c.seconds * c.fps);
    return [
      targetLine(c.target, `a report-style bar chart of ${n} grey bars that rise one by one, with the peak bar in a single accent`, c.width, c.height, c.seconds),
      `Background: flat ${p.background}, no card, no gradient, no glow. Text ${p.ink}, secondary ${p.ink2}, labels ${p.ink3}, inactive bars ${p.bar}, gridlines ${p.line}. The only colour is ${p.accent}, on the ${labels[hi]} bar and its value label.`,
      `Type: Inter everywhere; Geist Mono with tabular figures only for axis labels and numbers. Title "${p.title}" 44px weight 500, -0.035em, ${p.ink}. Peak value 96px weight 600, -0.045em, ${p.ink}. Tiny labels are 18px mono capitals at +0.12em in ${p.ink3}. Weights are 400/500/600 only, in sentence case.`,
      `Data: ${labels.map((l, i) => `${l} ${values[i]}`).join(", ")}, parsed from comma-separated string props.`,
      `Geometry at 16:9 (px at 1080 on the short side): 200px side margins, so the chart spans about 76% of the width. Header on the left: "${labels[0]} – ${labels[n - 1]}" over the title. Header on the right: "PEAK · ${labels[hi]}" over the peak value${delta !== null ? `, beside a delta chip "${delta >= 0 ? "+" : "−"}${Math.abs(delta)}%" in ${delta >= 0 ? p.success : p.error} on a 12% tint of it, 18px mono, 8px radius` : ""}.`,
      `The Y axis runs 0–${top} in steps of ${step}, with solid 1.5px gridlines in ${p.line} and a 1.5px baseline in ${p.ink} at 20%. Tick labels and day labels are 18px mono in ${p.ink3}.`,
      `Bars are 56% of each slot (max 112px), flat fill, 8px radius on the top corners only and square at the baseline. Each bar has its value above it in 18px mono.`,
      `Motion at 30fps, ${total} frames. Frames 0–22: the header fades in and rises 24px, ease enter ${bezierText("enter")}. From frame 4, gridlines draw left to right over 24 frames, 3 frames apart.`,
      `Bar i grows from the baseline from frame ${BAR_START} + i × ${stText} over ${BAR_DUR} frames, ease ${p.ease} ${bezierText(p.ease)}. Its value fades in and rises 8px from 8 frames in. The peak value counts up with its bar (frames ${Math.round(hiStart)}–${Math.round(hiStart + BAR_DUR)}), then the chip fades in over 20 frames.`,
      `Everything settles by frame ${settle}; the last 12 frames are a completely still hold.`,
    ].join("\n");
  },
});
