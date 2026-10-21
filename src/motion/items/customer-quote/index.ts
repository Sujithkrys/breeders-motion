import { FILM, SAMPLE, customerLogo } from "../../film";
import { CANVAS, FINAL_HOLD, STAGGER, STROKE, bezierText, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import {
  CustomerQuote,
  INK,
  MARK,
  MARKER,
  MASK,
  RING,
  SHOTS,
  SIZE,
  T,
  TYPE,
  isDark,
  layout,
  onMarker,
  type CustomerQuoteProps,
} from "./CustomerQuote";

const same = (a: string, b: string) => (a || "").slice(0, 7).toUpperCase() === (b || "").slice(0, 7).toUpperCase();

// Each colourway sets the field, the type and the marker together.
const looks: { name: string; field: string; ink: string; accent: string }[] = [
  { name: "Lavender", field: FILM.lavender, ink: CANVAS.paper.ink, accent: FILM.lime },
  { name: "Cream", field: FILM.cream, ink: CANVAS.paper.ink, accent: FILM.lavender },
  { name: "Black", field: FILM.black, ink: FILM.white, accent: FILM.green },
  { name: "Lime", field: FILM.lime, ink: CANVAS.paper.ink, accent: FILM.white },
];
const palettes = looks.map((l) => ({
  name: l.name,
  swatch: [l.field, l.ink, l.accent],
  values: { field: l.field, ink: l.ink, accent: l.accent },
}));

export default defineMotion<CustomerQuoteProps>({
  slug: "customer-quote",
  name: "Customer Quote",
  description: "One customer's words set as an editorial pull quote, a marker sweeping across the key phrase, then their photo, name and company logo.",
  category: "templates",
  tags: ["testimonial", "social proof", "quote", "customer", "editorial"],
  addedAt: "2026-10-21",
  durationInFrames: 240,
  fps: 30,
  ratios: ["16:9", "9:16"],
  component: CustomerQuote,
  defaultProps: {
    ...palettes[0].values,
    quote: "Lumen gave our team back four hours a week. Planning used to be a meeting; now it just happens.",
    highlight: "four hours a week",
    name: "Maya Jensen",
    role: "Head of Operations, Northwind",
    caption: "Customer story · 01",
    photo: SAMPLE.avatar,
    companyLogo: customerLogo("northwind"),
  } as CustomerQuoteProps,
  palettes,
  controls: [
    { type: "text", key: "quote", label: "Quote", maxLength: 160 },
    { type: "text", key: "highlight", label: "Highlighted phrase", maxLength: 48 },
    { type: "text", key: "name", label: "Name", maxLength: 28 },
    { type: "text", key: "role", label: "Role and company", maxLength: 48 },
    { type: "text", key: "caption", label: "Caption", maxLength: 28 },
    { type: "image", key: "photo", label: "Photo", hint: "Square headshot, at least 256 × 256" },
    { type: "image", key: "companyLogo", label: "Company logo", hint: "PNG or SVG, transparent, in the type colour" },
    { type: "color", key: "field", label: "Field" },
    { type: "color", key: "ink", label: "Type" },
    { type: "color", key: "accent", label: "Marker" },
  ],
  prompt: (p, c) => {
    const tall = c.height > c.width;
    const L = tall ? SIZE.tall : SIZE.wide;
    const k = Math.min(c.width, c.height) / 1080;
    const lay = layout(p, tall, c.width / k, c.height / k);
    const end = Math.round(c.seconds * c.fps);
    const f = (shot: number, local: number) => SHOTS[shot] + local;
    const r = (n: number) => Math.round(n);
    const enter = `enter, ${bezierText("enter")}`;
    const travel = `travel, ${bezierText("travel")}`;
    const mOn = onMarker(p.accent, p.ink);
    const rowsText = lay.rows.map((row) => `"${row.map((w) => w.text).join(" ")}"`).join(" / ");
    const phrase = lay.range ? p.quote.slice(lay.range[0], lay.range[1]) : "";
    const lastPiece = f(2, T.row + 3 * STAGGER + T.rowDur);
    const markerLine = lay.range
      ? [
          `Frames ${f(1, lay.marker[0])}–${f(1, lay.marker[1])}: a flat ${p.accent} marker (square corners) wipes in left→right behind "${phrase}" on ${travel}, sweeping word by word${lay.rows.filter((row) => row.some((w) => w.parts.some((x) => x.hl))).length > 1 ? ", carrying on to the next row where the phrase wraps" : ""}.`,
          `Build it so it lines up exactly: each highlighted word (or the highlighted part of a word, e.g. without its trailing punctuation) is its own inline-block span holding one absolutely positioned rect and the word's single text node above it. The rect runs from ${MARKER.top}em to ${MARKER.bottom}em of the ${TYPE.lineH}em line box, overshoots the phrase's first and last letters by ${MARKER.pad}em, bridges the ${TYPE.gap}em word gaps, and scales from scaleX(0) with transform-origin left as the sweep reaches it.`,
          same(mOn, p.ink) ? `Type on the marker stays ${p.ink}.` : `As the marker passes each word its type turns ${mOn} (derived from the marker's brightness).`,
        ].join(" ")
      : `No marker: the highlighted phrase "${p.highlight}" isn't in the quote, so the quote holds plain.`;
    const attribution = tall
      ? `${L.gapRow}px below it, the attribution stacks left-aligned: the user's headshot in a ${L.photo}px circle (object-fit cover) with a ${STROKE.hair}px hairline ring at ${Math.round(RING.opacity * 100)}% ink ${RING.gap}px outside it; ${L.stackGap}px below, "${p.name}" in Inter 600 ${L.name}px, tracking ${TYPE.nameTrack}em, over "${p.role}" in Inter 400 ${L.role}px at ${Math.round(INK.role * 100)}% ink, ${L.roleGap}px apart; ${L.logoGap}px below, the user's company logo file at ${L.logo}px tall (width auto, never stretched).`
      : `${L.gapRow}px below it, the attribution row across the column: the user's headshot in a ${L.photo}px circle (object-fit cover) with a ${STROKE.hair}px hairline ring at ${Math.round(RING.opacity * 100)}% ink ${RING.gap}px outside it; ${L.nameGap}px to its right "${p.name}" in Inter 600 ${L.name}px, tracking ${TYPE.nameTrack}em, over "${p.role}" in Inter 400 ${L.role}px at ${Math.round(INK.role * 100)}% ink, ${L.roleGap}px apart, the pair centred on the photo; the user's company logo file at ${L.logo}px tall (width auto, never stretched) right-aligned to the column's end, centred on the row.`;
    return [
      targetLine(c.target, "a customer-quote film: one customer's words set as an editorial pull quote on a flat colour field, a marker sweeping across the key phrase, then their photo, name and company logo", c.width, c.height, c.seconds),
      `One continuous scene on flat ${p.field} with ${p.ink} type: no gradients, glows or text shadows. Internal beats at frames ${SHOTS.join(", ")} with nothing cut away. Inter only (Geist Mono for the caption), sentence case. Sizes are px at 1080 on the short side.`,
      `Everything left-aligns to a ${L.colW}px column centred in the frame (x ${r(lay.colX)}px). The stack (quote mark, quote and, later, the attribution) is centred vertically: its top sits at y ${r(lay.topA)}px, then at frames ${f(2, T.glide[0])}–${f(2, T.glide[1])} it glides to y ${r(lay.topB)}px on ${travel} to make room for the attribution.`,
      `Beat 1 (frames ${SHOTS[0]}–${SHOTS[1]}): a huge opening quotation mark “ in Inter 600 ${L.mark}px, ${p.ink} at 100%, its glyph top on the stack top (draw it as SVG text with the baseline ${MARK.capTop}em below that top). It scales 0.9→1 from its top-left corner on a ${bezierText("spring")} while fading in over ${T.markFade} frames.`,
      `Caption at y ${L.captionTop}px, right-aligned to the column's end: "${p.caption}" in Geist Mono ${L.caption}px at ${Math.round(INK.caption * 100)}% ink, with a 48px ${STROKE.hair}px hairline at ${Math.round(INK.rule * 100)}% ink 16px to its left. The hairline draws left→right over frames ${T.rule[0]}–${T.rule[1]} on ${travel}; the caption rises ${T.captionRise}px and fades in over frames ${T.caption[0]}–${T.caption[1]} on ${enter}.`,
      `Beat 2 (frames ${SHOTS[1]}–${SHOTS[2]}): ${L.gapMark}px below the quote mark, the quote in Inter 500 ${r(lay.size)}px, line height ${TYPE.lineH}, tracking ${TYPE.track}em, ${p.ink}, in these balanced rows: ${rowsText}.`,
      `Each row is an overflow-hidden mask (padded ${MASK.y}em / ${MASK.x}em, with matching negative margins). Every word is its own inline-block span rising from translateY(115%) to 0 over ${T.wordDur} frames on ${enter}. Rows start ${T.lineGap} frames apart from frame ${f(1, T.wordStart)}; words within a row are ${STAGGER} frames apart (capped at ${T.maxStagger} steps).`,
      markerLine,
      `Beat 3 (frames ${SHOTS[2]}–${end}): ${L.gapDivider}px below the quote, a ${L.colW}px hairline divider (${STROKE.hair}px, ${p.ink} at ${Math.round(INK.divider * 100)}%) draws left→right over frames ${f(2, T.divider[0])}–${f(2, T.divider[1])} on ${travel}.`,
      attribution,
      `The photo, name, role and logo each rise ${T.rowRise}px and fade in over ${T.rowDur} frames on ${enter}, from frame ${f(2, T.row)}, ${STAGGER} frames apart.`,
      isDark(p.field) ? `The field is dark, so use the white version of the logo.` : `The field is light, so use the ink version of the logo.`,
      `Everything is still from frame ${lastPiece}; the last ${FINAL_HOLD} frames (${end - FINAL_HOLD}–${end}) are perfectly still.`,
    ].join("\n");
  },
});
