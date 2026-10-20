import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { AreaStack, parseNames, parseSeries, type AreaStackProps } from "./AreaStack";

const palettes = [
  {
    name: "Periwinkle",
    swatch: ["#F5F4F0", "#3B5BDB", "#748FFC", "#BAC8FF"],
    values: { background: "#F5F4F0", ink: "#15161A", muted: "#7A7C84", grid: "#E2E0DA", colorA: "#3B5BDB", colorB: "#748FFC", colorC: "#BAC8FF" },
  },
  {
    name: "Harvest",
    swatch: ["#140E08", "#E8590C", "#F59F00", "#FFD43B"],
    values: { background: "#140E08", ink: "#FFF6EA", muted: "#A8987F", grid: "#2A2016", colorA: "#E8590C", colorB: "#F59F00", colorC: "#FFD43B" },
  },
  {
    name: "Lagoon",
    swatch: ["#051512", "#0CA678", "#20C997", "#96F2D7"],
    values: { background: "#051512", ink: "#E6FFF8", muted: "#7FA39A", grid: "#14302A", colorA: "#0CA678", colorB: "#20C997", colorC: "#96F2D7" },
  },
  {
    name: "Berry",
    swatch: ["#12081A", "#9C36B5", "#E64980", "#FFA8C5"],
    values: { background: "#12081A", ink: "#FBEFFF", muted: "#A08AAE", grid: "#251733", colorA: "#9C36B5", colorB: "#E64980", colorC: "#FFA8C5" },
  },
  {
    name: "Graphite",
    swatch: ["#0E0E10", "#E4E4E7", "#8E8E96", "#4A4A50"],
    values: { background: "#0E0E10", ink: "#F5F5F6", muted: "#8A8A92", grid: "#222226", colorA: "#E4E4E7", colorB: "#8E8E96", colorC: "#4A4A50" },
  },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default defineMotion<AreaStackProps>({
  slug: "area-stack",
  name: "Area Stack",
  description: "A three-series stacked area chart grows in from the left behind a tracking edge, with a counting legend.",
  category: "charts",
  tags: ["chart", "area", "stacked", "revenue", "legend"],
  addedAt: "2026-09-24",
  durationInFrames: 150,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: AreaStack,
  defaultProps: {
    ...palettes[0].values,
    title: "Revenue by stream",
    names: "Subscriptions,Services,Marketplace",
    seriesA: "32,38,41,47,52,58,66,71,79,88",
    seriesB: "18,22,21,27,31,30,36,40,44,49",
    seriesC: "8,9,12,13,15,18,19,23,26,30",
    reveal: 50,
    ease: "soft",
  } as AreaStackProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title", maxLength: 32 },
    { type: "text", key: "names", label: "Series names (3)", maxLength: 60 },
    { type: "text", key: "seriesA", label: "Bottom series values", maxLength: 80 },
    { type: "text", key: "seriesB", label: "Middle series values", maxLength: 80 },
    { type: "text", key: "seriesC", label: "Top series values", maxLength: 80 },
    { type: "number", key: "reveal", label: "Grow length", min: 35, max: 60, step: 5, unit: "%" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const series = parseSeries(p.seriesA, p.seriesB, p.seriesC);
    const names = parseNames(p.names);
    const colors = [p.colorA, p.colorB, p.colorC];
    const n = series[0].length;
    const revealFrames = (p.reveal / 100) * c.seconds * c.fps;
    return [
      targetLine(c.target, "a three-series stacked area chart that grows in from the left", c.width, c.height, c.seconds),
      `Background ${p.background}. Font Geist; numbers in Geist Mono with tabular figures. Text ${p.ink}, secondary ${p.muted}.`,
      `Series bottom → top over ${MONTHS[0]}–${MONTHS[(n - 1) % 12]}: ${[0, 1, 2].map((k) => `${names[k]} (${colors[k]}) ${series[k].join(", ")}`).join("; ")}. Each is a comma-separated string prop.`,
      "",
      `Header: mono uppercase month range (20px, 0.14em) over the title "${p.title}" (68px, weight 650, -0.04em); legend on the right listing the top series first, each with an 18px rounded swatch, name 24px weight 500 and the latest value in mono ${p.muted}, counting up.`,
      `Y axis rounded to a nice 1/2/2.5/5 step, 4 dashed 1.5px ${p.grid} gridlines (4/8 dash), mono 20px ticks; month labels 22px below.`,
      `Each layer's top is a monotone cubic through its cumulative totals; fill from the layer below's curve to its own with a vertical gradient (100% → 82%). Separate layers with a 2.5px ${p.background} stroke on their top edge; the top layer's edge is ${p.colorC}.`,
      `Reveal: a clip rect grows from the left edge from 0.5s over ${secs(revealFrames, c.fps)} (${p.reveal}% of the duration), ease ${p.ease} ${bezierText(p.ease)}. Layers fade in bottom-first, 5 frames apart.`,
      `A thin ${p.ink} vertical line at 45% rides the reveal edge with a 7px dot on each layer's top (3px ${p.background} ring), then fades out when the chart is complete.`,
      "Hold the full chart for the final 30% of the duration.",
    ].join("\n");
  },
});
