import { EASE_OPTIONS, bezierText, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { HeatmapGrid, parseMonths, parseWeeks, type HeatmapGridProps } from "./HeatmapGrid";

const palettes = [
  { name: "Rose", swatch: ["#14090E", "#24151B", "#FF5C8A"], values: { background: "#14090E", ink: "#FFF0F4", muted: "#A88A94", empty: "#24151B", cell: "#FF5C8A" } },
  { name: "Moss", swatch: ["#0A110C", "#17221A", "#4ADE80"], values: { background: "#0A110C", ink: "#EEFBEF", muted: "#87A08C", empty: "#17221A", cell: "#4ADE80" } },
  { name: "Amber", swatch: ["#130F08", "#241D12", "#FFB020"], values: { background: "#130F08", ink: "#FFF7E8", muted: "#A89A80", empty: "#241D12", cell: "#FFB020" } },
  { name: "Cloud", swatch: ["#F7F7F4", "#E8E8E3", "#7C3AED"], values: { background: "#F7F7F4", ink: "#17181B", muted: "#7D7F86", empty: "#E8E8E3", cell: "#7C3AED" } },
  { name: "Ice", swatch: ["#07111C", "#132131", "#38BDF8"], values: { background: "#07111C", ink: "#EAF4FF", muted: "#8296AD", empty: "#132131", cell: "#38BDF8" } },
  { name: "Graphite", swatch: ["#0E0E10", "#1C1C20", "#F5F5F6"], values: { background: "#0E0E10", ink: "#F5F5F6", muted: "#8A8A92", empty: "#1C1C20", cell: "#F5F5F6" } },
];

export default defineMotion<HeatmapGridProps>({
  slug: "heatmap-grid",
  name: "Heatmap Grid",
  description: "A contribution-style activity grid fills in a diagonal wave across a five-step colour scale.",
  category: "charts",
  tags: ["heatmap", "activity", "grid", "contributions", "wave"],
  addedAt: "2026-10-02",
  durationInFrames: 150,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: HeatmapGrid,
  defaultProps: {
    ...palettes[0].values,
    title: "Commits this season",
    values: "4,6,5,8,7,9,12,10,14,13,16,15,18,17,21,19,24,22,26,28",
    months: "Jun,Jul,Aug,Sep,Oct",
    wave: 2,
    ease: "spring",
  } as HeatmapGridProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title", maxLength: 32 },
    { type: "text", key: "values", label: "Weekly totals (8–22, comma-separated)", maxLength: 120 },
    { type: "text", key: "months", label: "Month labels", maxLength: 48 },
    { type: "color", key: "cell", label: "Cell colour" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "wave", label: "Wave delay", min: 1, max: 3, step: 0.25, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const weeks = parseWeeks(p.values);
    const months = parseMonths(p.months);
    const total = weeks.reduce((a, b) => a + b, 0);
    return [
      targetLine(c.target, `a contribution-style heatmap of 7 days × ${weeks.length} weeks that fills in a diagonal wave`, c.width, c.height, c.seconds),
      `Background ${p.background}. Font Geist; labels in Geist Mono. Text ${p.ink}, secondary ${p.muted}.`,
      `Weekly totals (comma-separated prop): ${weeks.join(", ")}; total ${total}. Month labels ${months.join(", ")} spaced evenly along the weeks.`,
      "",
      `Header: mono uppercase "LAST ${weeks.length} WEEKS" (20px, 0.14em) over the title "${p.title}" (68px, weight 650, -0.04em); on the right "TOTAL" and the total at 84px in ${p.cell}, counting up while the grid fills.`,
      `Grid at 16:9: weeks as columns, days as rows, 66px pitch, cells 82% of the pitch with 22% radius; at 9:16 the grid is transposed (days across, weeks down). Mon/Wed/Fri labels in 19px mono.`,
      `Cell level 0–4 = round(week total / max × day factor × 4 + seeded noise ±0.8); day factors Mon–Sun 1, 1.08, 1.04, 0.98, 0.9, 0.55, 0.45; ~7% of cells empty. Use a seeded random so it never changes.`,
      `Five-step scale: level 0 ${p.empty}, levels 1–4 ${p.cell} at 24%, 46%, 72% and 100% opacity. A "Less ▢▢▢▢▢ More" key sits under the grid's right edge.`,
      `Wave: cell (week w, day d) starts at 0.6s + (w + d) × ${p.wave} frames and grows from 35% to full size while fading in over 14 frames, ease ${p.ease} ${bezierText(p.ease)}.`,
      "The wave is compressed if needed so every cell lands by 70% of the duration; hold the finished grid.",
    ].join("\n");
  },
});
