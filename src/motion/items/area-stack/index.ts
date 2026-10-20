import { EASE_OPTIONS, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { AreaStack, FILL_OPACITY, GROW_START, niceScale, parseNames, parseSeries, seriesColors, type AreaStackProps } from "./AreaStack";

// The bottom series takes the accent; the two above it are ink2 and ink3, all as flat low-opacity fills.
const palettes = systemPalettes((t) => ({
  background: t.bg,
  ink: t.ink,
  ink2: t.ink2,
  ink3: t.ink3,
  line: t.line,
  accent: t.accent,
}));

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default defineMotion<AreaStackProps>({
  slug: "area-stack",
  name: "Area Stack",
  description: "A three-series stacked area chart, one accent layer over two greys, grows in from the left behind a tracking edge.",
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
    ease: "travel",
  } as AreaStackProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title", maxLength: 32 },
    { type: "text", key: "names", label: "Series names (3)", maxLength: 60 },
    { type: "text", key: "seriesA", label: "Bottom series values", maxLength: 80 },
    { type: "text", key: "seriesB", label: "Middle series values", maxLength: 80 },
    { type: "text", key: "seriesC", label: "Top series values", maxLength: 80 },
    { type: "color", key: "accent", label: "Bottom series" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "reveal", label: "Grow length", min: 35, max: 60, step: 5, unit: "%" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const series = parseSeries(p.seriesA, p.seriesB, p.seriesC);
    const names = parseNames(p.names);
    const colors = seriesColors(p);
    const n = series[0].length;
    const totals = series[0].map((_, i) => series[0][i] + series[1][i] + series[2][i]);
    const { top, step } = niceScale(Math.max(...totals));
    const frames = Math.round(c.seconds * c.fps);
    const growEnd = Math.round(GROW_START + (p.reveal / 100) * frames);
    const pct = Math.round(FILL_OPACITY * 100);
    return [
      targetLine(c.target, "a report-style three-series stacked area chart that grows in from the left: one accent layer and two greys", c.width, c.height, c.seconds),
      `Background: flat ${p.background}, no card, no gradient, no glow. Text ${p.ink}, secondary ${p.ink2}, labels ${p.ink3}, gridlines ${p.line}. The only colour is ${p.accent}, on the bottom series.`,
      `Type: Inter everywhere; Geist Mono with tabular figures only for axis labels and numbers. Title "${p.title}" 44px weight 500, -0.035em, ${p.ink}. "${MONTHS[0]} – ${MONTHS[(n - 1) % 12]}" above it in 18px mono capitals at +0.12em, ${p.ink3}. Weights are 400/500/600 only, in sentence case.`,
      `Series, bottom to top: ${[0, 1, 2].map((k) => `${names[k]} (${colors[k]}) ${series[k].join(", ")}`).join("; ")}. Each is a comma-separated string prop, trimmed to the shortest.`,
      `Geometry at 16:9 (px at 1080 on the short side): 200px side margins, so the plot spans about 76% of the width. The legend sits at the top right, top series first. Each entry has a 14px round swatch, the name at 24px (the accent series at weight 500 in ${p.ink}, the others at 400 in ${p.ink2}) and the latest value counting up in 20px mono, ${p.ink3}.`,
      `The Y axis runs 0–${top} in steps of ${step}, with solid 1.5px gridlines in ${p.line} and a baseline in ${p.ink} at 20%. Tick and month labels are 18px mono in ${p.ink3}.`,
      `Each layer's top is a monotone cubic through its cumulative totals. Fill from the curve below to its own as a flat colour at ${pct}% opacity (no gradient), with a 2.5px stroke in the layer's full colour along its top edge.`,
      `Motion at 30fps, ${frames} frames. Frames 0–22: the title fades in and rises 24px, ease enter ${bezierText("enter")}. Gridlines draw left to right from frame 4 over 24 frames, 3 frames apart, and legend rows fade in and rise 12px from frame 10, 3 frames apart.`,
      `Frames ${GROW_START}–${growEnd}: a clip rect grows from the left edge, ease ${p.ease} ${bezierText(p.ease)}. Layers fade in bottom-first over 18 frames, 3 frames apart. A 1.5px ${p.ink} line at 25% rides the edge, with a 6px dot on each layer's top on a 2.5px ${p.background} ring. It fades out over frames ${growEnd}–${growEnd + 14} on exit ${bezierText("exit")}.`,
      `Everything settles by frame ${growEnd + 14}; the last 12 frames are a completely still hold.`,
    ].join("\n");
  },
});
