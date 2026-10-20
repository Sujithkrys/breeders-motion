import { EASE_OPTIONS, bezierText, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { MARQUEE, TypeMarquee, parseWords, type TypeMarqueeProps } from "./TypeMarquee";

const palettes = [
  { name: "Magenta", swatch: ["#14061C", "#FF3DCB", "#FFF0FB"], values: { background: "#14061C", ink: "#FFF0FB", quiet: "#6E3B78", accent: "#FF3DCB" } },
  { name: "Volt", swatch: ["#0C0C0C", "#D7FF3A", "#F4F4F4"], values: { background: "#0C0C0C", ink: "#F4F4F4", quiet: "#3E3E3E", accent: "#D7FF3A" } },
  { name: "Paper", swatch: ["#FFF8E7", "#FF6A00", "#1E1A10"], values: { background: "#FFF8E7", ink: "#1E1A10", quiet: "#CDBF9C", accent: "#FF6A00" } },
  { name: "Jade", swatch: ["#04140F", "#2CF2A0", "#E6FFF5"], values: { background: "#04140F", ink: "#E6FFF5", quiet: "#2E6B57", accent: "#2CF2A0" } },
  { name: "Cobalt", swatch: ["#0A1030", "#7C8CFF", "#EEF1FF"], values: { background: "#0A1030", ink: "#EEF1FF", quiet: "#39427A", accent: "#7C8CFF" } },
];

// Linear first: a marquee is continuous motion, the one place the spec uses it.
const MOTION_OPTIONS = [{ label: "Linear", value: "linear" }, ...EASE_OPTIONS.filter((o) => o.value !== "linear")];

export default defineMotion<TypeMarqueeProps>({
  slug: "type-marquee",
  name: "Type Marquee",
  description: "Two rows of huge display words glide in opposite directions, split by accent stars, looping seamlessly.",
  category: "text",
  tags: ["marquee", "display", "kinetic", "loop", "ticker"],
  addedAt: "2026-09-22",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: TypeMarquee,
  defaultProps: {
    ...palettes[0].values,
    words: "Design, Motion, Launch, Repeat",
    laps: 1,
    tilt: -4,
    motion: "linear",
  } as TypeMarqueeProps,
  palettes,
  controls: [
    { type: "text", key: "words", label: "Words (comma-separated)", maxLength: 60 },
    { type: "color", key: "ink", label: "Words" },
    { type: "color", key: "accent", label: "Stars" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "laps", label: "Speed (laps)", min: 1, max: 3, step: 1 },
    { type: "number", key: "tilt", label: "Tilt", min: -8, max: 8, step: 1, unit: "°" },
    { type: "select", key: "motion", label: "Motion", options: MOTION_OPTIONS },
  ],
  prompt: (p, c) => {
    const words = parseWords(p.words);
    const motion =
      p.motion === "linear"
        ? "constant linear speed"
        : `each lap eased with ${p.motion} ${bezierText(p.motion)}, so the rows surge and glide to rest once per lap`;
    return [
      targetLine(c.target, "a two-row kinetic type marquee with rows moving in opposite directions", c.width, c.height, c.seconds),
      `Background ${p.background}. Font Geist, line height 1, tracking -0.045em.`,
      `Words, in order: ${words.map((w) => `"${w}"`).join(", ")}. Between every word sits a 4-point star (curved concave sides) in ${p.accent}, 0.34em wide, with 0.2em padding either side of each word.`,
      `Type size ${MARQUEE.size}px (${MARQUEE.sizeVertical}px on 9:16, with a third row). Rows are ${Math.round(MARQUEE.size * MARQUEE.rowGap)}px apart.`,
      `Row 1: weight 700 in ${p.ink}, moving left. Row 2: weight 600 in the quieter ${p.quiet}, moving right, with the word order rotated by two so words never stack.`,
      `Both rows sit in a band 150% of the frame width, rotated ${p.tilt}°, with the frame edges faded by a horizontal mask (transparent → black at 14% and 86% → transparent).`,
      "",
      "For a seamless loop, each row repeats its word-set at least 3 times in one flex strip and translates by exactly one set width (100% / copies of the strip).",
      `Each row travels ${p.laps} set${p.laps === 1 ? "" : "s"} per loop, ${motion}. The last frame matches the first.`,
    ].join("\n");
  },
});
