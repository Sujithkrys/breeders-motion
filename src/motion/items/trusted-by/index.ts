import { FILM, SAMPLE, customerLogo } from "../../film";
import { FINAL_HOLD, SPRING_CONFIG, STAGGER, STROKE, bezierText, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import {
  CORNER,
  LOGO_KEYS,
  LOGO_NAMES,
  MARGIN,
  OPACITY,
  OVERSHOOT,
  SHOTS,
  SIZE,
  T,
  TRACK,
  TrustedBy,
  countOf,
  fmt,
  headlineRows,
  isDark,
  isSampleLogo,
  textOn,
  type TrustedByProps,
} from "./TrustedBy";

// Each colourway sets the headline / logo-wall field and the stats band together. The sample logos follow the field:
// ink on light fields, white on dark ones (uploads are never touched).
const looks: { name: string; field: string; band: string }[] = [
  { name: "White", field: FILM.white, band: FILM.black },
  { name: "Cream", field: FILM.cream, band: FILM.green },
  { name: "Grey", field: FILM.canvas, band: FILM.plum },
  { name: "Black", field: FILM.black, band: FILM.white },
];
const palettes = looks.map((l) => ({ name: l.name, swatch: [l.field, l.band], values: { field: l.field, band: l.band } }));

const logoDefaults = Object.fromEntries(LOGO_KEYS.map((k, i) => [k, customerLogo(LOGO_NAMES[i], "ink")])) as Record<(typeof LOGO_KEYS)[number], string>;

export default defineMotion<TrustedByProps>({
  slug: "trusted-by",
  name: "Trusted By",
  description: "A counted customer headline, a hairline logo wall with a highlight sweep, then three proof numbers and your logo.",
  category: "templates",
  tags: ["social proof", "customers", "logo wall", "stats", "launch"],
  addedAt: "2026-10-21",
  durationInFrames: 240,
  fps: 30,
  ratios: ["16:9", "9:16"],
  component: TrustedBy,
  defaultProps: {
    ...palettes[0].values,
    caption: "Customers · 2026",
    lead: "Trusted by",
    count: 4000,
    countSuffix: "+",
    noun: "teams",
    ...logoDefaults,
    stat1Value: "98%",
    stat1Label: "retention",
    stat2Value: "12M",
    stat2Label: "events a day",
    stat3Value: "4.9",
    stat3Label: "average rating",
    brand: SAMPLE.brand,
    logo: SAMPLE.logo,
  } as TrustedByProps,
  palettes,
  controls: [
    { type: "text", key: "lead", label: "Headline lead", maxLength: 20 },
    { type: "number", key: "count", label: "Customer count", min: 10, max: 999999, step: 10 },
    { type: "text", key: "countSuffix", label: "Count suffix", maxLength: 3 },
    { type: "text", key: "noun", label: "Customers are", maxLength: 16 },
    { type: "text", key: "caption", label: "Caption", maxLength: 28 },
    ...LOGO_KEYS.map((key, i) => ({ type: "image" as const, key, label: `Customer logo ${i + 1}`, hint: "Transparent PNG or SVG, wordmark ~3:1" })),
    { type: "text", key: "stat1Value", label: "Stat 1 value", maxLength: 8 },
    { type: "text", key: "stat1Label", label: "Stat 1 label", maxLength: 24 },
    { type: "text", key: "stat2Value", label: "Stat 2 value", maxLength: 8 },
    { type: "text", key: "stat2Label", label: "Stat 2 label", maxLength: 24 },
    { type: "text", key: "stat3Value", label: "Stat 3 value", maxLength: 8 },
    { type: "text", key: "stat3Label", label: "Stat 3 label", maxLength: 24 },
    { type: "text", key: "brand", label: "Brand name", maxLength: 16 },
    { type: "image", key: "logo", label: "Your logo", hint: "PNG or SVG, transparent" },
    { type: "color", key: "field", label: "Field" },
    { type: "color", key: "band", label: "Stats band" },
  ],
  prompt: (p, c) => {
    const tall = c.height > c.width;
    const L = tall ? SIZE.tall : SIZE.wide;
    const end = c.seconds * c.fps;
    const ink = textOn(p.field);
    const bandInk = textOn(p.band);
    const enter = `enter, ${bezierText("enter")}`;
    const f = (shot: number, local: number) => SHOTS[shot] + local;
    const head = headlineRows(p, tall, L.headMaxW, L.headline);
    const rowsText = head.rows.map((r) => `"${r.map((t) => t.text).join(" ")}"`).join(" / ");
    const total = countOf(p.count);
    const dark = isDark(p.field);
    const cellW = L.gridW / L.cols;
    const sampleCount = LOGO_KEYS.filter((k) => isSampleLogo(String(p[k] || ""))).length;
    const logosText =
      sampleCount === LOGO_KEYS.length
        ? `eight sample customer wordmarks (transparent PNGs, ~3:1, ${dark ? "white" : "ink #111111"} versions to suit the field)`
        : `the user's eight customer logo files${sampleCount ? ` (${sampleCount} still sample wordmarks in ${dark ? "white" : "ink"})` : ""}`;
    const stats = [
      [p.stat1Value, p.stat1Label],
      [p.stat2Value, p.stat2Label],
      [p.stat3Value, p.stat3Label],
    ]
      .map(([v, l]) => `"${v}" / "${l}"`)
      .join(", ");
    return [
      targetLine(c.target, "a three-shot social-proof film: a counted customer headline, a logo wall, then proof numbers and the logo", c.width, c.height, c.seconds),
      `Hard cuts at frames ${SHOTS.join(", ")} (no transitions). Flat colour fields only: no gradients, glows or text shadows. Inter only (Geist Mono for tiny labels), sentence case. Sizes are px at 1080 on the short side.`,
      `Every shot has two corner marks ${MARGIN}px in from the top: the shot index ("01 / 03") top-left and "${p.brand.toUpperCase()}" top-right, Geist Mono ${CORNER}px, tracking 0.12em, ink at ${Math.round(OPACITY.corner * 100)}%.`,
      `Shot 1 (frames ${SHOTS[0]}–${SHOTS[1]}): flat ${p.field}, type ${ink}. The whole shot pushes in slowly, scale 1 → ${1 + T.push} linear over the shot.`,
      `Centred: a caption "${p.caption.toUpperCase()}" (Geist Mono ${L.caption}px, tracking 0.12em, ${Math.round(OPACITY.caption * 100)}% ink) led by a 10px ${FILM.orange} dot, fading in and rising 8px over frames ${T.caption[0]}–${T.caption[1]} on ${enter}; ${L.captionGap}px below it the headline.`,
      `Headline ${rowsText} at ${Math.round(head.size)}px, tracking ${TRACK.headline}em, line height 1.0, centred${tall ? ", stacked" : head.rows.length === 1 ? ", on one line" : ", on two lines"}: words in Inter 500, the number in Inter 600 (the one weight jump). Each row sits in an overflow-hidden mask; each word rises from translateY(115%) to 0 over ${T.wordDur} frames on enter, from frame ${T.wordStart}, ${STAGGER} frames apart.`,
      `The number counts from 0 to ${fmt(total)} with thousands separators over ${T.count} frames on ${enter}, starting with its own rise, rendered as one text node per frame ("${head.numText}" at the end). A hidden copy of the final value reserves its width and the live value sits right-aligned over it, so the line never reflows.`,
      `Shot 2 (frames ${SHOTS[1]}–${SHOTS[2]}): same field, slow push-in 1 → ${1 + T.push} linear. A ${L.cols}×${L.rows} logo wall, ${L.gridW}×${L.cellH * L.rows}px (cells ${Math.round(cellW)}×${L.cellH}px), centred ${L.gridDY}px below centre, drawn as one SVG of ${STROKE.hair}px hairlines in ink at ${Math.round(OPACITY.line * 100)}%, each running ${OVERSHOOT}px past the outer edge like crop marks on a spec sheet.`,
      `The hairlines draw on (horizontals left → right, then verticals top → bottom), each over ${T.gridDraw} frames on enter, ${T.gridStagger} frames apart. Tiny cell numbers "01"–"08" (Geist Mono 14px, ${Math.round(OPACITY.index * 100)}% ink) sit 18px in from each cell's top-left. Above the wall, Geist Mono ${L.header}px at ${Math.round(OPACITY.caption * 100)}%: "${p.caption.toUpperCase()}" left and "${`${fmt(total)}${p.countSuffix} ${p.noun}`.toUpperCase()}" right, fading in and rising 8px over frames ${f(1, T.header[0])}–${f(1, T.header[1])}.`,
      `In the cells: ${logosText}, each ${L.logoH}px tall with width auto (never stretched, at most 72% of the cell width), centred. They enter on a diagonal (column + row) from frame ${f(1, T.logoStart)}, ${STAGGER} frames per diagonal: fade in and rise ${T.logoRise}px on a ${bezierText("spring")}, settling at ${Math.round(OPACITY.rest * 100)}% opacity.`,
      `Frames ${f(1, T.sweep[0])}–${f(1, T.sweep[1])}: a soft highlight sweeps ${tall ? "down the wall row by row, left cell before right" : "across the wall left → right, bottom row half a step behind the top"} (linear): the wall dims to ${Math.round(OPACITY.dim * 100)}% (travel, ${bezierText("travel")}), the logo under the sweep goes to 100% and its cell fills with ink at ${OPACITY.cellFill * 100}%, then the wall returns to ${Math.round(OPACITY.rest * 100)}% by frame ${f(1, T.dimOut[1])}.`,
      `Shot 3 (frames ${SHOTS[2]}–${end}): flat ${p.band}, type ${bandInk}. Three stats ${stats}, ${tall ? `stacked in ${SIZE.tall.rowH}px rows across ${L.statsW}px, with horizontal hairlines between them drawing left → right` : `in three ${Math.round(L.statsW / 3)}px columns across ${L.statsW}px, with ${SIZE.wide.sepH}px vertical hairlines between them drawing top → bottom`} over frames ${f(2, T.sepDraw[0])}–${f(2, T.sepDraw[1])} (${STROKE.hair}px, ${Math.round(OPACITY.line * 100)}% ink).`,
      `Each value is Inter 600 ${L.value}px, tracking ${TRACK.value}em, centred, rising out of a mask from frame ${f(2, T.valueStart)} over ${T.valueDur} frames on enter, ${STAGGER} frames apart; its label sits 22px below in Geist Mono ${L.label}px at ${Math.round(OPACITY.label * 100)}% ink, fading in and rising 12px from frame ${f(2, T.labelStart)}, ${STAGGER} frames apart.`,
      `The user's logo file at ${L.brand}px tall followed by "${p.brand}" (Inter 500 ${Math.round(L.brand * 0.82)}px), centred ${L.brandBottom}px above the bottom edge, fading in and scaling 0.96 → 1 over frames ${f(2, T.brandIn[0])}–${f(2, T.brandIn[1])} on enter.`,
      `Hold the stats card still to the end; the last ${FINAL_HOLD} frames (${end - FINAL_HOLD}–${end}) are perfectly still. Spring config: damping ${SPRING_CONFIG.damping}, mass ${SPRING_CONFIG.mass}, stiffness ${SPRING_CONFIG.stiffness}.`,
    ].join("\n");
  },
});
