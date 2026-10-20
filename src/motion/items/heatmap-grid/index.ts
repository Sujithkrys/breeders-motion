import { EASE_OPTIONS, RADIUS, STAGGER, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { HEAT, HeatmapGrid, STEPS, heatLayout, isDarkHex, parseMonths, parseWeeks, stepColor, waveTiming, type HeatmapGridProps } from "./HeatmapGrid";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  line: t.line,
  fill: t.fill,
  ink: t.ink,
  ink2: t.ink2,
  ink3: t.ink3,
  accent: t.accent,
}));

const r0 = (n: number) => Math.round(n);

export default defineMotion<HeatmapGridProps>({
  slug: "heatmap-grid",
  name: "Heatmap Grid",
  description: "A contribution-style activity card fills in a diagonal wave across a five-step scale from grey to the accent.",
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
    wave: STAGGER,
    ease: "spring",
  } as HeatmapGridProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title", maxLength: 32 },
    { type: "text", key: "values", label: "Weekly totals (8–22, comma-separated)", maxLength: 120 },
    { type: "text", key: "months", label: "Month labels", maxLength: 48 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "wave", label: "Wave delay", min: 1, max: 3, step: 0.5, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const weeks = parseWeeks(p.values);
    const months = parseMonths(p.months);
    const total = weeks.reduce((a, b) => a + b, 0);
    const n = weeks.length;
    const L = heatLayout(c.width, c.height, n);
    const px = (v: number) => `${r0(v / L.u)}px`;
    const dur = Math.round(c.seconds * c.fps);
    const { w, doneAt } = waveTiming(n, p.wave, dur);
    const legendA = r0(doneAt - HEAT.legendLead);
    const shadow = isDarkHex(p.background) ? "no shadow" : "shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)";
    const steps = STEPS.map((_, l) => stepColor(p.fill, p.accent, l));
    return [
      targetLine(c.target, `a contribution-style activity card, 7 days × ${n} weeks, whose cells fill in a diagonal wave`, c.width, c.height, c.seconds),
      `Background: flat ${p.background}, no gradient or texture. Sizes are px at 1080 on the short side.`,
      `Type: Inter for everything; Geist Mono only for the tiny caps labels. Weights 400 and 600 only. Mono labels "LAST ${n} WEEKS" and "TOTAL": 18px, +0.12em tracking, uppercase, ${p.ink3}. Title "${p.title}": 44px, weight 400, -0.035em, ${p.ink}. Total ${total.toLocaleString("en-US")}: 72px, weight 600, -0.045em, tabular figures, ${p.ink}. Month labels (${months.join(", ")}) 19px ${p.ink2}; Mon/Wed/Fri 19px ${p.ink3}; legend "Less … More" 18px ${p.ink3}.`,
      `Card: ${px(L.cardW)}×${px(L.cardH)}, centred, fill ${p.card}, 1px ${p.line} border, radius ${RADIUS.card}px, ${shadow}, padding ${px(L.pad)}. Header row on top (title block left, total right${L.vertical ? "; stacked at 9:16" : ""}).`,
      `Grid: ${L.vertical ? "days across, weeks down" : "weeks as columns, days as rows"}, ${px(L.pitch)} pitch, cells 84% of the pitch with radius ${RADIUS.chip}px. Month labels sit ${L.vertical ? "left of the rows" : "above the columns"}, spaced evenly along the weeks.`,
      `Cell level 0–4 = round(week total / max × day factor × 4 + seeded noise ±0.8); day factors Mon–Sun 1, 1.08, 1.04, 0.98, 0.9, 0.55, 0.45; ~7% of cells empty; seeded random so it never changes. Weekly totals: ${weeks.join(", ")}.`,
      `Colour scale: one hue only, mixed from the empty grey to the accent: ${steps.join(" → ")} (0%, 25%, 50%, 75%, 100% of ${p.accent} over ${p.fill}). The legend under the grid's right edge shows the five swatches (24px, radius ${RADIUS.chip}px).`,
      "",
      `Frame 0–${HEAT.cardIn}: the card fades in and rises 24px, enter ${bezierText("enter")}. Frame ${HEAT.headA}–${HEAT.headB}: the header fades up 16px; frame ${HEAT.labelsA}–${HEAT.labelsB}: axis labels fade in, both enter.`,
      `From frame ${HEAT.start}: cell (week w, day d) starts at ${HEAT.start} + (w + d) × ${Number(w.toFixed(2))} frames and grows from 35% to full size while fading in over ${HEAT.cell} frames, ${p.ease} ${bezierText(p.ease)}. The total counts up from 0 over frames ${HEAT.start}–${r0(doneAt)} (enter).`,
      `Frame ${legendA}–${legendA + HEAT.legendIn}: the legend fades in (enter). Everything is still from frame ${dur - 12} to ${dur}; hold the finished card.`,
    ].join("\n");
  },
});
