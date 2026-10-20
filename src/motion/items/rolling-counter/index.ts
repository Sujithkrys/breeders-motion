import { EASE_OPTIONS, STAGGER, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { COUNTER, RollingCounter, counterTiming, parseValue, type RollingCounterProps } from "./RollingCounter";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  fill: t.fill,
  ink: t.ink,
  ink2: t.ink2,
  accent: t.accent,
}));

const r0 = (n: number) => Math.round(n);

export default defineMotion<RollingCounterProps>({
  slug: "rolling-counter",
  name: "Rolling Counter",
  description: "Odometer digits roll up to a headline number, column by column, above a caption.",
  category: "text",
  tags: ["counter", "odometer", "numbers", "stat", "metric"],
  addedAt: "2026-10-02",
  durationInFrames: 120,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: RollingCounter,
  defaultProps: {
    ...palettes[0].values,
    value: "$2.4M",
    caption: "Annual recurring revenue",
    badge: "38% year over year",
    stagger: STAGGER,
    spins: 1,
    ease: "enter",
  } as RollingCounterProps,
  palettes,
  controls: [
    { type: "text", key: "value", label: "Value", maxLength: 10 },
    { type: "text", key: "caption", label: "Caption", maxLength: 36 },
    { type: "text", key: "badge", label: "Badge", maxLength: 24 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "stagger", label: "Digit stagger", min: 0, max: 6, step: 1, unit: "f" },
    { type: "number", key: "spins", label: "Extra spins", min: 0, max: 3, step: 1 },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const { prefix, suffix } = parseValue(p.value);
    const dur = Math.round(c.seconds * c.fps);
    const { st, rollEnd } = counterTiming(p.value, p.stagger, dur);
    const badgeA = r0(rollEnd - 8);
    const spins = Math.max(0, Math.round(p.spins));
    const vertical = c.height > c.width;
    return [
      targetLine(c.target, `an odometer counter rolling up to "${p.value}" with a caption`, c.width, c.height, c.seconds),
      `Background: flat ${p.background}. No glow, no gradient, nothing behind the number. Everything centred. Sizes are px at 1080 on the short side.`,
      `Type: Inter only. Number ${vertical ? COUNTER.baseVertical : COUNTER.base}px (shrink to fit 84% of the width), weight 600, tracking -0.045em, line height 1.1, tabular figures, ${p.ink}. ${prefix ? `Prefix "${prefix}"` : "No prefix"} and ${suffix ? `suffix "${suffix}"` : "no suffix"} in the same size and weight but ${p.ink2}, so the digits lead by grey, not colour.`,
      p.caption.trim() ? `Caption "${p.caption}" 18px below: 36px, weight 400, -0.015em, ${p.ink2}.` : "No caption.",
      p.badge.trim()
        ? `Badge above the number, 28px gap: a pill (radius 999) "${p.badge}" in Inter 26px/500 ${p.ink2} on ${p.fill}, 10px × 20px padding, led by a 14px up-triangle in ${p.accent}; the triangle is the only accent in the frame.`
        : `No badge; ${p.accent} is unused.`,
      `Digits: each is its own ${COUNTER.digitWidth}em-wide, 1.1em-tall overflow-hidden column with a top/bottom fade mask (14%). Render only the current and next digit, offset by the fractional position, so it rolls upward like an odometer.`,
      "",
      `Frame ${COUNTER.start}: columns start left to right, ${Number(st.toFixed(2))} frames apart; each counts from 0 through ${spins} extra full turn${spins === 1 ? "" : "s"} to its digit over ${COUNTER.roll} frames (${secs(COUNTER.roll, c.fps)}), ${p.ease} ${bezierText(p.ease)}, with a motion blur of min(speed × 5, 7)px where speed is digits per frame.`,
      `Frame ${COUNTER.start}–${COUNTER.start + COUNTER.prefixIn}: the prefix fades up 40px; separators like "." fade in over ${COUNTER.sepIn} frames. Frame ${COUNTER.captionAt}–${COUNTER.captionAt + COUNTER.captionIn}: the caption fades up 24px. Frame ${r0(rollEnd - 14)}–${r0(rollEnd - 14 + COUNTER.suffixIn)}: the suffix fades up 40px as the last digit lands. All ${p.ease}.`,
      ...(p.badge.trim() ? [`Frame ${badgeA}–${badgeA + COUNTER.badgeIn}: the badge rises 14px, fades in and scales 0.92 → 1 (${p.ease}).`] : []),
      `Everything is settled by frame ${r0(rollEnd + COUNTER.settle)}; hold the final number still to frame ${dur}.`,
    ].join("\n");
  },
});
