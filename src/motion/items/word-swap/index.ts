import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { SWAP, WordSwap, parseSwapWords, type WordSwapProps } from "./WordSwap";

const palettes = [
  { name: "Rose", swatch: ["#FFE6EE", "#FF3D7F", "#FF8A3D", "#B05CFF"], values: { background: "#FFE6EE", ink: "#2A0B17", pillInk: "#FFFFFF", pill1: "#FF3D7F", pill2: "#FF8A3D", pill3: "#B05CFF" } },
  { name: "Forest", swatch: ["#08140C", "#4ADE80", "#A3E635", "#2DD4BF"], values: { background: "#08140C", ink: "#EAF7EE", pillInk: "#06120A", pill1: "#4ADE80", pill2: "#A3E635", pill3: "#2DD4BF" } },
  { name: "Butter", swatch: ["#FFF6D6", "#FFC93C", "#FF9F43", "#2B2205"], values: { background: "#FFF6D6", ink: "#2B2205", pillInk: "#2B2205", pill1: "#FFC93C", pill2: "#FF9F43", pill3: "#F4E06B" } },
  { name: "Night", swatch: ["#0A0D1A", "#6366F1", "#0EA5E9", "#8B5CF6"], values: { background: "#0A0D1A", ink: "#EEF0FF", pillInk: "#FFFFFF", pill1: "#6366F1", pill2: "#0EA5E9", pill3: "#8B5CF6" } },
  { name: "Mono", swatch: ["#0C0C0D", "#FFFFFF", "#A1A1AA"], values: { background: "#0C0C0D", ink: "#F5F5F5", pillInk: "#0C0C0D", pill1: "#FFFFFF", pill2: "#D4D4D8", pill3: "#A1A1AA" } },
];

export default defineMotion<WordSwapProps>({
  slug: "word-swap",
  name: "Word Swap",
  description: "A headline whose last word rolls through a colour pill that reshapes to fit each new word.",
  category: "text",
  tags: ["headline", "rotating", "pill", "loop", "hero"],
  addedAt: "2026-10-18",
  durationInFrames: 150,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: WordSwap,
  defaultProps: {
    ...palettes[0].values,
    lead: "Build something",
    words: "fast, beautiful, yours",
    swap: 14,
    ease: "snappy",
  } as WordSwapProps,
  palettes,
  controls: [
    { type: "text", key: "lead", label: "Lead", maxLength: 22 },
    { type: "text", key: "words", label: "Words (comma-separated)", maxLength: 48 },
    { type: "color", key: "pill1", label: "Pill" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "swap", label: "Swap length", min: 8, max: 24, step: 1, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const words = parseSwapWords(p.words);
    const n = Math.max(words.length, 1);
    const slot = (c.seconds * c.fps) / n;
    const pills = [p.pill1, p.pill2, p.pill3];
    return [
      targetLine(c.target, `"${p.lead}" followed by a rotating word inside a pill that morphs its width`, c.width, c.height, c.seconds),
      `Background ${p.background}. Font Geist ${SWAP.base}px (shrink to fit 86% of the width), weight 600, tracking -0.04em, line height 1.`,
      `"${p.lead}" in ${p.ink}, then 0.3em gap and the pill (on 9:16 the pill sits below the lead).`,
      `Pill: height 1.24em, 0.38em side padding, fully rounded, overflow hidden, a 0 24px 60px glow in its own colour at 35% and a 2px white inner top highlight at 22%. Word text in ${p.pillInk}.`,
      `Words cycle in order: ${words.map((w, i) => `"${w}" on ${pills[i % 3]}`).join(", ")}, then back to the first.`,
      "",
      `Each word holds for ${secs(slot - p.swap, c.fps)}, then swaps over ${secs(p.swap, c.fps)}: the old word slides up 105% and fades out, the new one rises from 105% below and fades in, both with up to 5px of motion blur at mid-move.`,
      "During the swap the pill's background blends to the next colour and its width interpolates between the two words' widths.",
      "To morph width without measuring, put an invisible zero-height sizer in the pill holding both words at font sizes (1 − t) × size and t × size, each with its own -0.04em tracking.",
      `Ease ${p.ease} ${bezierText(p.ease)}. The last swap returns to the first word, so the loop is seamless.`,
    ].join("\n");
  },
});
