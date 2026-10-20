import { FILM, SAMPLE } from "../../film";
import { FINAL_HOLD, RADIUS, SPRING_CONFIG, STAGGER, STROKE, bezierText, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import {
  CURVE,
  DataStory,
  GAP,
  GRID,
  MOSAIC,
  OPACITY,
  RISE,
  SHOTS,
  SIZE,
  T,
  TRACK,
  clampValue,
  deepInk,
  numberSize,
  textOn,
  tileColor,
  type DataStoryProps,
} from "./DataStory";

// Each colourway sets the paper field (shots 1, 3, 4) and the deep field (shot 2) together; orange stays the data accent.
const looks: { name: string; paper: string; deep: string }[] = [
  { name: "Cream", paper: FILM.cream, deep: FILM.green },
  { name: "White", paper: FILM.white, deep: FILM.black },
  { name: "Lavender", paper: FILM.lavender, deep: FILM.plum },
  { name: "Grey", paper: FILM.canvas, deep: FILM.green },
];
const palettes = looks.map((l) => ({ name: l.name, swatch: [l.paper, l.deep, FILM.orange], values: { paper: l.paper, deep: l.deep } }));

export default defineMotion<DataStoryProps>({
  slug: "data-story",
  name: "Data Story",
  description: "An editorial data reel: a baseline bar on a grid, an exponential curve on deep green, a colour mosaic, then one huge number.",
  category: "templates",
  tags: ["numbers", "chart", "data", "launch"],
  addedAt: "2026-10-21",
  durationInFrames: 270,
  fps: 30,
  ratios: ["16:9", "9:16"],
  component: DataStory,
  defaultProps: {
    ...palettes[0].values,
    lead: "The sum of human knowledge",
    baseLabel: "Human output · 1x",
    curveLabel: "Between AI and humans",
    curveNote: "Vastly greater",
    mosaicLabel: "Every field, at once",
    caption: "Compute per dollar, every two years",
    value: 10,
    suffix: "×",
    brand: SAMPLE.brand,
    logo: SAMPLE.logo,
  } as DataStoryProps,
  palettes,
  controls: [
    { type: "text", key: "lead", label: "Heading", maxLength: 40 },
    { type: "text", key: "baseLabel", label: "Bar label", maxLength: 32 },
    { type: "text", key: "curveLabel", label: "Chart label", maxLength: 32 },
    { type: "text", key: "curveNote", label: "Curve note", maxLength: 20 },
    { type: "text", key: "mosaicLabel", label: "Mosaic label", maxLength: 32 },
    { type: "number", key: "value", label: "Big number", min: 2, max: 99, step: 1 },
    { type: "text", key: "suffix", label: "Number suffix", maxLength: 2 },
    { type: "text", key: "caption", label: "Number caption", maxLength: 48 },
    { type: "text", key: "brand", label: "Brand name", maxLength: 16 },
    { type: "image", key: "logo", label: "Logo", hint: "PNG or SVG, transparent" },
  ],
  prompt: (p, c) => {
    const tall = c.height > c.width;
    const L = tall ? SIZE.tall : SIZE.wide;
    const end = c.seconds * c.fps;
    const frameW = (c.width * 1080) / Math.min(c.width, c.height);
    const frameH = (c.height * 1080) / Math.min(c.width, c.height);
    const ink = textOn(p.paper);
    const curveInk = deepInk(p.deep);
    const value = clampValue(p.value);
    const numSize = Math.round(numberSize(value, p.suffix, L, frameW));
    const f = (shot: number, local: number) => SHOTS[shot] + local;
    const range = (shot: number, r: readonly [number, number]) => `frames ${f(shot, r[0])}–${f(shot, r[1])}`;
    const enter = `enter, ${bezierText("enter")}`;
    const travel = `travel, ${bezierText("travel")}`;
    const grey = `${ink} at ${Math.round(OPACITY.caption * 100)}% opacity`;
    const ch = L.chart;
    const grid = MOSAIC[tall ? "tall" : "wide"];
    const rows = grid.map((r, i) => `row ${i + 1}: ${r.map((n) => tileColor(n, p.paper)).join(", ")}`).join("; ");
    const gridW = L.cols * L.tile + (L.cols - 1) * L.gap;
    const gridH = L.rows * L.tile + (L.rows - 1) * L.gap;
    const lastDelay = T.tiles.start + T.tiles.stagger * (L.cols - 1 + L.rows - 1);
    return [
      targetLine(c.target, "a four-shot editorial data film in the style of an xAI explainer reel: a baseline bar, an exponential curve, a colour mosaic, one huge number", c.width, c.height, c.seconds),
      `Hard cuts at frames ${SHOTS.join(", ")} (no transitions). Flat fields only: paper ${p.paper} (shots 1, 3, 4) and deep ${p.deep} (shot 2); no gradients, glows or shadows. Inter for type, Geist Mono for the small labels (tracking ${TRACK.mono}em, line height 1.35), sentence case. ${FILM.orange} is used only for the data point. Sizes are px at 1080 on the short side.`,
      `Shot 1 (frames ${SHOTS[0]}–${SHOTS[1]}): ${p.paper} with a hairline grid behind everything: ${STROKE.hair}px lines every ${GRID}px in ${ink} at ${Math.round(OPACITY.grid * 100)}% opacity, aligned so the frame's centre lines are grid lines, drawn as one SVG path. "${p.lead}" top-left at a ${L.margin}px margin, Inter 500 ${L.lead}px, tracking ${TRACK.lead}em, line height 1.15, ${ink}, wrapping within ${L.leadMaxW}px; each word rises from translateY(115%) to 0 inside its own overflow-hidden mask over ${T.word.dur} frames on ${enter}, from frame ${T.word.start}, ${STAGGER} frames apart.`,
      `A ${ink} bar ${STROKE.bar}px thick with square ends, centred on the frame's horizontal centre line, draws left to right to ${L.bar}px long over ${range(0, T.bar)} on ${travel}. "${p.baseLabel}" sits ${GAP.caption}px under it, left-aligned to the bar's start: Geist Mono ${L.label}px, ${grey}, fading in and rising ${RISE.caption}px over ${range(0, T.baseIn)} on ${enter}.`,
      `Shot 2 (frames ${SHOTS[1]}–${SHOTS[2]}): flat ${p.deep}. "${p.curveLabel}" top-left at a ${L.margin}px margin in Geist Mono ${L.curveLabel}px, ${curveInk}, fading in and rising ${RISE.caption}px over ${range(1, T.labelIn)}. Full-bleed chart box (no card) inset ${ch.left}px left, ${ch.right}px right, ${ch.top}px top, ${ch.bottom}px bottom; its y and x axes are one ${STROKE.hair}px hairline path in ${curveInk} at ${Math.round(OPACITY.axis * 100)}% that grows out of the bottom-left origin over ${range(1, T.axes)} on ${enter}.`,
      `The curve: y = ${CURVE.lift} + ${1 - CURVE.lift}·(e^(${CURVE.k}x) − 1)/(e^${CURVE.k} − 1) for x from 0 to ${CURVE.endX} of the box width (y as a fraction of the box height), sampled at ${CURVE.samples} points, a ${STROKE.ring}px ${curveInk} stroke with round caps, drawn on with strokeDasharray/strokeDashoffset over ${range(1, T.curve)} on ${travel}. A ${L.dot * 2}px ${FILM.orange} dot rides the tip (fading in over its first ${T.dotIn} frames) and stops at the top-right end. "${p.curveNote}" in Geist Mono ${L.note}px ${FILM.orange} sits ${GAP.note}px left of the final dot, right-aligned and vertically centred on it, fading in while sliding ${RISE.note}px left over ${range(1, T.noteIn)} on ${enter}.`,
      `Shot 3 (frames ${SHOTS[2]}–${SHOTS[3]}): ${p.paper}. A ${L.cols}×${L.rows} mosaic of flat ${L.tile}px square tiles, ${L.gap}px gaps (${gridW}×${gridH}px), radius ${RADIUS.chip}, centred, in this fixed order (${rows}). Each tile scales 0.9→1 on a spring (damping ${SPRING_CONFIG.damping}, mass ${SPRING_CONFIG.mass}, stiffness ${SPRING_CONFIG.stiffness}) while fading in over ${T.tiles.fade} frames on enter, delayed ${T.tiles.stagger} frames × (row + column) from frame ${f(2, T.tiles.start)}, a diagonal sweep that starts its last tile at frame ${f(2, lastDelay)}.`,
      `"${p.mosaicLabel}" ${GAP.mosaicLabel}px under the mosaic, centred, Geist Mono ${L.label}px, ${grey}, fading in and rising ${RISE.caption}px over ${range(2, T.mosaicLabelIn)}.`,
      `Shot 4 (frames ${SHOTS[3]}–${end}): ${p.paper}. "${value}${p.suffix}" in Inter 500 ${numSize}px, tracking ${TRACK.number}em, line height 1, ${ink}, centred in the ${Math.round(frameW)}×${Math.round(frameH)} frame. It fades in and rises ${RISE.number}px over ${range(3, T.numIn)} on ${enter}, while counting in whole numbers from 1 to ${value} over ${range(3, T.count)} on ${enter}, as a single centred text run.`,
      `"${p.caption}" ${GAP.caption}px under the number, centred, Geist Mono ${L.caption}px, ${grey}, wrapping within ${L.captionMaxW}px, fading in and rising ${RISE.caption}px over ${range(3, T.captionIn)}. The user's logo file at ${L.logo}px tall followed by "${p.brand}" in Inter 500 ${Math.round(L.logo * 0.82)}px, tracking -0.02em, ${ink}, gap ${Math.round(L.logo * 0.32)}px, bottom-left at a ${L.margin}px margin, fading in over ${range(3, T.logoIn)} on ${enter}.`,
      `Hold the number card still to the end; the last ${FINAL_HOLD} frames (${end - FINAL_HOLD}–${end}) are perfectly still.`,
    ].join("\n");
  },
});
