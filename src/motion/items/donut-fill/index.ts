import { EASE_OPTIONS, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { DonutFill, ROW_DUR, SWEEP_START, parseLabels, parseValues, segmentColors, type DonutFillProps } from "./DonutFill";

// The first segment takes the accent; the rest step down through the canvas greys.
const palettes = systemPalettes((t) => ({
  background: t.bg,
  ink: t.ink,
  ink2: t.ink2,
  ink3: t.ink3,
  line: t.line,
  fill: t.fill,
  accent: t.accent,
}));

export default defineMotion<DonutFillProps>({
  slug: "donut-fill",
  name: "Donut Fill",
  description: "A donut sweeps in from one accent segment through grey steps while the total counts up and legend rows step in.",
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
    ease: "travel",
  } as DonutFillProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title", maxLength: 32 },
    { type: "text", key: "values", label: "Values (comma-separated, up to 6)", maxLength: 60 },
    { type: "text", key: "labels", label: "Labels (comma-separated)", maxLength: 100 },
    { type: "color", key: "accent", label: "First segment" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "sweep", label: "Sweep length", min: 35, max: 65, step: 5, unit: "%" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const { values } = parseValues(p.values);
    const labels = parseLabels(p.labels, values.length);
    const total = values.reduce((a, b) => a + b, 0);
    const colors = segmentColors(p);
    const frames = Math.round(c.seconds * c.fps);
    const sweepEnd = Math.round(SWEEP_START + (p.sweep / 100) * frames);
    return [
      targetLine(c.target, "a report-style donut chart that sweeps in, with one accent segment, grey steps for the rest, a counting total and a legend", c.width, c.height, c.seconds),
      `Background: flat ${p.background}, no card, no gradient, no glow. Text ${p.ink}, secondary ${p.ink2}, labels ${p.ink3}, dividers ${p.line}, empty track ${p.fill}.`,
      `Type: Inter everywhere; Geist Mono with tabular figures only for numbers and tiny labels. Title "${p.title}" 44px weight 500, -0.035em. The centre total is 27% of the radius, weight 600, -0.045em. Tiny labels are 18px mono capitals at +0.12em in ${p.ink3}. Weights are 400/500/600 only, in sentence case.`,
      `Data and colours, clockwise from 12 o'clock: ${labels.map((l, i) => `${l} ${values[i]} (${colors[i]})`).join(", ")}. Total ${total}. Only the first segment uses the accent; the rest are flat greys.`,
      `Geometry at 16:9 (px at 1080 on the short side): donut centred at (600, 548) with outer radius 300 and ring thickness 48 (16% of the radius). Segments are filled ring sectors with straight 6px gutters, not stroked arcs. Before the sweep reaches it, the track is ${p.fill}. Title and legend sit on the right from x 1060, so the piece spans about 76% of the width.`,
      `Legend rows are 84px tall with a 1.5px ${p.line} divider. Each has a 16px round swatch; the label is 28px, weight 500 in ${p.ink} for the first row and 400 in ${p.ink2} for the rest; the value is 20px mono in ${p.ink3}; the share is 22px mono, weight 500. Centre: "TOTAL" in tiny mono over the counting total.`,
      `Motion at 30fps, ${frames} frames. Frames 0–22: the title fades in and rises 24px, ease enter ${bezierText("enter")}. Frames 2–26: the track and centre fade in.`,
      `Frames ${SWEEP_START}–${sweepEnd}: one sweep angle runs 0 → 360°, ease ${p.ease} ${bezierText(p.ease)}. Each segment fills only the part of the sweep it owns, with a square leading edge, and the total counts up with it.`,
      `Each legend row slides in 28px from the right over ${ROW_DUR} frames on enter from the frame the sweep reaches its segment, and its value and share count up while that segment fills.`,
      `Everything settles about 20 frames after the sweep ends; the last 12 frames are a completely still hold.`,
    ].join("\n");
  },
});
