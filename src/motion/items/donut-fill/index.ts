import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { DonutFill, parseLabels, parseValues, type DonutFillProps } from "./DonutFill";

const palettes = [
  {
    name: "Orchid",
    swatch: ["#110B1A", "#A855F7", "#E879F9", "#F472B6"],
    values: { background: "#110B1A", ink: "#F7F0FF", muted: "#9C90B0", grid: "#221A30", seg1: "#A855F7", seg2: "#E879F9", seg3: "#F472B6", seg4: "#7C3AED", seg5: "#C4B5FD", seg6: "#6B5B8A" },
  },
  {
    name: "Citrus",
    swatch: ["#0C1208", "#B8F23A", "#4ADE80", "#2DD4BF"],
    values: { background: "#0C1208", ink: "#F2FBE8", muted: "#8FA084", grid: "#1B2414", seg1: "#B8F23A", seg2: "#4ADE80", seg3: "#2DD4BF", seg4: "#FDE047", seg5: "#86EFAC", seg6: "#5B6B4E" },
  },
  {
    name: "Coral",
    swatch: ["#160C0A", "#FF6B4A", "#FFB547", "#FF8FA3"],
    values: { background: "#160C0A", ink: "#FFF3EE", muted: "#A8918A", grid: "#2A1C18", seg1: "#FF6B4A", seg2: "#FFB547", seg3: "#FF8FA3", seg4: "#F43F5E", seg5: "#FFD8A8", seg6: "#7A5A50" },
  },
  {
    name: "Porcelain",
    swatch: ["#F7F5F0", "#4338CA", "#F97316", "#14B8A6"],
    values: { background: "#F7F5F0", ink: "#18161C", muted: "#7F7A86", grid: "#E6E2DA", seg1: "#4338CA", seg2: "#F97316", seg3: "#14B8A6", seg4: "#EAB308", seg5: "#EC4899", seg6: "#A8A29E" },
  },
  {
    name: "Graphite",
    swatch: ["#0E0E10", "#F5F5F6", "#7E7E86"],
    values: { background: "#0E0E10", ink: "#F5F5F6", muted: "#8A8A92", grid: "#1E1E22", seg1: "#F5F5F6", seg2: "#B4B4BB", seg3: "#7E7E86", seg4: "#55555C", seg5: "#3A3A40", seg6: "#2A2A2F" },
  },
];

export default defineMotion<DonutFillProps>({
  slug: "donut-fill",
  name: "Donut Fill",
  description: "Donut segments sweep in one after another while the total counts up and legend rows step in beside them.",
  category: "charts",
  tags: ["chart", "donut", "breakdown", "legend", "count-up"],
  addedAt: "2026-10-12",
  durationInFrames: 150,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: DonutFill,
  defaultProps: {
    ...palettes[0].values,
    title: "Traffic by channel",
    labels: "Direct,Search,Social,Email,Referral",
    values: "38,24,18,12,8",
    sweep: 50,
    ease: "soft",
  } as DonutFillProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title", maxLength: 32 },
    { type: "text", key: "values", label: "Values (comma-separated, up to 6)", maxLength: 60 },
    { type: "text", key: "labels", label: "Labels (comma-separated)", maxLength: 100 },
    { type: "color", key: "seg1", label: "First segment" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "sweep", label: "Sweep length", min: 35, max: 65, step: 5, unit: "%" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const { values } = parseValues(p.values);
    const labels = parseLabels(p.labels, values.length);
    const total = values.reduce((a, b) => a + b, 0);
    const colors = [p.seg1, p.seg2, p.seg3, p.seg4, p.seg5, p.seg6];
    const sweepFrames = (p.sweep / 100) * c.seconds * c.fps;
    return [
      targetLine(c.target, "a donut chart whose segments sweep in one after another, with a counting total and a legend", c.width, c.height, c.seconds),
      `Background ${p.background}. Font Geist; numbers in Geist Mono with tabular figures. Text ${p.ink}, secondary ${p.muted}.`,
      `Data (comma-separated props): ${labels.map((l, i) => `${l} ${values[i]} (${colors[i]})`).join(", ")}. Total ${total}.`,
      "",
      `Layout at 16:9: donut centred at (600, 548), outer radius 300, ring thickness 68, on a ${p.grid} track ring. Title "${p.title}" at 64px weight 650 (-0.04em) above the legend on the right.`,
      "Segments are SVG arc paths with butt caps starting at 12 o'clock, clockwise, separated by 6px gaps.",
      `One sweep angle runs 0 → 360° from 0.5s over ${secs(sweepFrames, c.fps)} (${p.sweep}% of the duration), ease ${p.ease} ${bezierText(p.ease)}; each segment fills only the part of the sweep it owns, so they appear in sequence.`,
      `Centre: mono uppercase "TOTAL" (0.14em) above the total counting up from 0 with the sweep, at 27% of the radius, weight 650.`,
      `Legend rows (86px tall, 1.5px ${p.grid} divider): 22px rounded colour chip with a soft glow, label 30px weight 500, value in mono ${p.muted}, share % in mono 28px.`,
      "Each row slides in 28px from the right as the sweep reaches its segment, and its value and % count up while that segment fills.",
      "Everything lands by about 75% of the duration; hold the finished chart.",
    ].join("\n");
  },
});
