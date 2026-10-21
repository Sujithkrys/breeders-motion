import { EASE_OPTIONS, STROKE, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { GEO, IconMorph, N, SEG, isDark, morphFrames, type IconMorphProps } from "./IconMorph";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  line: t.line,
  ink: t.ink,
  ink3: t.ink3,
  accent: t.accent,
}));

export default defineMotion<IconMorphProps>({
  slug: "icon-morph",
  name: "Icon Morph",
  description: "One large stroke icon morphs point by point through play, pause, stop and done, with a mono label row tracking the state.",
  category: "ui",
  tags: ["icon", "morph", "svg", "media", "states"],
  addedAt: "2026-10-22",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: IconMorph,
  defaultProps: {
    ...palettes[0].values,
    label1: "Play",
    label2: "Pause",
    label3: "Stop",
    label4: "Done",
    speed: 18,
    stroke: STROKE.ring,
    ease: "travel",
  } as IconMorphProps,
  palettes,
  controls: [
    { type: "text", key: "label1", label: "Label: play", maxLength: 8 },
    { type: "text", key: "label2", label: "Label: pause", maxLength: 8 },
    { type: "text", key: "label3", label: "Label: stop", maxLength: 8 },
    { type: "text", key: "label4", label: "Label: check", maxLength: 8 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "number", key: "speed", label: "Morph length", min: 10, max: 30, step: 1, unit: "f" },
    { type: "number", key: "stroke", label: "Stroke width", min: 1.5, max: 3.5, step: 0.25 },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const g = GEO[ratio];
    const M = morphFrames(p.speed);
    const sw = Math.min(3.5, Math.max(1.5, Number(p.stroke) || 2.5));
    const s = (f: number) => secs(f, c.fps);
    const labels = [p.label1, p.label2, p.label3, p.label4];
    const dark = isDark(p.background);
    return [
      targetLine(c.target, "one large stroke icon that morphs point by point through play → pause → stop → check → play", c.width, c.height, c.seconds),
      `Canvas ${p.background}, flat. Sizes are px at 1080 on the short side. No gradients or glows.`,
      `A ${g.disc}px circle (${p.card}, 1px ${p.line} inner border${dark ? "" : ", shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)"}) holds a ${g.icon}px SVG icon on a 24-unit viewBox, stroke ${p.ink} ${sw} units wide (${(sw * g.icon / 24).toFixed(0)}px), round caps and joins, no fill.`,
      `Every icon is two closed sub-paths of exactly ${N} points, so states lerp point by point. Play = triangle (7.5,4.5)(19.5,12)(7.5,19.5), twice; pause = bars (6–10 and 14–18, y 4.5–19.5); stop = square 5–19; check = (4.5,12.5)(9.5,17.5)(19.5,6.5) written out and back so it is closed. Each sub-path starts at its top-left vertex and runs clockwise; keep every vertex and share the spare points among edges by length.`,
      `Timing: four ${SEG}-frame segments (${s(SEG)} each). Each state holds, then morphs into the next over the last ${M} frames of its segment (${p.ease} ${bezierText(p.ease)}); the triangle splits into the two bars, the bars merge into the square, the square folds into the check, the check unfolds into the triangle.`,
      `During each morph the icon dips to 0.94 and the circle to 0.98 at the midpoint (sin curve), back to 1 at the end.`,
      `Below, ${g.gapBelow}px under the circle: ${labels.map((l) => `"${l.toUpperCase()}"`).join(", ")} in Geist Mono ${g.mono}px, +0.12em tracking, evenly spaced. The current state is ${p.ink}, the rest ${p.ink3}, and a 10px ${p.accent} dot under the row slides to the current label in step with the morph (the only accent).`,
      `The last morph ends at frame ${4 * SEG}, so play holds for the final 12 frames; the ${c.seconds}s loop is seamless.`,
    ].join("\n");
  },
});
