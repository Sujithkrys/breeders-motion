import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { BlockType, CROP, LH, SLAM, TRACK, TYPE_DELAY, blockLayout, type BlockTypeProps } from "./BlockType";

// Flat colour only. Block A carries beats 1 and 3, block B beats 2 and 4; the accent sits on block B.
const palettes = [
  {
    name: "Breeders",
    swatch: ["#0067FC", "#FFFFFF", "#0E0F12"],
    values: { background: "#0067FC", textA: "#FFFFFF", blockB: "#FFFFFF", textB: "#0E0F12", accentColor: "#0067FC" },
  },
  {
    name: "Electric",
    swatch: ["#2443FF", "#FAFAF8", "#0E0F12"],
    values: { background: "#2443FF", textA: "#FFFFFF", blockB: "#FAFAF8", textB: "#0E0F12", accentColor: "#2443FF" },
  },
  {
    name: "Ink + Lime",
    swatch: ["#FFFFFF", "#0E0F12", "#E3F79C"],
    values: { background: "#FFFFFF", textA: "#0E0F12", blockB: "#0E0F12", textB: "#FFFFFF", accentColor: "#E3F79C" },
  },
  {
    name: "Coral",
    swatch: ["#FF5A1F", "#F5F1E8", "#0E0F12"],
    values: { background: "#FF5A1F", textA: "#F5F1E8", blockB: "#F5F1E8", textB: "#0E0F12", accentColor: "#FF5A1F" },
  },
];

const px = (n: number, u: number) => Math.round(n / u);
const linesText = (lines: string[][]) => lines.map((l) => `"${l.join(" ")}"`).join(" / ");

export default defineMotion<BlockTypeProps>({
  slug: "block-type",
  name: "Block Type",
  description: "Four statements hard-cut on a beat, each a flat full-frame colour block with heavy type that slams in and a giant cropped number.",
  category: "text",
  tags: ["kinetic", "type", "cuts", "blocks", "launch"],
  addedAt: "2026-10-20",
  durationInFrames: 150,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: BlockType,
  defaultProps: {
    ...palettes[0].values,
    line1: "SHIP A FILM",
    numberPre: "IN",
    number: "30",
    numberUnit: "SECONDS.",
    line3: "NO EDITOR.",
    final: "JUST ONE PROMPT.",
    accent: "PROMPT.",
    beat: 24,
    ease: "enter",
  } as BlockTypeProps,
  palettes,
  controls: [
    { type: "text", key: "line1", label: "Statement 1", maxLength: 24 },
    { type: "text", key: "numberPre", label: "Number lead-in", maxLength: 10 },
    { type: "text", key: "number", label: "Big number", maxLength: 4 },
    { type: "text", key: "numberUnit", label: "Number unit", maxLength: 14 },
    { type: "text", key: "line3", label: "Statement 3", maxLength: 24 },
    { type: "text", key: "final", label: "Final statement", maxLength: 28 },
    { type: "text", key: "accent", label: "Accent word", maxLength: 16 },
    { type: "color", key: "background", label: "Block A" },
    { type: "color", key: "textA", label: "Type on A" },
    { type: "color", key: "blockB", label: "Block B" },
    { type: "color", key: "textB", label: "Type on B" },
    { type: "color", key: "accentColor", label: "Accent" },
    { type: "number", key: "beat", label: "Beat length", min: 18, max: 30, step: 1, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const L = blockLayout(c.width, c.height, p);
    const u = L.u;
    const b = Math.max(1, Math.round(p.beat));
    const hold = Math.round(c.seconds * c.fps) - 3 * b;
    const type = `Geist weight 800, letter-spacing ${TRACK}em, line-height ${LH}`;
    const numPos = L.wide ? `right-aligned ${px(L.padX * 0.6, u)}px from the right edge` : `left-aligned on the safe line`;
    const unitPos = L.wide ? `bottom-left with its baseline on the bottom safe line` : `left-aligned with its baseline 40px above the number's cap top`;
    return [
      targetLine(c.target, "four statements hard-cut on a beat, each a flat full-frame colour block with heavy display type that slams in", c.width, c.height, c.seconds),
      `All type ${type}, set exactly as typed. Flat colour only: no gradients, glows, grain or bokeh. Safe area ${px(L.padX, u)}px left/right, ${px(L.padY, u)}px top/bottom (px at 1080 on the short side).`,
      `Fit rule: break each statement into 1–3 lines (an extra line only if it sets 20% larger) and size it to fill the safe width, capped at ${px(L.maxSize, u)}px.`,
      `Cut every ${b} frames (${secs(b, c.fps)}), hard cuts with no transition. Each cut shows ${TYPE_DELAY} frame of empty block, then the type slams in over ${SLAM} frames with ${p.ease} ${bezierText(p.ease)}, overshoots 5–7% on a sine and settles by frame ${Math.round(SLAM * 1.5) + TYPE_DELAY}; blur 14px → 0 and two fading ghost copies trail the move. The whole frame settles from scale 1.025 and drifts in 2% per beat.`,
      `1) 0–${b}f, block A ${p.background}: ${linesText(L.s1.lines)} in ${p.textA}, centred, ${px(L.s1.size, u)}px; scales 1.55 → 1.`,
      `2) ${b}–${2 * b}f, block B ${p.blockB}, type ${p.textB}: "${p.numberPre}" ${px(L.label, u)}px top-left (cap top on the safe line); a giant "${p.number}" ${px(L.num, u)}px ${numPos}; "${p.numberUnit}" ${px(L.label, u)}px in ${p.accentColor}, ${unitPos}.`,
      `   The number's baseline sits below the frame so the bottom ${Math.round(CROP * 100)}% of the digits is cropped by the edge; it rises from below and counts up from 0 (tabular figures, zero-padded) over ${secs(Math.max(8, Math.round(b * 0.55)), c.fps)}. The unit lands 3 frames after the number.`,
      `3) ${2 * b}–${3 * b}f, block A ${p.background}: ${linesText(L.s3.lines)} in ${p.textA}, centred, ${px(L.s3.size, u)}px; slides in from 42% of the width to the right.`,
      `4) ${3 * b}f to the end (${secs(hold, c.fps)} hold), block B ${p.blockB}: ${linesText(L.fin.lines)} at ${px(L.fin.size, u)}px, left-aligned and anchored bottom-left on the safe area. "${p.accent}" in ${p.accentColor}, every other word in ${p.textB}.`,
      `   Words slam up one by one 2 frames apart (rise 50% of the type size, scale 1.2 → 1 from their bottom-left), then the frame pushes in 3% from the bottom-left corner until the end.`,
    ].join("\n");
  },
});
