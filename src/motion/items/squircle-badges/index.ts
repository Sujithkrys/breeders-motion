import { EASE_OPTIONS, STROKE, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { CHAR_W, CORNER_PTS, GEO, HOVER_IN, HOVER_N, HOVER_OUT, LEGS, LIVE_DOT, PULSE, SquircleBadges, type SquircleBadgesProps } from "./SquircleBadges";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  line: t.line,
  fill: t.fill,
  ink: t.ink,
  ink2: t.ink2,
  ink3: t.ink3,
  button: t.button,
  onButton: t.onButton,
  accent: t.accent,
  onAccent: t.onAccent,
}));

export default defineMotion<SquircleBadgesProps>({
  slug: "squircle-badges",
  name: "Squircle Badges",
  description: "Four squircle badges whose superellipse corners soften into round pills and lift as a cursor hovers each in turn.",
  category: "ui",
  tags: ["badge", "squircle", "hover", "cursor", "svg"],
  addedAt: "2026-10-22",
  durationInFrames: 150,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: SquircleBadges,
  defaultProps: {
    ...palettes[0].values,
    label1: "New",
    label2: "Beta",
    label3: "Pro",
    label4: "Live",
    curvature: 4,
    hoverScale: 6,
    ease: "spring",
  } as SquircleBadgesProps,
  palettes,
  controls: [
    { type: "text", key: "label1", label: "Badge 1", maxLength: 8 },
    { type: "text", key: "label2", label: "Badge 2", maxLength: 8 },
    { type: "text", key: "label3", label: "Badge 3", maxLength: 8 },
    { type: "text", key: "label4", label: "Badge 4 (live)", maxLength: 8 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "number", key: "curvature", label: "Squircle exponent", min: 3, max: 6, step: 0.1 },
    { type: "number", key: "hoverScale", label: "Hover growth", min: 0, max: 10, step: 1, unit: "%" },
    { type: "select", key: "ease", label: "Hover easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const g = GEO[ratio];
    const nRest = Math.min(6, Math.max(3, Number(p.curvature) || 4));
    const grow = Math.min(10, Math.max(0, Number(p.hoverScale) || 0));
    const s = (f: number) => secs(f, c.fps);
    const visits = LEGS.slice(0, 4).map((l, i) => `badge ${i + 1} at ${s(l.b)}`).join(", ");
    return [
      targetLine(c.target, `four squircle badges ("${p.label1}", "${p.label2}", "${p.label3}", "${p.label4}") whose corners soften and lift as a cursor hovers each`, c.width, c.height, c.seconds),
      `Canvas ${p.background}, flat. Sizes are px at 1080 on the short side. Inter ${g.font}px/500, -0.035em tracking, sentence case. No gradients, glows or shadows.`,
      `Layout: ${g.grid ? `a 2 × 2 grid, ${g.gap}px gaps` : `one centred row, ${g.gap}px gaps`}. Each badge is ${g.h}px tall and ${g.pad}px of side padding around its label (about ${CHAR_W}em per character), at least ${Math.round(g.h * 1.25)}px wide.`,
      `Shape: an SVG path per badge, recomputed every frame: straight edges with superellipse corners of radius h/2, each corner |x/r|^n + |y/r|^n = 1 sampled at ${CORNER_PTS} points (x = r·cos^(2/n)θ, y = r·sin^(2/n)θ), ${CORNER_PTS * 4} points in all. At rest n = ${nRest}; under the cursor n = ${HOVER_N}, which reads as a round pill.`,
      `Fills: "${p.label1}" ${p.card} with a ${STROKE.hair}px ${p.line} stroke and ${p.ink} text; "${p.label2}" ${p.fill} with ${p.ink2} text; "${p.label3}" ${p.button} with ${p.onButton} text; "${p.label4}" ${p.accent} with ${p.onAccent} text, led by a ${Math.round(g.h * LIVE_DOT * 0.5)}px dot whose ring pulses outward and fades every ${PULSE} frames (the only accent).`,
      `An arrow cursor (${p.ink}) glides between badges on travel ${bezierText("travel")}: ${visits}, then back to rest by ${s(LEGS[4].b)}. A hovered badge eases in over ${HOVER_IN} frames (${p.ease} ${bezierText(p.ease)}) and out over ${HOVER_OUT} frames on travel as the cursor leaves: n ${nRest} → ${HOVER_N}, scale 1 → ${(1 + grow / 100).toFixed(2)}, lift 8px.`,
      `Below the badges, 64px down: "SUPERELLIPSE · N ${nRest.toFixed(2)}" in Geist Mono ${g.mono}px, +0.12em tracking, ${p.ink3}, showing the live exponent of the hovered badge.`,
      `The last 12 frames hold still (only the live dot keeps pulsing); the ${c.seconds}s loop is seamless.`,
    ].join("\n");
  },
});
