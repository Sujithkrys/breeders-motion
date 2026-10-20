import { EASE_OPTIONS, FINAL_HOLD, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { SWAP, WordSwap, parseSwapWords, slotsFor, swapSize, type WordSwapProps } from "./WordSwap";

const palettes = systemPalettes((t) => ({ background: t.bg, ink: t.ink, fill: t.fill, accent: t.accent, onAccent: t.onAccent }));

const DURATION = 150;

export default defineMotion<WordSwapProps>({
  slug: "word-swap",
  name: "Word Swap",
  description: "A headline whose last word rolls through a flat pill that reshapes to fit each new word.",
  category: "text",
  tags: ["headline", "rotating", "pill", "loop", "hero"],
  addedAt: "2026-10-18",
  durationInFrames: DURATION,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: WordSwap,
  defaultProps: {
    ...palettes[0].values,
    accentPill: true,
    lead: "Build something",
    words: "fast, beautiful, yours",
    swap: 18,
    ease: "travel",
  } as WordSwapProps,
  palettes,
  controls: [
    { type: "text", key: "lead", label: "Lead", maxLength: 22 },
    { type: "text", key: "words", label: "Words (comma-separated)", maxLength: 48 },
    { type: "toggle", key: "accentPill", label: "Accent pill" },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "swap", label: "Swap length", min: 12, max: 24, step: 1, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const words = parseSwapWords(p.words);
    const list = words.length ? words : ["fast"];
    const n = list.length;
    const total = Math.round(c.seconds * c.fps);
    const slot = slotsFor(total, n);
    const u = Math.min(c.width, c.height) / 1080;
    const size = Math.round(swapSize(p.lead, list, c.width, c.height, u) / u);
    const wide = c.width > c.height;
    const pill = p.accentPill ? `flat ${p.accent} with the word in ${p.onAccent}` : `flat ${p.fill} (neutral fill) with the word in ${p.ink}`;
    const swaps = list.map((_, i) => `${Math.round((i + 1) * slot - p.swap)}–${Math.round((i + 1) * slot)}`).join(", ");
    return [
      targetLine(c.target, `"${p.lead}" followed by a rotating word inside a flat pill that morphs its width`, c.width, c.height, c.seconds),
      `Background: flat ${p.background}, nothing else on the canvas. Sizes are px at 1080 on the short side; type stays inside the safe area (${wide ? "96px left/right, 80px top/bottom" : "8% left/right, 7% top/bottom"}).`,
      `Type: Inter, sentence case, ${size}px, tracking ${SWAP.tracking}em, line height 1. "${p.lead}" in ${p.ink} at weight ${SWAP.leadWeight}; the rotating word at weight ${SWAP.wordWeight}.`,
      `Geometry: ${wide ? "the lead, a 0.26em gap, then the pill on one centred row" : "the lead centred, the pill centred 0.2em below it"}. Pill height ${SWAP.height}em, ${SWAP.padX}em side padding, fully rounded (999), overflow hidden, ${pill}. No gradient, glow, highlight or shadow.`,
      `Words in order: ${list.map((w) => `"${w}"`).join(", ")}, then back to "${list[0]}".`,
      "",
      `Motion: the first ${total - FINAL_HOLD} frames split into ${n} slots of ${Math.round(slot)} frames. Each word holds, then swaps over the last ${p.swap} frames of its slot (frames ${swaps}).`,
      `During a swap the old word slides up 105% and fades out (opacity 1 → 0 between 10% and 60% of the swap); the new word rises from 105% below and fades in (30% → 85%); both carry up to ${SWAP.blur}px of motion blur at mid-move.`,
      "The pill's width interpolates between the two words' widths. To morph without measuring, put an invisible zero-height sizer in the pill holding both words at font sizes (1 − t) × size and t × size.",
      `Ease ${p.ease}: ${bezierText(p.ease)}. The last swap lands back on "${list[0]}" at frame ${total - FINAL_HOLD}; hold it still for the final ${FINAL_HOLD} frames so the loop is seamless.`,
    ].join("\n");
  },
});
