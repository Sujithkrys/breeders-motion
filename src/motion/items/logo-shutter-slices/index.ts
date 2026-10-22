import { ACCENT, FINAL_HOLD, STAGGER, STROKE, bezierText, systemPalettes, targetLine } from "../../kit";
import { FILM, SAMPLE } from "../../film";
import { defineMotion } from "../../types";
import { LOCKUP, SHUTTER, ShutterSlices, lockFrame, lockupLayout, sliceCount, type ShutterSlicesProps } from "./ShutterSlices";

const palettes = [
  ...systemPalettes((t) => ({ background: t.bg, ink: t.ink, accent: t.accent })),
  { name: "Black", swatch: [FILM.black, FILM.white, ACCENT.orange], values: { background: FILM.black, ink: FILM.white, accent: ACCENT.orange } },
];

const DURATION = 120;

export default defineMotion<ShutterSlicesProps>({
  slug: "logo-shutter-slices",
  name: "Shutter Slices",
  description: "The logo lockup, cut into horizontal slices, slides in from alternating sides and locks together under a hairline accent rule.",
  category: "logo",
  tags: ["logo", "slices", "shutter", "wordmark", "reveal"],
  addedAt: "2026-10-22",
  durationInFrames: DURATION,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: ShutterSlices,
  defaultProps: {
    ...palettes[0].values,
    logo: SAMPLE.logo,
    brand: SAMPLE.brand,
    tagline: "Calm software for focused teams",
    slices: 8,
  } as ShutterSlicesProps,
  palettes,
  controls: [
    { type: "image", key: "logo", label: "Logo", hint: "PNG or SVG, square mark works best" },
    { type: "text", key: "brand", label: "Brand name", maxLength: 14 },
    { type: "text", key: "tagline", label: "Tagline", maxLength: 36 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "slices", label: "Slices", min: 5, max: 12, step: 1 },
  ],
  prompt: (p, c) => {
    const u = Math.min(c.width, c.height) / 1080;
    const n = sliceCount(p.slices);
    const lock = lockFrame(n);
    const hasTag = p.tagline.trim().length > 0;
    const L = lockupLayout(p.brand, hasTag, c.width, c.height, u);
    const r = (x: number) => Math.round(x / u);
    const bandH = (L.rowH + 2 * SHUTTER.pad * L.font) / n;
    const tagEnd = lock + SHUTTER.tag[1];
    return [
      targetLine(c.target, `a logo reveal for "${p.brand}": the lockup arrives in ${n} horizontal slices from alternating sides and locks together`, c.width, c.height, c.seconds),
      `Background: flat ${p.background}. Sizes are px at 1080 on the short side. No gradients, glows or shadows.`,
      `Lockup, centred: the user's logo file in a ${r(L.mark)}×${r(L.mark)}px box (object-fit: contain), ${L.vertical ? `stacked above` : `${r(L.gap)}px to the left of`} the wordmark "${p.brand}" in Inter ${LOCKUP.weight}, ${r(L.font)}px, tracking ${LOCKUP.tracking}em, line-height 1, ${p.ink}${L.vertical ? `, ${r(L.gap)}px below the mark` : ""}.`,
      hasTag
        ? `Tagline "${p.tagline}" centred ${r(L.tagTop - L.rowTop - L.rowH)}px below the lockup in Inter 400, ${r(L.tagSize)}px, -0.01em, ${p.ink} at 60% opacity.`
        : "No tagline.",
      `Slicing: cover the lockup (plus ${Math.round(SHUTTER.pad * 100)}% of the wordmark size above and below) with ${n} full-width bands, each ${r(bandH)}px tall and overflow: hidden. Each band holds a full copy of the lockup offset upward by the band's own top, so together they show it whole. No CSS masks.`,
      "",
      `Motion: band i starts at frame ${SHUTTER.start} + ${STAGGER}·i (top to bottom), runs ${SHUTTER.slide} frames on travel ${bezierText("travel")}:`,
      `- even bands come from the left, odd bands from the right, starting ${Math.round(SHUTTER.travel * 100)}% of the frame width (${Math.round(SHUTTER.travel * c.width)}px) off their place;`,
      `- each band starts skewed ${SHUTTER.skew}° into its direction of travel (top edge ahead) and settles to 0°, and fades in over its first ${SHUTTER.fade} frames.`,
      `The last band lands on frame ${lock}; swap the bands for one clean, unsliced lockup in the same place so no seams remain.`,
      `Frames ${lock + SHUTTER.rule[0]}–${lock + SHUTTER.rule[1]}: a ${STROKE.hair}px ${p.accent} rule, the wordmark's width, draws left to right ${r(SHUTTER.ruleY * L.font - L.font)}px below the wordmark's line box (scaleX 0 → 1, enter ${bezierText("enter")}).`,
      ...(hasTag ? [`Frames ${lock + SHUTTER.tag[0]}–${tagEnd}: the tagline rises ${SHUTTER.tagRise}px and fades to 60% on enter.`] : []),
      `Hold the finished lockup perfectly still from frame ${hasTag ? tagEnd : lock + SHUTTER.rule[1]} to frame ${DURATION} (at least the last ${FINAL_HOLD} frames).`,
    ].join("\n");
  },
});
