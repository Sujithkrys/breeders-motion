import { FILM, SAMPLE } from "../../film";
import { FINAL_HOLD, STAGGER, STROKE, bezierText, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import {
  COMMA_EM,
  DIGIT_EM,
  DIM,
  DOTS,
  GAP,
  GLYPH,
  INK,
  LH,
  MONO,
  Milestone,
  PUSH,
  SHOTS,
  T,
  TRACK,
  VALUE,
  clampValue,
  formatValue,
  dotGrid,
  geometry,
  hexOf,
  textOn,
  type MilestoneProps,
} from "./Milestone";

// Each colourway sets the dot field, the lit-dot accent and the thank-you card together.
const looks: { name: string; field: string; accent: string; end: string }[] = [
  { name: "Black", field: FILM.black, accent: FILM.lime, end: FILM.lime },
  { name: "Green", field: FILM.green, accent: FILM.greenInk, end: FILM.cream },
  { name: "Plum", field: FILM.plum, accent: FILM.lavender, end: FILM.lavender },
  { name: "White", field: FILM.white, accent: FILM.orange, end: FILM.black },
];
const palettes = looks.map((l) => ({ name: l.name, swatch: [l.field, l.accent, l.end], values: { field: l.field, accent: l.accent, end: l.end } }));

export default defineMotion<MilestoneProps>({
  slug: "milestone",
  name: "Milestone",
  description: "A field of dots lights up from the centre while an odometer rolls to your milestone, a slow push-in with your line, then a quiet thank-you card.",
  category: "templates",
  tags: ["milestone", "counter", "celebration", "numbers", "community"],
  addedAt: "2026-10-21",
  durationInFrames: 240,
  fps: 30,
  ratios: ["16:9", "9:16"],
  component: Milestone,
  defaultProps: {
    ...palettes[0].values,
    value: 10000,
    caption: "Teams on Lumen",
    label: "teams now plan their week with Lumen",
    thanks: "Thank you.",
    brand: SAMPLE.brand,
    logo: SAMPLE.logo,
    date: "Oct 2026",
  } as MilestoneProps,
  palettes,
  controls: [
    { type: "number", key: "value", label: "Milestone", min: VALUE.min, max: VALUE.max, step: 1 },
    { type: "text", key: "caption", label: "Caption", maxLength: 28 },
    { type: "text", key: "label", label: "Line under the number", maxLength: 56 },
    { type: "text", key: "thanks", label: "Thank-you line", maxLength: 24 },
    { type: "text", key: "brand", label: "Brand name", maxLength: 16 },
    { type: "image", key: "logo", label: "Logo", hint: "PNG or SVG, transparent; shown on the thank-you card" },
    { type: "text", key: "date", label: "Date", maxLength: 16 },
    { type: "color", key: "field", label: "Field" },
    { type: "color", key: "accent", label: "Dots and underline" },
    { type: "color", key: "end", label: "Thank-you card" },
  ],
  prompt: (p, c) => {
    const tall = c.height > c.width;
    const short = Math.min(c.width, c.height);
    const W = (c.width * 1080) / short;
    const H = (c.height * 1080) / short;
    const G = geometry(W, H, 1, tall, p);
    const { L } = G;
    const grid = dotGrid(W, H);
    const end = c.seconds * c.fps;
    const ink = textOn(p.field);
    const endInk = textOn(p.end);
    const enter = `enter, ${bezierText("enter")}`;
    const r = Math.round;
    const n = G.str.replace(/,/g, "").length;
    const rowsText = (rows: string[][]) => rows.map((x) => `"${x.join(" ")}"`).join(" / ");
    const f = (local: number) => SHOTS[2] + local;
    const numberFit = G.fs < L.number - 0.5 ? ` (shrunk from ${L.number}px so the number stays within ${L.numberMaxW}px)` : "";
    return [
      targetLine(c.target, "a three-shot milestone film: a field of dots lighting up from the centre under an odometer counting to the milestone, a slow push-in with a line of copy, then a quiet thank-you card", c.width, c.height, c.seconds),
      `Shots start at frames ${SHOTS.join(", ")}: shots 1–2 are one continuous field and camera, frame ${SHOTS[2]} is a hard cut. Flat colour fields only: no gradients, glows, text shadows, confetti or sparkles. Inter only, with Geist Mono for tiny labels; sentence case. Sizes are px at 1080 on the short side.`,
      `Dot field (frames 0–${SHOTS[2]}): flat ${p.field}. One inline SVG of ${grid.cols * grid.rows} dots on a ${grid.cols}×${grid.rows} grid filling the frame (cells ${r(grid.sx)}×${r(grid.sy)}px), each dot moved up to ±${r(DOTS.jitter * 100)}% of a cell with Remotion random(seed), radius ${DOTS.r}px. Unlit dots are ${ink} at ${r(DOTS.base * 100)}% over the field (solid ${hexOf(p.field, ink, DOTS.base)}).`,
      `Each dot blends to ${p.accent} over ${DOTS.dur} frames on ${enter}, starting at frame ${DOTS.start} + ${DOTS.spread} × d + ${DOTS.wobble} × d × (0.5 + 0.5·sin(3θ + 1.3)) + random × ${DOTS.jitterF}, where d is the distance from the frame centre over the half-diagonal and θ its angle: the lit area grows outward from the centre like a population, with a slightly lumpy front, and reaches the corners by about frame ${r(DOTS.start + DOTS.spread + DOTS.wobble + DOTS.jitterF + DOTS.dur)}. Draw all unlit dots as one path and all fully lit dots as one path; only dots mid-transition or twinkling are their own circles.`,
      `Odometer: "${G.str}" in ${ink}, Inter 600 ${r(G.fs)}px${numberFit}, centred horizontally, its 1em box centred at y ${r(G.cy)}px. Every digit is its own column: a box exactly one line tall (${r(G.fs)}px, line-height ${r(G.fs)}px) and ${DIGIT_EM}em (${r(DIGIT_EM * G.fs)}px) wide with overflow hidden, placed only by its flex row so its content never grows it; each comma is a static ${COMMA_EM}em column. The ${TRACK.number}em tracking is built into the column width (no letter-spacing). Total width ${r(G.numW)}px.`,
      `Inside each column a strip of two stacked one-line cells (current digit, next digit; separate text nodes) moves up by translateY as the column turns, so exactly one line ever shows. It is a real count: the value rises from 0 to ${formatValue(clampValue(p.value))} over frames ${T.roll[0]}–${T.roll[1]} on ${enter}; the ones digit rests on each whole value and snaps to the next over the last 45% of each step (${bezierText("travel")}); a higher column turns only while every column to its right shows 9 and is turning over, like a mechanical counter, so the reading is never ahead of the count. Leading zeros sit at ${r(DIM * 100)}% opacity until the count reaches them; each comma follows the column to its left. The number fades in over frames ${T.numberIn[0]}–${T.numberIn[1]}.`,
      `Caption "${p.caption.toUpperCase()}" in Geist Mono ${MONO.caption}px, tracking ${TRACK.mono}em, ${ink} at ${r(INK.caption * 100)}%, centred, its box bottom ${GAP.caption}px above the digits' cap height (cap height sits ${GLYPH.top}em into the number's box); it fades in and rises 12px over frames ${T.marksIn[0]}–${T.marksIn[1]} on ${enter}. Corner marks outside the camera, at a ${L.margin}px margin: "${p.brand.toUpperCase()}" top-left and "${p.date.toUpperCase()}" top-right, Geist Mono ${MONO.mark}px, tracking ${TRACK.mono}em, ${ink} at ${r(INK.mark * 100)}%, fading in over the same frames.`,
      `Shot 2 (frames ${SHOTS[1]}–${SHOTS[2]}): camera push-in, scale 1→${PUSH} linear, origin at the number's centre (dots, caption, number, underline and label scale together; corner marks stay). The number holds. A ${p.accent} underline, ${r(G.numW)}px wide and ${STROKE.bar}px tall with pill ends, its top ${GAP.line}px below the baseline, draws from the left (scaleX 0→1) over frames ${T.underline[0]}–${T.underline[1]} on ${enter}.`,
      `${rowsText(G.label.rows)} in ${ink} at ${r(INK.label * 100)}%, Inter 500 ${r(G.label.size)}px, tracking ${TRACK.label}em, line height ${LH.label}, centred, top ${GAP.label}px below the underline${tall ? ", wrapped into balanced rows" : ""}. Word rise: each row in its own overflow-hidden mask, every word rising from translateY(115%) to 0 over ${T.wordDur} frames on ${enter}, from frame ${T.label}, ${STAGGER} frames apart (capped at ${T.maxStagger} steps).`,
      `The dots stay at their final state; ${r(DOTS.twinkle * 100)}% of them (chosen by random(seed)) twinkle: opacity 1 − a × (0.5 − 0.5·cos(phase + 2π(frame − ${SHOTS[1]}) / period)), period ${DOTS.periodMin}–${DOTS.periodMin + DOTS.periodRange} frames, a random phase, and a ramping in linearly from 0 to ${DOTS.twinkleAmp} over frames ${T.twinkleIn[0]}–${T.twinkleIn[1]} so nothing jumps at the cut.`,
      `Shot 3 (frames ${SHOTS[2]}–${end}): flat ${p.end}. ${rowsText(G.thanks.rows)} in ${endInk}, Inter 600 ${r(G.thanks.size)}px, tracking ${TRACK.thanks}em, line height ${LH.thanks}, centred 20px above the middle, with the same word rise from frame ${f(T.thanks)}.`,
      `Top-left at a ${L.margin}px margin: "${`${G.str} — ${p.caption}`.toUpperCase()}" in Geist Mono ${MONO.mark}px, tracking ${TRACK.mono}em, ${endInk} at ${r(INK.caption * 100)}%, fading in over frames ${f(T.stamp[0])}–${f(T.stamp[1])}. A ${STROKE.hair}px hairline in ${endInk} at ${r(INK.rule * 100)}% spans the width between the margins, ${GAP.rule}px above the bottom row, drawing from the left over frames ${f(T.rule[0])}–${f(T.rule[1])} on ${enter}.`,
      `Bottom row at a ${L.margin}px margin: the user's logo file at ${L.logo}px tall (width auto) followed by "${p.brand}" in Inter 500 ${r(L.logo * 0.82)}px, tracking -0.02em, ${endInk}, gap ${r(L.logo * 0.32)}px, bottom-left; "${p.date.toUpperCase()}" in Geist Mono ${MONO.date}px, tracking ${TRACK.mono}em, ${endInk} at ${r(INK.caption * 100)}%, bottom-right, vertically centred on the logo. Each fades in and rises 16px on ${enter}: logo frames ${f(T.logo[0])}–${f(T.logo[1])}, date ${f(T.date[0])}–${f(T.date[1])}.`,
      `Hold the thank-you card still to the end; the last ${FINAL_HOLD} frames (${end - FINAL_HOLD}–${end}) are perfectly still.`,
    ].join("\n");
  },
});
