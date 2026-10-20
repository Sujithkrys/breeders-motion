import { EASE_OPTIONS, STAGGER, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { CARD_START, RISE, StatCards, parseCards, type StatCardsProps } from "./StatCards";

// White cards on the canvas; grey sparklines with the accent only on the hero card; state colours only on delta chips.
const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  line: t.line,
  ink: t.ink,
  ink2: t.ink2,
  ink3: t.ink3,
  accent: t.accent,
  success: t.success,
  error: t.error,
}));

export default defineMotion<StatCardsProps>({
  slug: "stat-cards",
  name: "Stat Cards",
  description: "Three KPI cards rise in as their numbers count up, delta chips fade in and quiet sparklines draw on.",
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
    stagger: STAGGER,
    ease: "spring",
  } as StatCardsProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title", maxLength: 32 },
    { type: "text", key: "values", label: "Values (3, comma-separated)", maxLength: 48 },
    { type: "text", key: "deltas", label: "Changes in % (3)", maxLength: 32 },
    { type: "text", key: "labels", label: "Labels (3)", maxLength: 60 },
    { type: "color", key: "accent", label: "Hero sparkline" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "stagger", label: "Stagger", min: 2, max: 6, step: 1, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const cards = parseCards(p.labels, p.values, p.deltas);
    const frames = Math.round(c.seconds * c.fps);
    const lastStart = CARD_START + 2 * p.stagger;
    return [
      targetLine(c.target, "three KPI cards that rise in with counting numbers, delta chips and quiet sparklines", c.width, c.height, c.seconds),
      `Background: flat ${p.background}. Cards are ${p.card} with a 1.5px ${p.line} border and a near-invisible shadow (0 1px 2px and 0 8px 24px of ${p.ink} at 4% and 6%; none on a dark canvas). There are no gradients and no glow.`,
      `Type: Inter everywhere; Geist Mono with tabular figures only for chips and tiny labels. "KEY METRICS" is 18px mono capitals at +0.12em in ${p.ink3}, over the title "${p.title}" at 44px weight 500, -0.035em, ${p.ink}. Card labels are 26px weight 500 in ${p.ink2}. Values are 76px weight 500, -0.045em, ${p.ink}, with tabular figures. Weights are 400/500/600 only, in sentence case.`,
      `Cards: ${cards.map((k) => `"${k.label}" ${k.stat.prefix}${k.stat.n}${k.stat.suffix} (${k.delta >= 0 ? "+" : ""}${k.delta}%)`).join(", ")}. Parse values like "$128.4k" into prefix, number, decimals and suffix so the count-up keeps the format.`,
      `Geometry at 16:9 (px at 1080 on the short side): 220px side margins, three cards in a row with 32px gaps (about 77% of the width), 400px tall, 32px radius, 40px padding. At 9:16 and 1:1 they stack as wide rows with the sparkline on the right at 40% of the card width.`,
      `Delta chip: a small triangle arrow and "+12%" in 18px mono, weight 500, ${p.success} for gains and ${p.error} for drops, on a 12% tint of that colour, 8px radius.`,
      `Sparkline: a 14-point deterministic random walk trending with the delta, with a 2.5px stroke, round joins, a flat 8% fill beneath and a 5px dot riding the tip on a 2.5px ${p.card} ring. The first (hero) card's sparkline is ${p.accent}; the other two are ${p.ink3}.`,
      `Motion at 30fps, ${frames} frames. Frames 0–22: the header fades in and rises 24px, ease enter ${bezierText("enter")}.`,
      `Card i starts at frame ${CARD_START} + i × ${p.stagger}. It fades in and rises 40px over ${RISE} frames, ease ${p.ease} ${bezierText(p.ease)}. Its number counts up from frame +6 to +50 on enter. Its sparkline draws on with strokeDashoffset from +12 to +58 on travel ${bezierText("travel")}. Its chip fades in and rises 8px from +30 to +50.`,
      `Everything settles by frame ${lastStart + 58}; the last 12 frames are a completely still hold.`,
    ].join("\n");
  },
});
