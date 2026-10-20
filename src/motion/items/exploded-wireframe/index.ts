import { EASE_OPTIONS, STAGGER, STROKE, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { ExplodedWireframe, LABEL_SIZE, LAYERS, LEAD, SC, T, clampSpread, exploded, type ExplodedWireframeProps } from "./ExplodedWireframe";

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

export default defineMotion<ExplodedWireframeProps>({
  slug: "exploded-wireframe",
  name: "Exploded Wireframe",
  description: "A hairline isometric device lifts apart into screen, board, battery and case with mono leader labels, highlights one layer, then reassembles.",
  category: "3d",
  tags: ["isometric", "wireframe", "exploded", "hardware", "technical", "loop"],
  addedAt: "2026-10-20",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: ExplodedWireframe,
  defaultProps: {
    ...palettes[0].values,
    label1: "Display",
    label2: "Logic board",
    label3: "Battery",
    label4: "Case",
    highlight: 2,
    spread: 56,
    ease: "travel",
  } as ExplodedWireframeProps,
  palettes,
  controls: [
    { type: "text", key: "label1", label: "Top layer", maxLength: 16 },
    { type: "text", key: "label2", label: "Layer 2", maxLength: 16 },
    { type: "text", key: "label3", label: "Layer 3", maxLength: 16 },
    { type: "text", key: "label4", label: "Bottom layer", maxLength: 16 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "spread", label: "Spread", min: 30, max: 80, step: 2 },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const gap = clampSpread(p.spread);
    const z = exploded(gap);
    const names = [p.label1, p.label2, p.label3, p.label4];
    const hl = Math.min(4, Math.max(1, Math.round(Number(p.highlight) || 2)));
    const L = LAYERS;
    return [
      targetLine(c.target, "an isometric hairline drawing of a small device that explodes into labelled layers and reassembles", c.width, c.height, c.seconds),
      `Background ${p.background}, flat. One inline SVG, no three.js, no shading or gradients: true isometric projection X = (x − y)·cos30°, Y = (x + y)·0.5 − z at ${SC}px per unit (at 1080 on the short side), fitted to 92% of the width and 84% of the height on every ratio.`,
      `Layers, bottom to top, square footprints (half-size × thickness, assembled base z): case ${L[0].half}×${L[0].h} at 0 with a ${p.fill} tray inset 12 and two port slots and a groove on its front faces; battery ${L[1].half}×${L[1].h} at ${L[1].z0} (inset cell, tab, plus mark); logic board ${L[2].half}×${L[2].h} at ${L[2].z0} (chip with die, two small parts, two traces, five vias as iso ellipses); display ${L[3].half}×${L[3].h} at ${L[3].z0} (inset glass, camera dot). Assembled, the display and case hide everything.`,
      `Each slab = top face filled ${p.background} plus two front faces filled ${p.fill}, painted bottom to top so upper layers occlude lower ones. Outlines ${p.ink2}, details ${p.ink3}, all ${STROKE.hair}px hairlines with round joins.`,
      `Exploded, the gaps are ${gap} units: battery base z ${z[1]}, board ${z[2]}, display ${z[3]}; the case stays put and the whole stack re-centres vertically as it grows. Dotted ${p.ink3} guides (${STROKE.hair}px, dash 2/5) rise from the case rim's three visible corners to the display.`,
      `Labels: from each layer's outer corner at mid-thickness a ${STROKE.hair}px ${p.ink3} leader runs horizontally to ${LEAD} units past the device (display and battery right, board and case left), with a ${STROKE.ring}px-radius dot at the corner. Text Geist Mono ${LABEL_SIZE}px/500, uppercase, +0.12em: "01".."04" in ${p.ink3}, then ${names.map((n) => `"${n}"`).join(", ")} in ${p.ink2}.`,
      `Highlight layer ${hl} ("${names[hl - 1]}"): outline and details turn ${p.accent}, its top face takes a ${p.accent} 8% tint, its leader dot ${p.accent} and its label ${p.ink}. That is the only accent.`,
      `f0–${T.explodeA}: still and assembled. f${T.explodeA}: the display lifts first, then the board and battery ${STAGGER} frames apart, each over ${T.move} frames on ${p.ease} ${bezierText(p.ease)}.`,
      `f${T.labelsA}: leaders draw out over 20 frames (enter ${bezierText("enter")}) top label first, ${STAGGER} frames apart, and labels fade in sliding 12px outward. f${T.hlA}–${T.hlA + 20}: the highlight fades on.`,
      `f${T.outA}: labels, leaders and highlight leave over 14 frames on exit ${bezierText("exit")}, ${STAGGER} frames apart. f${T.reassembleA}: the layers settle back, battery first, ${STAGGER} frames apart over ${T.move} frames, landing by f${T.reassembleA + 2 * STAGGER + T.move}. Hold still to the end so the loop restarts without a jolt.`,
    ].join("\n");
  },
});
