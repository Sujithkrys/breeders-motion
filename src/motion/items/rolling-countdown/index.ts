import { FINAL_HOLD, RADIUS, STROKE, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { CLOCK, GEO, RollingCountdown, clockText, isDark, springFor, startOf, type RollingCountdownProps } from "./RollingCountdown";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  line: t.line,
  fill: t.fill,
  ink: t.ink,
  ink2: t.ink2,
  accent: t.accent,
}));

const DURATION = 180;

export default defineMotion<RollingCountdownProps>({
  slug: "rolling-countdown",
  name: "Rolling Countdown",
  description: "A focus timer card whose big m:ss digits snap down a second at a time on a spring while an accent bar depletes, then roll back to the start.",
  category: "text",
  tags: ["timer", "countdown", "digits", "odometer", "loop"],
  addedAt: "2026-10-22",
  durationInFrames: DURATION,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: RollingCountdown,
  defaultProps: {
    ...palettes[0].values,
    preset1: "Sprint 30s",
    preset2: "Focus 5m",
    preset3: "Pomodoro 25m",
    start: 30,
    bounce: 2,
  } as RollingCountdownProps,
  palettes,
  controls: [
    { type: "text", key: "preset1", label: "Preset 1 (active)", maxLength: 14 },
    { type: "text", key: "preset2", label: "Preset 2", maxLength: 14 },
    { type: "text", key: "preset3", label: "Preset 3", maxLength: 14 },
    { type: "number", key: "start", label: "Start", min: 10, max: 3600, step: 5, unit: "s" },
    { type: "number", key: "bounce", label: "Bounce", min: 0, max: 3, step: 1 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Canvas" },
  ],
  prompt: (p, c) => {
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const g = GEO[ratio];
    const start = startOf(p.start);
    const n = CLOCK.ticks.length;
    const sp = springFor(p.bounce);
    return [
      targetLine(c.target, "a focus-timer card whose big m:ss digits roll down one second at a time while an accent bar depletes", c.width, c.height, c.seconds),
      `Canvas flat ${p.background}. Sizes are px at 1080 on the short side. Inter only; no gradients or glows.`,
      `Card: ${g.cardW}×${g.cardH}px (at most 90% of the width), ${p.card}, radius ${RADIUS.hero}, 1px ${p.line} border, ${isDark(p.background) ? "no shadow" : "shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)"}. Content centred in a column with ${g.gap}px gaps.`,
      `Top: a segmented control (6px padding, radius ${RADIUS.button}, 1px ${p.line} border) with "${p.preset1}", "${p.preset2}", "${p.preset3}"; Inter ${g.chip}px/500, chips radius ${RADIUS.chip}, 12×22px padding. The first is active: ${p.fill} fill, ${p.ink} text; the others ${p.ink2}.`,
      `Clock: "${clockText(start, start)}" in Inter 400, ${g.digits}px, ${p.ink}. Each digit is its own overflow-hidden column ${CLOCK.colW}em wide and ${CLOCK.lineH}em tall (fixed widths, like tabular figures, without font-variant-numeric); the colon is ${CLOCK.colonW}em.`,
      `Bar: ${g.bar}×${STROKE.bar}px, round caps, track ${p.line}, fill ${p.accent}, width = seconds left ÷ ${start}.`,
      `Frames 0–${CLOCK.ticks[n - 1]}: the bar depletes linearly by ${n}s and the clock drops a second at frames ${CLOCK.ticks.join(", ")} (${clockText(start, start)} → ${clockText(start - n, start)}).`,
      `Each changing digit snaps over ${CLOCK.roll} frames on a spring (damping ${sp.damping.toFixed(1)}, mass ${sp.mass}, stiffness ${sp.stiffness}): the new digit drops in from above, the old one falls out below, opacity 1 − 1.4 × |offset|.`,
      `Rest to frame ${CLOCK.reset}. Then the clock rolls back to ${clockText(start, start)}: digits rise from below, right column first, ${CLOCK.resetStagger} frames apart, while the bar refills over frames ${CLOCK.refill[0]}–${CLOCK.refill[1]} on travel ${bezierText("travel")}.`,
      `Hold the full clock for the last ${FINAL_HOLD} frames so the ${c.seconds}s loop is seamless.`,
    ].join("\n");
  },
});
