import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { LetterWave, WAVE, effectiveStagger, type LetterWaveProps } from "./LetterWave";

const palettes = [
  { name: "Indigo", swatch: ["#0E0B2E", "#8B7CFF", "#EEEBFF"], values: { background: "#0E0B2E", ink: "#EEEBFF", quiet: "#7C76B8", accent: "#8B7CFF" } },
  { name: "Sorbet", swatch: ["#FFE9DF", "#FF5A36", "#3A1406"], values: { background: "#FFE9DF", ink: "#3A1406", quiet: "#B07A64", accent: "#FF5A36" } },
  { name: "Lagoon", swatch: ["#031A1C", "#2EE6D0", "#E3FFFB"], values: { background: "#031A1C", ink: "#E3FFFB", quiet: "#5A8F8C", accent: "#2EE6D0" } },
  { name: "Plum", swatch: ["#1A0716", "#FF4FB8", "#FFE8F7"], values: { background: "#1A0716", ink: "#FFE8F7", quiet: "#946C88", accent: "#FF4FB8" } },
  { name: "Chalk", swatch: ["#F2F2F0", "#111111", "#9A9A96"], values: { background: "#F2F2F0", ink: "#111111", quiet: "#8A8A86", accent: "#B4B4AE" } },
];

export default defineMotion<LetterWaveProps>({
  slug: "letter-wave",
  name: "Letter Wave",
  description: "Headline letters rise in a tilted, overshooting wave, cooling from accent to ink as they land.",
  category: "text",
  tags: ["headline", "letters", "wave", "stagger", "bounce"],
  addedAt: "2026-09-08",
  durationInFrames: 120,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: LetterWave,
  defaultProps: {
    ...palettes[0].values,
    text: "Make it move",
    caption: "Motion that feels considered, not decorated.",
    stagger: 2,
    rotation: 12,
    ease: "bouncy",
  } as LetterWaveProps,
  palettes,
  controls: [
    { type: "text", key: "text", label: "Headline", maxLength: 24 },
    { type: "text", key: "caption", label: "Caption", maxLength: 56 },
    { type: "color", key: "accent", label: "Wave colour" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "stagger", label: "Letter stagger", min: 1, max: 5, step: 0.5, unit: "f" },
    { type: "number", key: "rotation", label: "Start tilt", min: 0, max: 24, step: 1, unit: "°" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const letters = p.text.replace(/\s+/g, "").length;
    const st = effectiveStagger(p.stagger, letters, Math.round(c.seconds * c.fps));
    const end = WAVE.start + Math.max(letters - 1, 0) * st + WAVE.dur;
    return [
      targetLine(c.target, `the headline "${p.text}" rising letter by letter in a wave`, c.width, c.height, c.seconds),
      `Background ${p.background}. Font Geist ${WAVE.base}px (shrink to fit 86% of the width; on 9:16 wrap by word at ${WAVE.baseVertical}px), weight 700, tracking -0.04em, centred.`,
      "Split the headline into one inline-block span per letter, keeping words together.",
      `Each letter starts 0.72em low, rotated ${p.rotation}° around its bottom centre, at 0 opacity with a 6px blur, and rises to rest over ${secs(WAVE.dur, c.fps)}.`,
      `Letters stagger ${Number(st.toFixed(2))} frames apart from frame ${WAVE.start}. Ease ${p.ease} ${bezierText(p.ease)}${p.ease === "bouncy" ? ", so each letter overshoots upward and settles" : ""}.`,
      `Colour: each letter is ${p.accent} for the first 45% of its move, then blends to ${p.ink} as it lands, so a band of colour travels with the wave.`,
      p.caption.trim()
        ? `Under it, the caption "${p.caption}": 40px, weight 400, tracking -0.012em, ${p.quiet}, fading up 18px as the wave finishes.`
        : "No caption.",
      `Everything settles by ${secs(end + 14, c.fps)}; hold to the end.`,
    ].join("\n");
  },
});
