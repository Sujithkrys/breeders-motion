import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { BarChartRise, parseLabels, parseValues, type BarChartRiseProps } from "./BarChartRise";

const palettes = [
  {
    name: "Ember",
    swatch: ["#120C0A", "#3A2620", "#FF6B3D"],
    values: { background: "#120C0A", ink: "#FFF4EC", muted: "#A8968C", grid: "#2A201C", bar: "#3A2620", accent: "#FF6B3D", accentInk: "#1A0B05" },
  },
  {
    name: "Lagoon",
    swatch: ["#061614", "#1B3D37", "#2EE6B6"],
    values: { background: "#061614", ink: "#E8FFF8", muted: "#7FA39A", grid: "#15302B", bar: "#1B3D37", accent: "#2EE6B6", accentInk: "#03211A" },
  },
  {
    name: "Ultraviolet",
    swatch: ["#0F0A1F", "#2E2550", "#A78BFA"],
    values: { background: "#0F0A1F", ink: "#F3EEFF", muted: "#9B92B8", grid: "#231C3A", bar: "#2E2550", accent: "#A78BFA", accentInk: "#160B33" },
  },
  {
    name: "Paper",
    swatch: ["#F6F2EA", "#DDD3C3", "#E4572E"],
    values: { background: "#F6F2EA", ink: "#1B1712", muted: "#81796E", grid: "#E2DBCE", bar: "#DDD3C3", accent: "#E4572E", accentInk: "#FFFFFF" },
  },
  {
    name: "Graphite",
    swatch: ["#0E0E10", "#2C2C31", "#F5F5F6"],
    values: { background: "#0E0E10", ink: "#F5F5F6", muted: "#8A8A92", grid: "#222226", bar: "#2C2C31", accent: "#F5F5F6", accentInk: "#0E0E10" },
  },
];

export default defineMotion<BarChartRiseProps>({
  slug: "bar-chart-rise",
  name: "Bar Chart Rise",
  description: "Bars rise one by one with a springy overshoot while the peak value counts up in the accent colour.",
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
    stagger: 5,
    ease: "bouncy",
  } as BarChartRiseProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title", maxLength: 40 },
    { type: "text", key: "values", label: "Values (comma-separated)", maxLength: 80 },
    { type: "text", key: "labels", label: "Labels (comma-separated)", maxLength: 120 },
    { type: "color", key: "accent", label: "Highlight bar" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "stagger", label: "Stagger", min: 2, max: 8, step: 1, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const { values } = parseValues(p.values);
    const labels = parseLabels(p.labels, values.length);
    const max = Math.max(...values);
    const hi = values.indexOf(max);
    return [
      targetLine(c.target, `an animated bar chart of ${values.length} bars that rise one by one`, c.width, c.height, c.seconds),
      `Background ${p.background}. Font Geist; numbers in Geist Mono with tabular figures. Text ${p.ink}, secondary text ${p.muted}.`,
      `Data: ${labels.map((l, i) => `${l} ${values[i]}`).join(", ")}. Parse values and labels from comma-separated string props.`,
      "",
      `Header: small uppercase mono range "${labels[0]} – ${labels[labels.length - 1]}" (20px, 0.14em tracking) above the title "${p.title}" (68px, weight 650, -0.04em). On the right: "PEAK · ${labels[hi]}", the peak value at 84px in ${p.accent}, and a pill chip with the first-to-last % change.`,
      `Y axis rounded up to a nice 1/2/2.5/5 step with 4 gridlines: dashed 1.5px ${p.grid} (4px dash, 8px gap), solid baseline in ${p.ink} at 28% opacity; tick labels 20px mono.`,
      `Bars take 58% of each slot (max 120px), top radius 14px, gradient ${p.bar} → 60% alpha. The highest bar (${labels[hi]}) is ${p.accent} with a soft ${p.accent} glow (0 18px 56px, 38%).`,
      `Every bar has its value above it in 20px mono; the peak's value sits in a ${p.accent} pill with ${p.accentInk} text. Day labels 22px under the baseline.`,
      "",
      `Header fades up over the first 0.7s while gridlines draw left to right. From 0.7s each bar grows from the baseline over ${secs(34, c.fps)}, staggered ${p.stagger} frames, with ease ${p.ease} ${bezierText(p.ease)} so it overshoots and settles.`,
      `Value labels fade in as each bar lands; the peak number counts up from 0 with its bar, then the % chip pops in.`,
      "All bars land by 70% of the duration; hold the finished chart to the end.",
    ].join("\n");
  },
});
