import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { COUNTER, RollingCounter, parseValue, type RollingCounterProps } from "./RollingCounter";

const palettes = [
  { name: "Mint", swatch: ["#04130E", "#34F5A4", "#EFFFF7"], values: { background: "#04130E", ink: "#EFFFF7", quiet: "#6F9486", accent: "#34F5A4" } },
  { name: "Peach", swatch: ["#FFF1E8", "#FF6B2C", "#2A140A"], values: { background: "#FFF1E8", ink: "#2A140A", quiet: "#A07E6C", accent: "#FF6B2C" } },
  { name: "Violet", swatch: ["#0F0A1F", "#A78BFA", "#F4F0FF"], values: { background: "#0F0A1F", ink: "#F4F0FF", quiet: "#7D73A0", accent: "#A78BFA" } },
  { name: "Gold", swatch: ["#121008", "#FFC53D", "#FFF8E6"], values: { background: "#121008", ink: "#FFF8E6", quiet: "#8E8467", accent: "#FFC53D" } },
  { name: "Mono", swatch: ["#0B0B0C", "#E4E4E7", "#71717A"], values: { background: "#0B0B0C", ink: "#FAFAFA", quiet: "#71717A", accent: "#E4E4E7" } },
];

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
    stagger: 4,
    spins: 1,
    ease: "enter",
  } as RollingCounterProps,
  palettes,
  controls: [
    { type: "text", key: "value", label: "Value", maxLength: 10 },
    { type: "text", key: "caption", label: "Caption", maxLength: 36 },
    { type: "text", key: "badge", label: "Badge", maxLength: 24 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "number", key: "stagger", label: "Digit stagger", min: 0, max: 6, step: 1, unit: "f" },
    { type: "number", key: "spins", label: "Extra spins", min: 0, max: 3, step: 1 },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const { prefix, body, suffix } = parseValue(p.value);
    const digits = (body.match(/\d/g) ?? []).length;
    const end = COUNTER.start + Math.max(digits - 1, 0) * p.stagger + COUNTER.roll;
    return [
      targetLine(c.target, `an odometer counter rolling up to "${p.value}" with a caption`, c.width, c.height, c.seconds),
      `Background ${p.background}, with a soft ${p.accent} radial glow (20% opacity) behind the number. Font Geist, centred.`,
      `Number: ${COUNTER.base}px (shrink to fit 84% of the width), weight 650, tracking -0.04em, line height 1.1, colour ${p.ink}.`,
      `${prefix ? `Prefix "${prefix}"` : "No prefix"} and ${suffix ? `suffix "${suffix}"` : "no suffix"} in ${p.accent}; the prefix fades up 40px at the start, the suffix as the last digit lands. Separators like "." fade in.`,
      `Each digit is its own ${COUNTER.digitWidth}em-wide, 1.1em-tall overflow-hidden column with a top/bottom fade mask (14%). Render only the current and next digit and offset them by the fractional position, so it rolls upward like an odometer.`,
      `Each column counts from 0 through ${p.spins} extra full turn${p.spins === 1 ? "" : "s"} to its digit over ${secs(COUNTER.roll, c.fps)}, starting at frame ${COUNTER.start} and staggered ${p.stagger} frames left to right.`,
      `Ease ${p.ease} ${bezierText(p.ease)}. Add a motion blur of min(speed × 5, 7)px, where speed is digits per frame.`,
      p.badge.trim()
        ? `Above the number, a pill "${p.badge}" with a small up triangle: 30px weight 600 in ${p.accent} on ${p.accent} at 14% with a 1.5px border at 38%; it pops in (scale 0.92 → 1) as the roll finishes.`
        : "No badge.",
      p.caption.trim() ? `Below, the caption "${p.caption}" at 44px, weight 400, tracking -0.015em, in ${p.quiet}; it fades up 24px from frame ${COUNTER.start + 14}.` : "No caption.",
      `Everything settles by ${secs(end + 10, c.fps)}; hold the final number to the end.`,
    ].join("\n");
  },
});
