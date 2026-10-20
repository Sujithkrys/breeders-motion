import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { HighlightSweep, SWEEP, findMarks, splitLines, type HighlightSweepProps } from "./HighlightSweep";

const palettes = [
  { name: "Paper", swatch: ["#F6F1E7", "#FFE45C", "#FF9EC7"], values: { background: "#F6F1E7", ink: "#1A1714", markInk: "#1A1714", mark1Color: "#FFE45C", mark2Color: "#FF9EC7" } },
  { name: "Night", swatch: ["#0E0F14", "#C6F432", "#7DD3FC"], values: { background: "#0E0F14", ink: "#F2F2F5", markInk: "#0E0F14", mark1Color: "#C6F432", mark2Color: "#7DD3FC" } },
  { name: "Mint", swatch: ["#EAF7F0", "#7EF2C0", "#FFD166"], values: { background: "#EAF7F0", ink: "#0F2A1E", markInk: "#0F2A1E", mark1Color: "#7EF2C0", mark2Color: "#FFD166" } },
  { name: "Berry", swatch: ["#1B0A16", "#FF7AC6", "#FFB86B"], values: { background: "#1B0A16", ink: "#FFEAF6", markInk: "#1B0A16", mark1Color: "#FF7AC6", mark2Color: "#FFB86B" } },
  { name: "Ink", swatch: ["#FFFFFF", "#111111", "#6B6B6B"], values: { background: "#FFFFFF", ink: "#111111", markInk: "#FFFFFF", mark1Color: "#111111", mark2Color: "#5E5E62" } },
];

export default defineMotion<HighlightSweepProps>({
  slug: "highlight-sweep",
  name: "Highlight Sweep",
  description: "A three-line statement where marker highlights sweep behind two key words in turn.",
  category: "text",
  tags: ["highlight", "marker", "quote", "emphasis", "editorial"],
  addedAt: "2026-09-15",
  durationInFrames: 150,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: HighlightSweep,
  defaultProps: {
    ...palettes[0].values,
    text: "Great products are / simple to use and / obvious in hindsight.",
    mark1: "simple",
    mark2: "obvious",
    sweep: 16,
    ease: "smooth",
  } as HighlightSweepProps,
  palettes,
  controls: [
    { type: "text", key: "text", label: "Text (/ for new line)", maxLength: 90 },
    { type: "text", key: "mark1", label: "Highlight 1", maxLength: 24 },
    { type: "text", key: "mark2", label: "Highlight 2", maxLength: 24 },
    { type: "color", key: "mark1Color", label: "Marker 1" },
    { type: "color", key: "mark2Color", label: "Marker 2" },
    { type: "number", key: "sweep", label: "Sweep length", min: 8, max: 30, step: 1, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const lines = splitLines(p.text);
    const marks = findMarks(lines, p.mark1, p.mark2);
    const s2 = SWEEP.first + p.sweep + SWEEP.pause;
    const markLine = (slot: 0 | 1, color: string, start: number) => {
      const m = marks.find((k) => k.slot === slot);
      return m
        ? `- "${lines[m.line].slice(m.start, m.end)}" (line ${m.line + 1}): ${color} marker, sweeping left → right from frame ${start} over ${secs(p.sweep, c.fps)}.`
        : `- highlight ${slot + 1} not found in the text; skip it.`;
    };
    return [
      targetLine(c.target, "a statement where marker highlights sweep behind two key words", c.width, c.height, c.seconds),
      `Background ${p.background}. Font Geist ${SWEEP.base}px (shrink to fit 80% of the width), weight 600, tracking -0.035em, line height 1.14, colour ${p.ink}.`,
      `Lines, left-aligned as a centred block: ${lines.map((l) => `"${l}"`).join(" / ")}.`,
      `Lines fade up 36px from a 6px blur over ${secs(SWEEP.lineDur, c.fps)}, ${SWEEP.lineGap} frames apart.`,
      "",
      "Highlights sit behind the word: from 0.2em below the line top to 0.05em above the bottom, 0.1em wider each side, radius 0.12em, rotated -1.2°, with a 90° gradient from the colour at 82% to solid.",
      "Each grows with scaleX from the left; a clipped copy of the word in the marked-text colour is revealed in step, so the text flips colour exactly under the marker.",
      markLine(0, p.mark1Color, SWEEP.first),
      markLine(1, p.mark2Color, s2),
      `Text under a marker turns ${p.markInk}. Ease ${p.ease} ${bezierText(p.ease)}.`,
      `Both highlights are in place by ${secs(s2 + p.sweep, c.fps)}; hold to the end.`,
    ].join("\n");
  },
});
