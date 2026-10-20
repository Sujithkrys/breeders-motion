import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { LineChartDraw, parseLabels, parseValues, type LineChartDrawProps } from "./LineChartDraw";

const palettes = [
  {
    name: "Mint",
    swatch: ["#06120E", "#9BE15D", "#3EE6A8"],
    values: { background: "#06120E", ink: "#EAFFF6", muted: "#7E9E92", grid: "#14271F", lineStart: "#9BE15D", line: "#3EE6A8", tooltip: "#EAFFF6", tooltipInk: "#06120E" },
  },
  {
    name: "Sunset",
    swatch: ["#160A0E", "#FFB547", "#FF4D6D"],
    values: { background: "#160A0E", ink: "#FFF0EE", muted: "#A88C90", grid: "#2C1A1F", lineStart: "#FFB547", line: "#FF4D6D", tooltip: "#FFF0EE", tooltipInk: "#160A0E" },
  },
  {
    name: "Daylight",
    swatch: ["#F7F6F2", "#F7B32B", "#E8590C"],
    values: { background: "#F7F6F2", ink: "#16181D", muted: "#7C7F87", grid: "#E3E1DA", lineStart: "#F7B32B", line: "#E8590C", tooltip: "#16181D", tooltipInk: "#FFFFFF" },
  },
  {
    name: "Orchid",
    swatch: ["#14081A", "#F472B6", "#D946EF"],
    values: { background: "#14081A", ink: "#FCEEFF", muted: "#A48AAE", grid: "#2A1733", lineStart: "#F472B6", line: "#D946EF", tooltip: "#FCEEFF", tooltipInk: "#14081A" },
  },
  {
    name: "Nightfall",
    swatch: ["#0B0D1E", "#8B5CF6", "#60A5FA"],
    values: { background: "#0B0D1E", ink: "#EEF0FF", muted: "#8D92B8", grid: "#1C2040", lineStart: "#8B5CF6", line: "#60A5FA", tooltip: "#EEF0FF", tooltipInk: "#0B0D1E" },
  },
  {
    name: "Graphite",
    swatch: ["#0E0E10", "#6B6B73", "#F5F5F6"],
    values: { background: "#0E0E10", ink: "#F5F5F6", muted: "#8A8A92", grid: "#222226", lineStart: "#6B6B73", line: "#F5F5F6", tooltip: "#F5F5F6", tooltipInk: "#0E0E10" },
  },
];

export default defineMotion<LineChartDrawProps>({
  slug: "line-chart-draw",
  name: "Line Chart Draw",
  description: "A smooth line draws itself across the chart while a dot and tooltip ride the tip and an area fill fades in beneath.",
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
    ease: "smooth",
  } as LineChartDrawProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title", maxLength: 40 },
    { type: "text", key: "values", label: "Values (comma-separated)", maxLength: 100 },
    { type: "text", key: "labels", label: "Labels (comma-separated)", maxLength: 120 },
    { type: "color", key: "line", label: "Line" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "draw", label: "Draw length", min: 35, max: 60, step: 5, unit: "%" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const { values } = parseValues(p.values);
    const labels = parseLabels(p.labels, values.length);
    const drawFrames = (p.draw / 100) * c.seconds * c.fps;
    return [
      targetLine(c.target, "a line chart that draws itself on with a value tooltip tracking its tip", c.width, c.height, c.seconds),
      `Background ${p.background}. Font Geist; numbers in Geist Mono with tabular figures. Text ${p.ink}, secondary ${p.muted}.`,
      `Data: ${labels.map((l, i) => `${l} ${values[i]}`).join(", ")}, parsed from comma-separated string props.`,
      "",
      `Header: mono uppercase range "${labels[0]} – ${labels[labels.length - 1]}" (20px, 0.14em) over the title "${p.title}" (68px, weight 650, -0.04em). Right side: the last value at 84px counting up, plus a ${p.line} pill with the first-to-last % change.`,
      `Y axis on a nice 1/2/2.5/5 step with dashed 1.5px ${p.grid} gridlines (4/8 dash) and a solid baseline; mono 20px tick labels; x labels 22px.`,
      `Line: monotone cubic through the points (no overshoot), 5px, round caps, horizontal gradient ${p.lineStart} → ${p.line}, with a 10px blurred ${p.line} glow copy at 45% beneath it.`,
      `Draw it with strokeDasharray/strokeDashoffset from 0.5s over ${secs(drawFrames, c.fps)} (${p.draw}% of the duration), ease ${p.ease} ${bezierText(p.ease)}.`,
      `A 10px ${p.line} dot with a 4px ${p.background} ring follows the tip using an arc-length lookup, with a dotted drop line to the baseline. Small hollow dots mark each data point once the tip passes it.`,
      `Tooltip above the dot: 168×92 card, radius 18, ${p.tooltip} with ${p.tooltipInk} text, a rotated-square pointer, the nearest label in mono 18px and the live value at 34px.`,
      `Area under the line: vertical gradient ${p.line} at 34% → 0, clipped to the tip's x and fading in behind it.`,
      "After the line lands the dot emits a soft pulse ring every 1.5s; hold the finished chart.",
    ].join("\n");
  },
});
