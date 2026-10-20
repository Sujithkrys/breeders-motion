import { EASE_OPTIONS, RADIUS, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { CFG, COMPACT_ROW, ContextWindow, HOVER_ROW, T, fmt1, fmtPct, fmtShort, geometry, normalise, themeFor, type ContextWindowProps } from "./ContextWindow";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  line: t.line,
  fill: t.fill,
  ink: t.ink,
  ink2: t.ink2,
  ink3: t.ink3,
  accent: t.accent,
  success: t.success,
}));

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
    ease: "enter",
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
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Background" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const g = geometry(ratio, 1);
    const k = CFG[ratio].k;
    const th = themeFor(p);
    const { total, vals, saved, used } = normalise(p);
    const labels = [p.label1, p.label2, p.label3, p.label4, p.label5];
    const px = (n: number) => `${r1(n * k)}px`;
    const N = g.cols * g.rows;
    const shadow = th.dark ? "no shadow" : "shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)";
    return [
      targetLine(c.target, `a "Context window" token-usage card for ${p.model}, with a dot grid that fills, inspects a row and compacts`, c.width, c.height, c.seconds),
      `Background: flat ${p.background}. Sizes are px at 1080 on the short side. No glows, no gradients.`,
      `Type: Inter for all UI, Geist Mono only for the model tag; numbers use tabular figures. Weights 400, 500 for labels and "New chat", 600 only for the big number. Hierarchy by grey: ${p.ink} → ${p.ink2} → ${p.ink3}.`,
      `Card, centred: an outer tray ${Math.round(g.W)}×${Math.round(g.H)} (radius ${RADIUS.card}px, fill ${th.tray}, 1px ${th.ring} ring, ${shadow}). Inset ${RADIUS.card - RADIUS.button}px inside it sits the ${p.card} card (radius ${RADIUS.button}px, 1px ${th.ring} ring); the tray's last ${px(52)} is the footer strip.`,
      `Header: "Context window" ${px(16.5)}/500 ${p.ink}. Right: a ${px(23)}-tall mono tag "${p.model}" (${px(12.5)}, ${p.ink2} on ${th.tagBg}, radius ${RADIUS.chip}px) led by a small 8-ray asterisk in ${th.spark}.`,
      `Big number: tokens used, ${px(34)}/600, -0.035em, ${p.ink}; after it "of ${fmtShort(total)} tokens" ${px(15)} ${p.ink2}; percent used right-aligned in ${p.ink2}.`,
      `Dot grid: ${g.cols}×${g.rows} round dots (${r1(g.dot)}px, ${r1(g.gap)}px gap, radius ${RADIUS.chip}px so they read as circles), filled row-major, one dot ≈ ${fmtShort(total / N)} tokens. Categories are greys plus the one accent: ${labels[0]} ${th.cats[0]}, ${labels[1]} ${th.cats[1]}, ${labels[2]} ${th.cats[2]}, ${labels[3]} ${th.cats[3]}, ${labels[4]} ${th.cats[4]} (accent tint); empty ${th.empty}. Draw each category as one SVG path.`,
      `Rows (${px(CFG[ratio].rowPitch)} pitch, ${px(15.5)} ${p.ink}): an ${px(8.5)} round legend dot, the label and a right-aligned value: ${labels.map((l, i) => `${l} ${fmt1(vals[i])}`).join(", ")}. "${labels[HOVER_ROW]}" has a small chevron; "${labels[COMPACT_ROW]}" has a "Compact" button (${px(13.5)} ${p.ink2}, collapse icon) left of its value. Footer (${px(14.5)}): "${fmtShort(total - used)} left" in ${p.ink2}; "New chat →" 500 ${p.ink}.`,
      "",
      `Frame ${T.fillA}–${T.fillB}: from empty, dots grow in row-major order (each scales 0 → 1 over a 5-dot lead), so the grid fills category by category while the big number and every row value count up to ${fmt1(used)}; ${p.ease} ${bezierText(p.ease)}.`,
      `Frame ${T.mv1A}–${T.mv1B}: an arrow cursor (${p.ink}, ${p.card} outline) travels to "${labels[HOVER_ROW]}" (travel ${bezierText("travel")}, paths bow slightly). Frame ${T.hovA}–${T.hovB}: the row gets a ${th.pill} pill (radius ${RADIUS.button}px), other categories fade to 16% and their rows turn ${p.ink2}, the big number tweens to ${fmt1(vals[HOVER_ROW])}, the footer reads "${labels[HOVER_ROW]} · ${fmtPct((vals[HOVER_ROW] / total) * 100)} of the window"; it reverses at frame ${T.hovOutA}–${T.hovOutB}. Text swaps are ${px(5)} blur crossfades.`,
      `Frame ${T.mv2A}–${T.mv2B}: the cursor travels to "Compact" and clicks at frame ${T.click1} (cursor scales to 0.88). A spinner and "Compacting…" appear; frame ${T.colA}–${T.colB}: the ${labels[COMPACT_ROW]} run shrinks and later dots reflow left, its value drops to ${fmt1(vals[COMPACT_ROW] - saved)} and the big number counts down to ${fmt1(used - saved)}. Frame ${T.doneA}–${T.doneB}: "✓ Compacted" and "Saved ${fmtShort(saved)} tokens" in ${p.success}.`,
      `Frame ${T.mv3A}–${T.mv3B}: the cursor travels to "New chat →" and clicks at frame ${T.click2}. Frame ${T.resetA}–${T.resetB}: the dots shrink away and every number counts back to 0 (exit ${bezierText("exit")}); frame ${T.mv4A}–${T.mv4B}: the cursor travels back to its rest point below the card. Frames ${T.mv4B}–180 are still and identical to frame 0, so the ${c.seconds}s loop is seamless.`,
    ].join("\n");
  },
});
