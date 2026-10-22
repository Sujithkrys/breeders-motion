import { ACCENT, CANVAS, FINAL_HOLD, bezierText, systemPalettes, targetLine } from "../../kit";
import { SAMPLE } from "../../film";
import { defineMotion } from "../../types";
import { TW, TypewriterLockup, layoutFor, timelineFor, type TypewriterLockupProps } from "./TypewriterLockup";

const colours = (t: { bg: string; ink: string; ink2: string; accent: string }) => ({
  background: t.bg,
  ink: t.ink,
  ink2: t.ink2,
  accent: t.accent,
});
const palettes = [
  ...systemPalettes(colours),
  {
    name: "Black",
    swatch: ["#000000", CANVAS.ink.ink, ACCENT.orange],
    values: colours({ ...CANVAS.ink, bg: "#000000", accent: ACCENT.orange }),
  },
];

const DURATION = 120;
const fmt = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));

export default defineMotion<TypewriterLockupProps>({
  slug: "logo-typewriter",
  name: "Typewriter Lockup",
  description: "The brand name types out in mono, re-flows letter by letter into the Inter wordmark, and the caret becomes its full stop.",
  category: "logo",
  tags: ["logo", "wordmark", "typewriter", "morph", "caret"],
  addedAt: "2026-10-22",
  durationInFrames: DURATION,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: TypewriterLockup,
  defaultProps: {
    ...palettes[0].values,
    logo: SAMPLE.logo,
    brand: SAMPLE.brand,
    tagline: "Clarity for every team",
    speed: 3,
  } as TypewriterLockupProps,
  palettes,
  controls: [
    { type: "image", key: "logo", label: "Logo", hint: "PNG or SVG, square mark works best" },
    { type: "text", key: "brand", label: "Brand name", maxLength: 14 },
    { type: "text", key: "tagline", label: "Tagline", maxLength: 40 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "number", key: "speed", label: "Typing speed", min: 2, max: 5, step: 1, unit: "f/char" },
  ],
  prompt: (p, c) => {
    const u = Math.min(c.width, c.height) / 1080;
    const vertical = c.height > c.width;
    const tag = String(p.tagline ?? "").trim();
    const L = layoutFor(p.brand, Boolean(tag), c.width, c.height, u);
    const T = timelineFor(L.chars.length, p.speed);
    const r = (n: number) => Math.round(n / u);
    const size = r(L.size);
    const end = tag ? T.tag[1] : Math.max(T.lettersEnd, T.caret[1], T.mark[1]);
    return [
      targetLine(c.target, `a typewriter logo lockup for "${p.brand}": the name types out in mono, re-flows into the Inter wordmark, the caret becomes a full stop and the user's logo pops in`, c.width, c.height, c.seconds),
      `Background: flat ${p.background}, nothing else. Sizes are px at 1080 on the short side. No gradients, glows or shadows. The caret is the only accent.`,
      `Type: both families at ${size}px (140px at 16:9, shrunk to fit the width). Typed text in Geist Mono 400 (every glyph 0.6em wide), centred in the frame; final wordmark in Inter ${TW.weight}, tracking ${TW.tracking}em; both in ${p.ink}. Every character is its own absolutely placed span with one text node, and the two families share one baseline.`,
      `Caret: a ${r(TW.caret.w * L.size)}×${r(TW.caret.h * L.size)}px block (radius 0) in ${p.accent}, centred in the next mono cell, its bottom ${TW.caret.drop}em below the baseline.`,
      vertical
        ? `Final lockup (stacked): the user's logo file in a ${r(L.markS)}px square box (object-fit: contain), centred, ${TW.mark.stackGap}em above the wordmark's cap line; the wordmark plus its full stop centred under it.`
        : `Final lockup (one row): the user's logo file in a ${r(L.markS)}px square box (object-fit: contain), centred on the cap height, ${TW.mark.gap}em (${r(TW.mark.gap * L.size)}px) left of the wordmark; the whole row is centred.`,
      `Full stop: a ${r(TW.dot * L.size)}px ${p.accent} circle on the baseline, ${TW.dotGap}em after the last letter.${tag ? ` Tagline "${tag}" in Inter 400, ${r(L.tagSize)}px, -0.01em, ${p.ink2}, centred, its line box ${TW.tag.top}em of the type size below the baseline.` : ""}`,
      "",
      `Frames 0–${TW.typeAt}: the caret alone, blinking off for frames ${TW.blink[0]}–${TW.blink[1]}. From frame ${TW.typeAt} one character appears every ${fmt(T.spd)} frames (no fade), the caret jumping to the next cell; the last key lands at frame ${T.lastKey}.`,
      `From frame ${T.morph}: letter i starts its move ${fmt(T.ms)}×i frames later. Its mono glyph and its Inter twin travel together from the mono slot to the Inter slot over ${TW.letterDur} frames on ${bezierText("spring")}; the mono glyph fades out over the first ${TW.monoFade} frames on exit ${bezierText("exit")} while the Inter glyph fades in over frames ${TW.interFade[0]}–${TW.interFade[1]} of the move on enter ${bezierText("enter")}, so the letter widths re-flow smoothly.`,
      `Frames ${T.caret[0]}–${T.caret[1]}: on the same spring the caret travels to the end of the wordmark and shrinks from the block to the ${r(TW.dot * L.size)}px dot, its corners rounding into a circle.`,
      `Frames ${T.mark[0]}–${T.mark[1]}: the mark pops in, scale 0.6 → 1 on the spring, fading in over ${TW.mark.fade} frames.${tag ? ` Frames ${T.tag[0]}–${T.tag[1]}: the tagline fades in and rises ${TW.tag.rise}px on enter.` : ""}`,
      `Everything has landed by frame ${end}; hold the finished lockup perfectly still to frame ${DURATION} (at least the last ${FINAL_HOLD} frames).`,
    ].join("\n");
  },
});
