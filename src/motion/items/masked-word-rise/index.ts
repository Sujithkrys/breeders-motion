import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { MaskedWordRise, RISE, type MaskedWordRiseProps } from "./MaskedWordRise";

const palettes = [
  { name: "Tangerine", swatch: ["#FF5B1F", "#1C0A02", "#FFF1E6"], values: { background: "#FF5B1F", ink: "#1C0A02", quiet: "#8E3410", accent: "#FFF1E6" } },
  { name: "Lime", swatch: ["#0D1207", "#C6F432", "#F2FFE0"], values: { background: "#0D1207", ink: "#F2FFE0", quiet: "#7E8F66", accent: "#C6F432" } },
  { name: "Lilac", swatch: ["#F1ECFF", "#7C4DFF", "#1B1235"], values: { background: "#F1ECFF", ink: "#1B1235", quiet: "#8A80A8", accent: "#7C4DFF" } },
  { name: "Cherry", swatch: ["#1A0509", "#FF3B5C", "#FFE9EC"], values: { background: "#1A0509", ink: "#FFE9EC", quiet: "#9A6A72", accent: "#FF3B5C" } },
  { name: "Harbour", swatch: ["#07121F", "#4CC3FF", "#EAF3FF"], values: { background: "#07121F", ink: "#EAF3FF", quiet: "#6E829C", accent: "#4CC3FF" } },
  { name: "Graphite", swatch: ["#0E0E10", "#A1A1AA", "#F5F5F7"], values: { background: "#0E0E10", ink: "#F5F5F7", quiet: "#6B6B73", accent: "#D4D4D8" } },
];

export default defineMotion<MaskedWordRiseProps>({
  slug: "masked-word-rise",
  name: "Masked Word Rise",
  description: "A two-line headline rises word by word out of its masks, de-blurring as it lands.",
  category: "text",
  tags: ["headline", "mask", "reveal", "blur", "launch"],
  addedAt: "2026-10-16",
  durationInFrames: 120,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: MaskedWordRise,
  defaultProps: {
    ...palettes[0].values,
    eyebrow: "New in 4.0",
    line1: "Motion that ships.",
    line2: "Built for launch day.",
    stagger: 7,
    ease: "enter",
  } as MaskedWordRiseProps,
  palettes,
  controls: [
    { type: "text", key: "eyebrow", label: "Eyebrow", maxLength: 28 },
    { type: "text", key: "line1", label: "Line 1", maxLength: 26 },
    { type: "text", key: "line2", label: "Line 2", maxLength: 26 },
    { type: "color", key: "ink", label: "Headline" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "stagger", label: "Line stagger", min: 2, max: 16, step: 1, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const l2 = RISE.start + p.stagger;
    const lastWord = (line: string, start: number) => start + (Math.max(line.trim().split(/\s+/).length, 1) - 1) * RISE.wordGap + RISE.wordDur;
    const end = Math.max(lastWord(p.line1, RISE.start), lastWord(p.line2, l2));
    return [
      targetLine(c.target, "a two-line headline where every word rises out of its line's mask", c.width, c.height, c.seconds),
      `Background ${p.background}, with a soft ${p.accent} radial glow (14% opacity) behind the type. Font Geist, centred.`,
      `Line 1 "${p.line1}": ${RISE.base}px (shrink to fit 80% of the width), weight 650, tracking -0.042em, colour ${p.ink}.`,
      `Line 2 "${p.line2}": same size, weight 400, tracking -0.035em, quieter colour ${p.quiet}. Line height 1.04.`,
      p.eyebrow.trim()
        ? `Above them, a pill eyebrow "${p.eyebrow}": Geist Mono 24px uppercase, 0.14em tracking, ${p.quiet} text, 1.5px hairline border, a 12px ${p.accent} dot with a glow; it fades up 16px over the first 0.7s.`
        : "No eyebrow.",
      "",
      "Each line sits in its own overflow-hidden mask (padding below for descenders).",
      `Every word starts 112% below its mask with an ${RISE.blur}px blur at 0 opacity and rises to rest, blur → 0, over ${secs(RISE.wordDur, c.fps)}.`,
      `Words inside a line stagger by ${RISE.wordGap} frames. Line 1 starts at frame ${RISE.start}, line 2 at frame ${l2} (${p.stagger}-frame line stagger).`,
      `Ease ${p.ease} ${bezierText(p.ease)}. The whole block settles from scale 0.97 to 1 over 3.2s.`,
      `Everything has landed by ${secs(end, c.fps)}; hold the final frame to the end.`,
    ].join("\n");
  },
});
