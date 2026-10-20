import { EASE_OPTIONS, RADIUS, STROKE, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { G, ModelWheel, RADIUS_DRUM, T, flicks, parseItems, type ModelWheelProps } from "./ModelWheel";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  line: t.line,
  fill: t.fill,
  ink: t.ink,
  ink2: t.ink2,
  ink3: t.ink3,
  accent: t.accent,
}));

export default defineMotion<ModelWheelProps>({
  slug: "model-wheel",
  name: "Model Wheel",
  description: "A drum picker of model names flicks with momentum, snaps to a row, and draws the chosen one in ink inside a grey selection pill.",
  category: "ui",
  tags: ["picker", "wheel", "select", "ai", "models", "loop"],
  addedAt: "2026-10-20",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: ModelWheel,
  defaultProps: {
    ...palettes[0].values,
    label: "Model",
    items: "Fast, Balanced, Thorough, Research, Claude Haiku, Claude Sonnet, Claude Opus, Custom",
    momentum: 0.18,
    ease: "enter",
  } as ModelWheelProps,
  palettes,
  controls: [
    { type: "text", key: "label", label: "Label", maxLength: 20 },
    { type: "text", key: "items", label: "Options (comma-separated, 3–10)", maxLength: 160 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "momentum", label: "Overshoot before snap", min: 0, max: 0.4, step: 0.02, unit: " rows" },
    { type: "select", key: "ease", label: "Flick easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const items = parseItems(p.items);
    const n = items.length;
    const { f1, f2 } = flicks(n);
    const R = Math.round(RADIUS_DRUM);
    return [
      targetLine(c.target, "a vertical picker wheel of model names that flicks with momentum and snaps to a selection", c.width, c.height, c.seconds),
      `Background ${p.background}, flat. Sizes are px at 1080 on the short side; on 1:1 and 9:16 scale everything so the band is 88% of the width. No card, no gradient, no glow.`,
      `Options, looping as an endless drum: ${items.map((x) => `"${x}"`).join(", ")}. Each row is a 40px stroked line glyph (${STROKE.ring}px, round caps; bolt, sliders, layers, compass, spark, half circle, cube, grid in turn; no brand logos) then the name, Inter ${G.name}px, -0.035em, 24px gap, ${G.inset}px from the band's left edge.`,
      `Selection band, centred: ${G.bandW}×${G.bandH}px, fill ${p.fill}, radius ${RADIUS.card}px. Rows inside the band are drawn in ${p.ink} at weight 600 (clip a second copy of the rows to the band); rows outside are weight 500 in ${p.ink2}, shading to ${p.ink3} beyond one row away. A ${G.check}px ${p.accent} check (${STROKE.ring}px stroke) sits ${G.inset}px from the band's right edge; it is the only accent.`,
      `Drum: rows are ${G.step}° apart on a ${R}px-radius cylinder (${G.pitch}px pitch at the centre). Each row at angle θ moves to y = R·sinθ, scales by s = 3R / (3R + R(1 − cosθ)) and squashes vertically by cosθ; opacity cos(θ)^1.6, faded out by ±4 rows.`,
      `Label "${p.label}": Geist Mono ${G.labelSize}px/500, uppercase, +0.12em tracking, ${p.ink3}, above the drum aligned to the names.`,
      `f0–${T.flick1A}: still on "${items[0]}". f${T.flick1A}–${T.flick1B}: a flick rolls the drum ${f1} rows plus ${p.momentum} rows of momentum on ${p.ease} ${bezierText(p.ease)}, then it snaps back onto "${items[f1 % n]}" over f${T.flick1B}–${T.snap1B} on travel ${bezierText("travel")}.`,
      `f${T.flick2A}–${T.flick2B}: a second flick of ${f2} rows (plus the same overshoot) and a snap by f${T.snap2B}, landing back on "${items[0]}", so the ${n}-row turn loops seamlessly. Hold still from f${T.snap2B} to the end.`,
      `The check fades out over 12 frames (exit) as each flick starts and returns over 18 frames (enter, scaling from 0.85) after each snap: out f${T.chkOut1A}, in f${T.chkIn1A}; out f${T.chkOut2A}, in f${T.chkIn2A}.`,
    ].join("\n");
  },
});
