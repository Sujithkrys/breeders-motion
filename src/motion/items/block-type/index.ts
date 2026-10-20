import { CANVAS, EASE_OPTIONS, FINAL_HOLD, STAGGER, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { BlockType, CROP, ENTER, LH, TRACK, TYPE_DELAY, WEIGHT, blockLayout, type BlockTypeProps } from "./BlockType";

// Block A is the look's canvas; block B is its ink inverse (Ink behind Paper and Stone, Paper behind Ink).
const palettes = systemPalettes((t) => {
  const inv = t.bg === CANVAS.ink.bg ? CANVAS.paper : CANVAS.ink;
  return { background: t.bg, textA: t.ink, blockB: inv.bg, textB: inv.ink, quietB: inv.ink2, accent: t.accent };
});

const DURATION = 150;
const px = (n: number, u: number) => Math.round(n / u);
const linesText = (lines: string[][]) => lines.map((l) => `"${l.join(" ")}"`).join(" / ");

export default defineMotion<BlockTypeProps>({
  slug: "block-type",
  name: "Block Type",
  description: "Four statements cut on a beat between a calm canvas and its ink inverse, with a giant cropped number and one accent word.",
  category: "text",
  tags: ["kinetic", "type", "cuts", "blocks", "launch"],
  addedAt: "2026-10-20",
  durationInFrames: DURATION,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: BlockType,
  defaultProps: {
    ...palettes[0].values,
    line1: "Ship a film",
    numberPre: "In",
    number: "30",
    numberUnit: "seconds.",
    line3: "No editor.",
    final: "Just one prompt.",
    accentWord: "prompt.",
    beat: 26,
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
    { type: "text", key: "accentWord", label: "Accent word", maxLength: 16 },
    { type: "color", key: "background", label: "Block A" },
    { type: "color", key: "accent", label: "Accent" },
    { type: "number", key: "beat", label: "Beat length", min: 24, max: 30, step: 1, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const L = blockLayout(c.width, c.height, p);
    const u = L.u;
    const b = Math.max(1, Math.round(p.beat));
    const total = Math.round(c.seconds * c.fps);
    const finalWords = Math.max(1, p.final.trim().split(/\s+/).filter(Boolean).length);
    const settled = 3 * b + TYPE_DELAY + STAGGER * (Math.min(finalWords, 8) - 1) + ENTER;
    const numPos = L.wide ? "right-aligned on the right safe line" : "left-aligned on the left safe line";
    const unitPos = L.wide ? "bottom-left, baseline on the bottom safe line" : "left-aligned, baseline 40px above the number's figure top";
    const e = `${p.ease} ${bezierText(p.ease)}`;
    return [
      targetLine(c.target, "four statements cut on a beat between a calm canvas and its ink inverse, set in large Inter", c.width, c.height, c.seconds),
      `Background: two flat full-frame blocks that alternate on hard cuts. Block A ${p.background} with ${p.textA} type; block B ${p.blockB} with ${p.textB} type and ${p.quietB} for quiet words. No gradients, glows, grain or shadows; one accent, ${p.accent}, on a single word at the very end.`,
      `Type: Inter ${WEIGHT}, sentence case exactly as typed, letter-spacing ${TRACK}em, line height ${LH}. Each statement breaks into 1–3 lines (an extra line only if it sets 20% larger) and is sized to fill the safe width, capped at ${px(L.maxSize, u)}px (px at 1080 on the short side).`,
      `Geometry: safe area ${px(L.padX, u)}px left/right, ${px(L.padY, u)}px top/bottom. Only the big number may cross it: its baseline sits below the frame so the bottom ${Math.round(CROP * 100)}% of the figures is cropped by the edge.`,
      `1) Frames 0–${b}, block A: ${linesText(L.s1.lines)} centred at ${px(L.s1.size, u)}px in ${p.textA}.`,
      `2) Frames ${b}–${2 * b}, block B: "${p.numberPre}" ${px(L.label, u)}px in ${p.quietB}, cap top on the top-left safe corner; a giant "${p.number}" at ${px(L.num, u)}px in ${p.textB}, tabular figures, ${numPos}; "${p.numberUnit}" ${px(L.label, u)}px in ${p.quietB}, ${unitPos}.`,
      `3) Frames ${2 * b}–${3 * b}, block A: ${linesText(L.s3.lines)} centred at ${px(L.s3.size, u)}px in ${p.textA}.`,
      `4) Frame ${3 * b} to the end, block B: ${linesText(L.fin.lines)} at ${px(L.fin.size, u)}px, left-aligned, baseline on the bottom-left safe corner. "${p.accentWord}" in ${p.accent}, every other word in ${p.textB}.`,
      "",
      `Motion: cut every ${b} frames with no transition. Each cut shows ${TYPE_DELAY} frame of empty block, then the type enters over ${ENTER} frames with ${e}, touching at most two properties:`,
      `- statement 1 scales 0.88 → 1 and fades in; statement 3 slides 80px in from the right and fades in.`,
      `- the number rises 45% of its visible height from below and counts up from 0 (zero-padded) over the same ${ENTER} frames; the lead-in fades up 24px with it and the unit follows ${2 * STAGGER} frames later.`,
      `- the final words fade up 30% of the type size one by one, ${STAGGER} frames apart. Everything is still from frame ${settled}; hold that frame to ${total} (at least the last ${FINAL_HOLD} frames).`,
    ].join("\n");
  },
});
