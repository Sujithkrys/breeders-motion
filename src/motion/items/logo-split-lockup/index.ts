import { FILM, SAMPLE } from "../../film";
import { ACCENT, FINAL_HOLD, STROKE, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { SPLIT, SplitLockup, sizesFor, type SplitLockupProps } from "./SplitLockup";

const palettes = [
  ...systemPalettes((t) => ({ background: t.bg, ink: t.ink, accent: t.accent })),
  { name: "Black", swatch: [FILM.black, FILM.white, ACCENT.orange], values: { background: FILM.black, ink: FILM.white, accent: ACCENT.orange } },
];

const DURATION = 150;

export default defineMotion<SplitLockupProps>({
  slug: "logo-split-lockup",
  name: "Split Lockup",
  description: "The mark arrives alone, splits like a pair of doors to let the wordmark rise between them, then closes into a clean lockup.",
  category: "logo",
  tags: ["logo", "split", "lockup", "reveal", "wordmark"],
  addedAt: "2026-10-22",
  durationInFrames: DURATION,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: SplitLockup,
  defaultProps: {
    ...palettes[0].values,
    logo: SAMPLE.logo,
    brand: SAMPLE.brand,
    tagline: "Light for focused teams",
    gap: 88,
  } as SplitLockupProps,
  palettes,
  controls: [
    { type: "image", key: "logo", label: "Logo", hint: "PNG or SVG, square mark works best" },
    { type: "text", key: "brand", label: "Brand name", maxLength: 16 },
    { type: "text", key: "tagline", label: "Tagline", maxLength: 40 },
    { type: "color", key: "accent", label: "Cut line" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "gap", label: "Split gap", min: 40, max: 160, step: 8, unit: "px" },
  ],
  prompt: (p, c) => {
    const u = Math.min(c.width, c.height) / 1080;
    const Z = sizesFor(p, c.width, c.height, u);
    const r = (n: number) => Math.round(n / u);
    const V = Z.regime === "vertical";
    const f = (a: readonly [number, number]) => `frames ${a[0]}–${a[1]} (${secs(a[0], c.fps)}–${secs(a[1], c.fps)})`;
    const halves = V ? "top and bottom halves" : "left and right halves";
    const [h1, h2] = V ? ["top", "bottom"] : ["left", "right"];
    const M = r(Z.mark);
    return [
      targetLine(c.target, `a logo reveal for "${p.brand}": the mark arrives alone, splits into ${halves} that open like doors while the wordmark rises between them, then closes into a clean mark + wordmark lockup`, c.width, c.height, c.seconds),
      `Colours: flat ${p.background} background, wordmark ${p.ink}, one ${p.accent} cut line. No gradients, glows or shadows. Sizes are px at 1080 on the short side.`,
      `Final lockup (centred, ${V ? "stacked: mark above the wordmark" : "one row: mark left of the wordmark"}): the user's logo file in a ${M}×${M}px box with object-fit: contain, ${r(Z.join)}px gap, then "${p.brand}" in Inter ${SPLIT.weight}, ${r(Z.word)}px, tracking ${SPLIT.tracking}em, ${p.ink}.${p.tagline ? ` Tagline "${p.tagline}" ${r(Z.tagGap)}px below, centred, in Inter 400, ${r(Z.tag)}px, -0.01em, ${p.ink} at 60% opacity.` : ""}`,
      `Halves: slice the logo with two overflow-hidden boxes, each holding the full-size image offset so its half shows (no CSS masks); overlap them by 0.75px so the closed mark has no seam.`,
      `${f(SPLIT.intro)}: the mark alone, centred, ${SPLIT.hero}px, scales ${SPLIT.heroFrom} → 1 on a ${bezierText("spring")} and fades in over the first ${SPLIT.fade} frames.`,
      `${f(SPLIT.cutIn)}: a ${STROKE.ring}px round-ended ${p.accent} line draws along the seam (${V ? "left → right" : "top → bottom"}), running ${SPLIT.overhang}px past the mark at both ends, on enter ${bezierText("enter")}; ${f(SPLIT.cutOut)} it retracts out of the far end on exit ${bezierText("exit")}.`,
      `${f(SPLIT.open)}: the ${halves} slide apart like doors on travel ${bezierText("travel")} while the mark shrinks ${SPLIT.hero} → ${M}px, until each half sits ${p.gap}px from the wordmark (half · gap · wordmark · gap · half, centred on the wordmark).`,
      `${f(SPLIT.word)}: behind the doors, "${p.brand}" rises from below inside an overflow-hidden mask ${r(Z.slot)}px tall, on enter ${bezierText("enter")}.`,
      `${f(SPLIT.close)}: on travel, the ${h2} half slides back past the wordmark, passing behind its mask (the mask is filled with ${p.background}, so the half disappears into one side of the word and emerges from the other), and rejoins the ${h1} half as the whole mark at the lockup's ${V ? "top" : "left"}. At the same time the group recentres, so the wordmark settles ${r((Z.mark + Z.join) / 2)}px ${V ? "down" : "right"}.`,
      p.tagline ? `${f(SPLIT.tagline)}: the tagline fades 0 → 60% and rises ${SPLIT.rise}px on enter.` : `No tagline.`,
      `Everything has landed by frame ${p.tagline ? SPLIT.tagline[1] : SPLIT.close[1]}; hold the finished lockup perfectly still to frame ${DURATION} (at least the last ${FINAL_HOLD} frames). The poster frame is the clean mark + wordmark lockup.`,
    ].join("\n");
  },
});
