import { ACCENT, CANVAS, FINAL_HOLD, STROKE, bezierText, systemPalettes, targetLine } from "../../kit";
import { FILM, SAMPLE } from "../../film";
import { defineMotion } from "../../types";
import { LOCKUP, VENETIAN, VenetianReveal, lockupLayout, settleFrame, slatCount, slatDelay, type VenetianRevealProps } from "./VenetianReveal";

const palettes = [
  ...systemPalettes((t) => ({ background: t.bg, card: t.card, line: t.line, ink: t.ink, ink2: t.ink2, accent: t.accent })),
  {
    name: "Black",
    swatch: [FILM.black, FILM.white, ACCENT.orange],
    values: { background: FILM.black, card: FILM.black, line: CANVAS.ink.line, ink: FILM.white, ink2: CANVAS.ink.ink2, accent: ACCENT.orange },
  },
];

const DURATION = 150;

export default defineMotion<VenetianRevealProps>({
  slug: "logo-venetian",
  name: "Venetian Reveal",
  description: "A field of vertical slats turns in a left-to-right wave, each carrying its slice of the logo, until the lockup stands whole.",
  category: "logo",
  tags: ["logo", "blinds", "3d", "wave", "reveal"],
  addedAt: "2026-10-22",
  durationInFrames: DURATION,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: VenetianReveal,
  defaultProps: {
    ...palettes[0].values,
    logo: SAMPLE.logo,
    brand: SAMPLE.brand,
    tagline: "Calm software for focused teams",
    slats: 10,
    speed: 1,
  } as VenetianRevealProps,
  palettes,
  controls: [
    { type: "image", key: "logo", label: "Logo", hint: "PNG or SVG, square mark works best" },
    { type: "text", key: "brand", label: "Brand name", maxLength: 14 },
    { type: "text", key: "tagline", label: "Tagline", maxLength: 36 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "number", key: "slats", label: "Slats", min: 6, max: 16, step: 1 },
    { type: "number", key: "speed", label: "Wave speed", min: 0.75, max: 1.5, step: 0.25, unit: "×" },
  ],
  prompt: (p, c) => {
    const u = Math.min(c.width, c.height) / 1080;
    const n = slatCount(p.slats);
    const d = slatDelay(p.speed);
    const settle = settleFrame(n, p.speed);
    const hasTag = p.tagline.trim().length > 0;
    const L = lockupLayout(p.brand, hasTag, c.width, c.height, u);
    const r = (x: number) => Math.round(x / u);
    const f = (x: number) => Math.round(x);
    const tagEnd = settle + VENETIAN.tag[1];
    const T = LOCKUP.tag;
    return [
      targetLine(c.target, `a venetian-blind logo reveal for "${p.brand}": ${n} vertical slats turn in a wave and assemble the lockup`, c.width, c.height, c.seconds),
      `Background: flat ${p.background}. Sizes are px at 1080 on the short side. No gradients, glows or shadows.`,
      `Lockup, centred on the frame: the user's logo file in a ${r(L.mark)}×${r(L.mark)}px box (object-fit: contain), ${L.vertical ? `stacked ${r(L.gap)}px above` : `${r(L.gap)}px to the left of`} the wordmark "${p.brand}" in Inter ${LOCKUP.weight}, ${r(L.font)}px, tracking ${LOCKUP.tracking}em, line-height 1, ${p.ink}.`,
      hasTag
        ? `Tagline "${p.tagline.toUpperCase()}" centred ${T.gap}px below the lockup: Geist Mono 400, ${r(L.tagSize)}px, +${T.tracking}em, ${p.ink2}, after a ${T.dot}px ${p.accent} dot (${T.dotGap}px gap).`
        : "No tagline.",
      `Slats: ${n} full-height vertical slats, each ${r(c.width / n)}px wide, flat ${p.card} with a ${STROKE.hair}px ${p.line} hairline on the left edge. Each slat is overflow: hidden and holds a full-frame copy of the lockup offset left by the slat's x, so it carries exactly its vertical slice of the logo. No CSS masks.`,
      "",
      `Motion: slat i turns from rotateY(90°) (edge-on, invisible) to 0° around its own centre, with its own perspective(${VENETIAN.perspective}px), starting at frame ${VENETIAN.start} + ${+d.toFixed(2)}·i, left to right, over ${VENETIAN.turn} frames on a ${bezierText("spring")}.`,
      `While a slat is turned it is shaded flat with ${p.line} at ${VENETIAN.shade} × sin(angle) opacity, so the blinds read as turning towards the viewer.`,
      `The last slat lands on frame ${f(settle)}. Frames ${f(settle)}–${f(settle + VENETIAN.seam)}: the slat hairlines fade out on exit ${bezierText("exit")}, then swap the slats for one flat ${p.card} field and one unsliced lockup in the same place.`,
      ...(hasTag ? [`Frames ${f(settle + VENETIAN.tag[0])}–${f(tagEnd)}: the tagline and dot rise ${VENETIAN.tagRise}px and fade in on enter ${bezierText("enter")}.`] : []),
      `Hold the finished lockup perfectly still from frame ${f(hasTag ? tagEnd : settle + VENETIAN.seam)} to frame ${DURATION} (at least the last ${FINAL_HOLD} frames).`,
    ].join("\n");
  },
});
