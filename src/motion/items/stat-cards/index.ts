import { EASE_OPTIONS, bezierText, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { StatCards, parseCards, type StatCardsProps } from "./StatCards";

const palettes = [
  {
    name: "Citrus",
    swatch: ["#0D0E0B", "#16180F", "#C6F432"],
    values: { background: "#0D0E0B", card: "#16180F", border: "#262A1C", ink: "#F4F7EC", muted: "#8E9581", accent: "#C6F432", pos: "#C6F432", neg: "#FF7A6B" },
  },
  {
    name: "Linen",
    swatch: ["#F3EFE7", "#FFFFFF", "#E4572E"],
    values: { background: "#F3EFE7", card: "#FFFFFF", border: "#E6E0D4", ink: "#1A1814", muted: "#857E72", accent: "#E4572E", pos: "#12945C", neg: "#D9452B" },
  },
  {
    name: "Abyss",
    swatch: ["#04141A", "#0A2129", "#22D3EE"],
    values: { background: "#04141A", card: "#0A2129", border: "#143540", ink: "#E6FBFF", muted: "#7FA2AB", accent: "#22D3EE", pos: "#34D399", neg: "#FB7185" },
  },
  {
    name: "Rosewood",
    swatch: ["#170914", "#22101D", "#FF4FA3"],
    values: { background: "#170914", card: "#22101D", border: "#3A1C32", ink: "#FFEFF8", muted: "#B08AA2", accent: "#FF4FA3", pos: "#5EE6A0", neg: "#FF8A65" },
  },
  {
    name: "Graphite",
    swatch: ["#0E0E10", "#18181B", "#F5F5F6"],
    values: { background: "#0E0E10", card: "#18181B", border: "#2A2A2F", ink: "#F5F5F6", muted: "#8A8A92", accent: "#F5F5F6", pos: "#4ADE80", neg: "#F87171" },
  },
];

export default defineMotion<StatCardsProps>({
  slug: "stat-cards",
  name: "Stat Cards",
  description: "Three KPI cards rise in as their numbers count up, delta chips pop and sparklines draw on.",
  category: "charts",
  tags: ["kpi", "dashboard", "sparkline", "count-up", "metrics"],
  addedAt: "2026-10-18",
  durationInFrames: 150,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: StatCards,
  defaultProps: {
    ...palettes[0].values,
    title: "Q3 at a glance",
    labels: "Revenue,Active users,Retention",
    values: "$128.4k,48210,92.4%",
    deltas: "12,8.5,-2.1",
    stagger: 8,
    ease: "smooth",
  } as StatCardsProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title", maxLength: 32 },
    { type: "text", key: "values", label: "Values (3, comma-separated)", maxLength: 48 },
    { type: "text", key: "deltas", label: "Changes in % (3)", maxLength: 32 },
    { type: "text", key: "labels", label: "Labels (3)", maxLength: 60 },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "stagger", label: "Stagger", min: 4, max: 14, step: 1, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const cards = parseCards(p.labels, p.values, p.deltas);
    return [
      targetLine(c.target, "three KPI cards that rise in with counting numbers, delta chips and sparklines", c.width, c.height, c.seconds),
      `Background ${p.background}. Font Geist; numbers in Geist Mono or tabular figures. Text ${p.ink}, labels ${p.muted}.`,
      `Cards: ${cards.map((k) => `"${k.label}" ${k.stat.prefix}${k.stat.n}${k.stat.suffix} (${k.delta >= 0 ? "+" : ""}${k.delta}%)`).join(", ")}. Parse values like "$128.4k" into prefix, number, decimals and suffix so the count-up keeps the format.`,
      "",
      `Header: mono uppercase "KEY METRICS" (20px, 0.14em) over the title "${p.title}" (64px, weight 650, -0.04em).`,
      `At 16:9 the cards sit in a row, 536×460 each with 36px gaps; at 9:16 and 1:1 they stack as wide rows with the sparkline on the right. Card ${p.card}, 1.5px ${p.border} border, radius 30, padding 44, shadow 0 24px 60px rgba(0,0,0,0.22).`,
      `Inside: label 28px weight 500, value 84px weight 650 (-0.045em), and a pill delta chip: triangle arrow + "+12%", ${p.pos} for gains and ${p.neg} for drops on a 14% tint of that colour.`,
      `Sparkline: a 14-point deterministic random walk trending with the delta, 3.5px ${p.accent} stroke with round joins, a ${p.accent} 28% → 0 area fill and a 6.5px dot riding the tip.`,
      "",
      `Card i starts at 0.4s + i × ${p.stagger} frames: rises 70px and scales 0.96 → 1 over 0.87s with ease ${p.ease} ${bezierText(p.ease)}.`,
      "Its number counts up from 0 over 1.5s starting 0.2s later, the sparkline draws on with strokeDashoffset from 0.4s over 1.5s, and the chip pops in at 1.1s.",
      "Everything settles by 70% of the duration; hold the final state.",
    ].join("\n");
  },
});
