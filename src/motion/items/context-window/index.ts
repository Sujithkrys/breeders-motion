import { EASE_OPTIONS, bezierText, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import {
  CFG,
  COMPACT_ROW,
  ContextWindow,
  HOVER_ROW,
  SAVED_GREEN,
  SPARK,
  T,
  fmt1,
  fmtPct,
  fmtShort,
  geometry,
  normalise,
  themeFor,
  type ContextWindowProps,
} from "./ContextWindow";

const palettes = [
  { name: "Soft", swatch: ["#F2F2EF", "#FFFFFF", "#2443FF"], values: { background: "#F2F2EF", card: "#FFFFFF", accent: "#2443FF" } },
  { name: "White", swatch: ["#FFFFFF", "#111214", "#0067FC"], values: { background: "#FFFFFF", card: "#FFFFFF", accent: "#0067FC" } },
  { name: "Ink", swatch: ["#0E0F12", "#16171A", "#0067FC"], values: { background: "#0E0F12", card: "#16171A", accent: "#0067FC" } },
  { name: "Cream", swatch: ["#F5F1E8", "#FFFFFF", "#2443FF"], values: { background: "#F5F1E8", card: "#FFFFFF", accent: "#2443FF" } },
];

const pct = (f: number) => `${Math.round((f / 180) * 100)}%`;
const r1 = (n: number) => Math.round(n * 10) / 10;

export default defineMotion<ContextWindowProps>({
  slug: "context-window",
  name: "Context Window",
  description: "A model's context-window card fills its token dot grid category by category, inspects Files on hover, then compacts the conversation to free tokens.",
  category: "charts",
  tags: ["ai", "tokens", "dot-grid", "usage", "dashboard", "loop"],
  addedAt: "2026-10-20",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: ContextWindow,
  defaultProps: {
    ...palettes[0].values,
    model: "claude-sonnet-5-5",
    total: 200,
    label1: "System prompt",
    label2: "Tools",
    label3: "Files",
    label4: "Conversation",
    label5: "Memory",
    value1: 4.2,
    value2: 12.8,
    value3: 46.1,
    value4: 108.6,
    value5: 3.9,
    saved: 78.2,
    ease: "smooth",
  } as ContextWindowProps,
  palettes,
  controls: [
    { type: "text", key: "model", label: "Model tag", maxLength: 24 },
    { type: "number", key: "total", label: "Window size", min: 100, max: 1000, step: 10, unit: "K" },
    { type: "text", key: "label1", label: "Row 1", maxLength: 16 },
    { type: "number", key: "value1", label: "Row 1 tokens", min: 0.5, max: 20, step: 0.1, unit: "K" },
    { type: "text", key: "label2", label: "Row 2", maxLength: 16 },
    { type: "number", key: "value2", label: "Row 2 tokens", min: 1, max: 40, step: 0.1, unit: "K" },
    { type: "text", key: "label3", label: "Row 3 (hovered)", maxLength: 16 },
    { type: "number", key: "value3", label: "Row 3 tokens", min: 5, max: 80, step: 0.1, unit: "K" },
    { type: "text", key: "label4", label: "Row 4 (compacts)", maxLength: 16 },
    { type: "number", key: "value4", label: "Row 4 tokens", min: 20, max: 150, step: 0.1, unit: "K" },
    { type: "text", key: "label5", label: "Row 5", maxLength: 16 },
    { type: "number", key: "value5", label: "Row 5 tokens", min: 0.5, max: 20, step: 0.1, unit: "K" },
    { type: "number", key: "saved", label: "Saved by Compact", min: 5, max: 120, step: 0.1, unit: "K" },
    { type: "color", key: "background", label: "Canvas" },
    { type: "color", key: "card", label: "Card" },
    { type: "color", key: "accent", label: "Accent" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const g = geometry(ratio, 1);
    const k = CFG[ratio].k;
    const th = themeFor(p.background, p.card, p.accent);
    const { total, vals, saved, used } = normalise(p);
    const labels = [p.label1, p.label2, p.label3, p.label4, p.label5];
    const px = (n: number) => `${r1(n * k)}px`;
    const N = g.cols * g.rows;
    return [
      targetLine(c.target, `a "Context window" token-usage card for ${p.model}, with a dot grid that fills, inspects a row and compacts`, c.width, c.height, c.seconds),
      `Canvas ${p.background}. Sizes are px at 1080 on the short side. Font Geist for all UI, Geist Mono only for the model tag; numbers use tabular figures. No glows, no gradients.`,
      `Card, centred and framed large: an outer tray ${Math.round(g.W)}×${Math.round(g.H)} (radius ${px(17)}, fill ${th.tray}, 1px ring ${th.trayRing}, shadow 0 ${px(1)} ${px(2)} ${th.shadowNear}, 0 ${px(8)} ${px(24)} ${th.shadow}). Inset ${px(4)} inside it sits the ${p.card} card (radius ${px(13)}, 1px ring ${th.cardRing}) with ${px(18)} padding; the tray's last ${px(52)} is the footer strip.`,
      `Header: "Context window" ${px(16.5)}/500, ${th.ink}. Right: a ${px(23)}-tall mono pill "${p.model}" (${px(12.5)}, ${th.sub} on ${th.tagBg}, radius ${px(6)}) led by a small 8-ray asterisk in ${SPARK}.`,
      `Big number: tokens used, Geist ${px(34)}/600, -0.035em tracking, ${th.ink}; after it "of ${fmtShort(total)} tokens" ${px(15)} ${th.sub}; percent used right-aligned in ${th.sub}.`,
      `Dot grid: ${g.cols}×${g.rows} rounded squares (${r1(g.dot)}px, ${r1(g.gap)}px gap, radius 26%), filled row-major, one dot ≈ ${fmtShort(total / N)} tokens. Colours: ${labels[0]} ${th.cats[0]}, ${labels[1]} ${th.cats[1]}, ${labels[2]} ${th.cats[2]}, ${labels[3]} ${p.accent}, ${labels[4]} ${th.cats[4]}, empty ${th.empty}. Draw each category as one SVG path.`,
      `Rows (${px(CFG[ratio].rowPitch)} pitch, ${px(15.5)} ${th.ink}): an ${px(8.5)} legend square, the label, and a right-aligned value — ${labels.map((l, i) => `${l} ${fmt1(vals[i])}`).join(", ")}. "${labels[HOVER_ROW]}" has a small chevron; "${labels[COMPACT_ROW]}" has a "Compact" button (${px(13.5)} ${th.sub}, collapse icon) left of its value.`,
      `Footer (${px(14.5)}): left "${fmtShort(total - used)} left" in ${th.sub}; right "New chat →" 500 ${th.ink}.`,
      `0–${pct(T.fillB)}: from empty, dots grow in row-major order (each scales 0→1 over a 5-dot lead), so the grid fills category by category while the big number and every row value count up to ${fmt1(used)}.`,
      `${pct(T.mv1A)}–${pct(T.hovOutB)}: a black arrow cursor glides to the "${labels[HOVER_ROW]}" row; it gets a ${th.pill} pill (radius ${px(8)}), the other categories' dots fade to 16% opacity and their rows turn ${th.sub}, the big number tweens to ${fmt1(vals[HOVER_ROW])} with "${labels[HOVER_ROW]}" beside it, and the footer reads "${labels[HOVER_ROW]} · ${fmtPct((vals[HOVER_ROW] / total) * 100)} of the window". Text swaps are ${px(5)} blur crossfades.`,
      `${pct(T.mv2A)}–${pct(T.doneB)}: the cursor clicks "Compact" at ${pct(T.click1)} (cursor scales to 0.88). A spinner and "Compacting…" appear, then the ${labels[COMPACT_ROW]} run shrinks from the end and later dots reflow left, its value drops to ${fmt1(vals[COMPACT_ROW] - saved)} and the big number counts down to ${fmt1(used - saved)}. It ends on "✓ Compacted" and "Saved ${fmtShort(saved)} tokens", both ${SAVED_GREEN}.`,
      `${pct(T.mv3A)}–100%: the cursor clicks "New chat →" at ${pct(T.click2)}; the dots shrink away in reverse, every number counts back to 0, the labels reset, and the cursor drifts back to its rest point below the card, so the loop is seamless.`,
      `All moves ease ${p.ease} ${bezierText(p.ease)}; cursor paths bow slightly. Loop ${c.seconds}s.`,
    ].join("\n");
  },
});
