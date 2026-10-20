import { FINAL_HOLD, STROKE, bezierText, targetLine } from "../../kit";
import { FILM, SAMPLE } from "../../film";
import { defineMotion } from "../../types";
import { CAP, LIGHT, SHOTS, SPEC, T, TypeSpecimen, X_HEIGHT, initialOf, type TypeSpecimenProps } from "./TypeSpecimen";

const look = (name: string, field: string, ink: string) => ({ name, swatch: [field, ink], values: { field, ink } });

const palettes = [
  look("White", FILM.white, FILM.black),
  look("Cream", FILM.cream, "#111111"),
  look("Black", FILM.black, FILM.white),
  look("Lavender", FILM.lavender, "#111111"),
];

export default defineMotion<TypeSpecimenProps>({
  slug: "type-specimen",
  name: "Type Specimen",
  description: "A calm brand specimen: a turning dot sphere, construction circles, an outline initial filling solid and the wordmark in a measured box.",
  category: "templates",
  tags: ["logo reveal", "brand", "type", "specimen"],
  addedAt: "2026-10-21",
  durationInFrames: 240,
  fps: 30,
  ratios: ["16:9", "9:16"],
  component: TypeSpecimen,
  defaultProps: {
    ...palettes[0].values,
    brand: SAMPLE.brand,
    word1: "Simplicity",
    word2: "Space",
    word3: "Precision",
    logo: SAMPLE.logo,
    density: 26,
  } as TypeSpecimenProps,
  palettes,
  controls: [
    { type: "text", key: "brand", label: "Brand", maxLength: 14 },
    { type: "text", key: "word1", label: "Word one", maxLength: 16 },
    { type: "text", key: "word2", label: "Word two", maxLength: 16 },
    { type: "text", key: "word3", label: "Word three", maxLength: 16 },
    { type: "image", key: "logo", label: "Logo", hint: "PNG or SVG, transparent" },
    { type: "color", key: "field", label: "Field" },
    { type: "color", key: "ink", label: "Ink" },
    { type: "number", key: "density", label: "Sphere dots", min: 18, max: 28, step: 1, unit: "per row" },
  ],
  prompt: (p, c) => {
    const v = c.height > c.width;
    const S = SPEC(v);
    const ch = initialOf(p.brand);
    const end = c.seconds * c.fps;
    const [s1, s2, s3, s4] = SHOTS;
    const at = (shot: number, f: number) => shot + f;
    const enter = bezierText("enter");
    const travel = bezierText("travel");
    return [
      targetLine(c.target, `a four-shot type-specimen film that ends on the ${p.brand} wordmark`, c.width, c.height, c.seconds),
      `Every shot is a flat ${p.field} field with ${p.ink} type and drawing. Hairlines are ${STROKE.hair}px in ${p.ink} at 25% (circles 30%); measurement marks are ${FILM.select}. No gradients, glows, shadows or other colours. Hard cuts at frames ${SHOTS.join(", ")}. Sizes are px at 1080 on the short side. Curves: enter ${enter}, travel ${travel}.`,
      `Captions: Geist Mono 18px, ${p.ink} at 45%, 56px from the edges. Top-right names the shot ("${p.brand} Identity", "Construction", "${p.brand} Sans · Bold", "Wordmark"); bottom-left counts "01 / 04" to "04 / 04".`,
      `Shot 1 (frames ${s1}–${s2 - 1}): a ${S.sphere}px halftone dot sphere ${v ? "centred at 40% height" : "330px left of centre"}. A ${p.density}×${p.density} grid of dots clipped to the circle; each dot's radius = cell/2 × (0.12 + 0.68 × (1 − Lambert)), so lit dots are small. The light sits ${LIGHT.elevation} rad above the horizon and its azimuth sweeps ${LIGHT.from} → ${LIGHT.to} rad linearly across the shot, so the sphere seems to turn. It fades in and scales 0.96 → 1 over frames ${T.sphereIn[0]}–${T.sphereIn[1]} on enter.`,
      `${v ? "Below the sphere, left-aligned with its edge" : "To its right (150px right of centre), vertically centred"}: a list in Geist Mono ${S.word}px, "${p.word1}", "${p.word2}", "${p.word3}", each with a 7px filled bullet, rows ${(S.word * 1.9).toFixed(0)}px apart. Rows rise 12px and fade in over ${T.wordDur} frames on enter, from frame ${T.wordsFrom}, staggered ${T.wordStagger} frames.`,
      `Shot 2 (frames ${s2}–${s3 - 1}): a construction drawing centred. A full-frame horizontal and vertical crosshair grows out from the centre (frames ${at(s2, T.cross[0])}–${at(s2, T.cross[1])}, travel). Two concentric circles, r ${S.outer}px and ${S.inner}px, draw on clockwise from 12 o'clock via strokeDashoffset (frames ${at(s2, T.outer[0])}–${at(s2, T.outer[1])} and ${at(s2, T.inner[0])}–${at(s2, T.inner[1])}, travel). Hollow 10px node circles (filled ${p.field}, ${p.ink} at 55% stroke) pop in at the outer circle's four crosshair intersections from frame ${at(s2, T.nodesFrom)}, 3 frames apart, scaling 0.6 → 1 on enter.`,
      `On top, the initial "${ch}" as an outline glyph: SVG text, Inter 600 at ${S.glyph}px, no fill, 2px ${p.ink} stroke, cap height (${CAP} em) centred on the crosshair. It draws on via strokeDashoffset over frames ${at(s2, T.glyph[0])}–${at(s2, T.glyph[1])} on travel.`,
      `Shot 3 (frames ${s3}–${s4 - 1}): two "${ch}" glyphs at Inter 600 ${S.pair}px, ${v ? "stacked (outline centred at 32% height, the other at 66%)" : "330px either side of centre"}. The ${v ? "top" : "left"} one is the outline; the ${v ? "bottom" : "right"} one starts as an outline and fills solid ${p.ink} via a left-to-right clip-path wipe, frames ${at(s3, T.wipe[0])}–${at(s3, T.wipe[1])} on travel. ${v ? "A baseline hairline under each, 120px from the frame edges" : "One 1400px baseline hairline under both"}, drawn left to right over frames ${at(s3, T.base[0])}–${at(s3, T.base[1])} (travel). Geist Mono 16px labels at 45% under the baseline: "Outline · 2 px" and "Solid · 600".`,
      `Shot 4 (frames ${s4}–${end - 1}): ${v ? `the solid initial "${ch}" (Inter 600, ${S.initial}px) centred at 36% height, and the lockup centred at 64% height` : "the lockup centred"}. The lockup is the user's logo file at ${S.logo}px tall followed by "${p.brand}" in Inter 500 at ${Math.round(S.logo * 0.82)}px, -0.02em, gap ${Math.round(S.logo * 0.32)}px, in ${p.ink}. It fades in and scales 0.98 → 1 over frames ${at(s4, T.lockup[0])}–${at(s4, T.lockup[1])} on enter.`,
      `Then a ${FILM.select} ${STROKE.hair}px measurement box (24px vertical, 36px horizontal padding around the lockup) draws its perimeter top → right → bottom → left over frames ${at(s4, T.box[0])}–${at(s4, T.box[1])} on travel. Nine tick marks hang from its bottom edge (14px at the ends and middle, 8px between) and fade in over frames ${at(s4, T.ticks[0])}–${at(s4, T.ticks[1])}; a Geist Mono 16px label "x-height ${X_HEIGHT.toFixed(2)}" in ${FILM.select} sits 30px below, rising 6px as it fades in over frames ${at(s4, T.label[0])}–${at(s4, T.label[1])}.`,
      `Frames ${end - FINAL_HOLD}–${end}: hold perfectly still on the wordmark. Drive everything from the frame number; no CSS animation or randomness.`,
    ].join("\n");
  },
});
