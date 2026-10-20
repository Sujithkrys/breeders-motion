import { CURSOR_COLORS, FILM, SAMPLE } from "../../film";
import { FINAL_HOLD, RADIUS, STAGGER, bezierText, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import {
  CAMERA_DY,
  CHIP,
  CanvasFeature,
  FRAME_DY,
  IDLE,
  LABEL,
  LINE_H,
  MARGIN,
  SETTLE_FROM,
  SHADOW,
  SHOTS,
  T,
  TRACK,
  fitRows,
  geometry,
  labelOn,
  textOn,
  type CanvasFeatureProps,
} from "./CanvasFeature";

// Each colourway sets the design canvas and the title card together.
const looks: { name: string; canvas: string; end: string }[] = [
  { name: "Lime", canvas: FILM.canvas, end: FILM.lime },
  { name: "Lavender", canvas: FILM.canvas, end: FILM.lavender },
  { name: "Cream", canvas: FILM.cream, end: FILM.green },
  { name: "Black", canvas: FILM.canvas, end: FILM.black },
];
const palettes = looks.map((l) => ({ name: l.name, swatch: [l.canvas, l.end], values: { canvas: l.canvas, end: l.end } }));

export default defineMotion<CanvasFeatureProps>({
  slug: "canvas-feature",
  name: "Canvas Feature",
  description: "Your screenshot on a design canvas with live cursors, a selection that zooms the camera into one feature, then a flat title card.",
  category: "templates",
  tags: ["product", "feature", "figma", "canvas"],
  addedAt: "2026-10-21",
  durationInFrames: 240,
  fps: 30,
  ratios: ["16:9", "9:16"],
  component: CanvasFeature,
  defaultProps: {
    ...palettes[0].values,
    title: "Ship it together.",
    feature: "One-click planning",
    brand: SAMPLE.brand,
    logo: SAMPLE.logo,
    screenshot: SAMPLE.site,
    phoneShot: SAMPLE.phone,
  } as CanvasFeatureProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title", maxLength: 32 },
    { type: "text", key: "feature", label: "Feature label", maxLength: 24 },
    { type: "text", key: "brand", label: "Brand name", maxLength: 16 },
    { type: "image", key: "logo", label: "Logo", hint: "PNG or SVG, transparent" },
    { type: "image", key: "screenshot", label: "Screenshot", hint: "16:10 page screenshot; the hero is zoomed into" },
    { type: "image", key: "phoneShot", label: "Phone screen", hint: "Phone screen, 9:19.5 (vertical film); the middle is zoomed into" },
    { type: "color", key: "canvas", label: "Canvas" },
    { type: "color", key: "end", label: "Title card" },
  ],
  prompt: (p, c) => {
    const tall = c.height > c.width;
    const short = Math.min(c.width, c.height);
    const W = (c.width * 1080) / short;
    const H = (c.height * 1080) / short;
    const G = geometry(W, H, 1, tall);
    const { L, tg, fw, fh, sel, S } = G;
    const r = tg.rect;
    const end = c.seconds * c.fps;
    const f = (shot: number, local: number) => SHOTS[shot] + local;
    const ink = textOn(p.end);
    const travel = `travel, ${bezierText("travel")}`;
    const enter = `enter, ${bezierText("enter")}`;
    const pct = (n: number) => `${Math.round(n * 100)}%`;
    const t = fitRows(p.title, L.titleMaxW, L.title, L.maxLines);
    const rowsText = t.rows.map((x) => `"${x.join(" ")}"`).join(" / ");
    const zw = Math.round(sel.w * S);
    const zh = Math.round(sel.h * S);
    const finalTag = `${Math.round(r.w * tg.size[0])} × ${Math.round(r.h * tg.size[1])}`;
    const cursorH = Math.round(34 * L.cursor);
    return [
      targetLine(c.target, "a four-shot product-feature film in the style of Figma's canvas films: the user's screenshot on a design canvas, live multiplayer cursors, a selection that zooms the camera into one feature, then a flat title card", c.width, c.height, c.seconds),
      `Shots start at frames ${SHOTS.join(", ")}. Shots 1–3 are one continuous canvas and camera; frame ${SHOTS[3]} is a hard cut. Flat colour fields only: no gradients, glows or text shadows. Inter only, sentence case. Sizes are px at 1080 on the short side.`,
      `Shot 1 (frames ${SHOTS[0]}–${SHOTS[1]}): flat ${p.canvas} canvas. The user's ${tall ? "phone screenshot" : "screenshot"} in a ${fw}×${Math.round(fh)}px ${tall ? "9:19.5 phone" : "16:10"} frame with square corners, a 1px rgba(0,0,0,0.08) hairline and shadow ${SHADOW}, centred ${FRAME_DY}px below the middle; the image fills the width and crops from the top. ${LABEL.above}px above its top-left: "${p.brand} — Home" in Geist Mono ${LABEL.size}px, ${labelOn(p.canvas)}. The frame scales ${SETTLE_FROM}→1 and fades in over ${T.settle} frames on ${enter}.`,
      `Two Figma multiplayer cursors (arrow filled in colour with a 1.6px white outline, ${cursorH}px tall, a name pill in white Inter 500 ${Math.round(16 * L.cursor)}px): "Maya" (${CURSOR_COLORS.pink}) glides in from off-frame top-right to the feature's top-left corner, frames ${f(0, T.maya1[0])}–${f(0, T.maya1[1])}; "Leo" (${CURSOR_COLORS.green}) from off-frame bottom-left onto the lower-left of the page, frames ${f(0, T.leo1[0])}–${f(0, T.leo1[1])}. Both on ${travel}, along a slight arc (bowed sideways by 10% of the distance).`,
      `Shot 2 (frames ${SHOTS[1]}–${SHOTS[2]}): Maya presses (cursor scale dips 10%) at ${f(1, T.press[0])}–${f(1, T.press[1])} and drags frames ${f(1, T.drag[0])}–${f(1, T.drag[1])} on ${travel}: a ${FILM.select} selection box (2px stroke, four 11px white square handles with blue outlines) grows from that corner to the feature, x ${pct(r.x)}–${pct(r.x + r.w)} and y ${pct(r.y)}–${pct(r.y + r.h)} of the screenshot (${tg.what}). The cursor tip stays locked to the growing bottom-right corner; a size tag 12px below the box counts the live size in screenshot px up to "${finalTag}" (white Inter 500 16px on a ${FILM.select} pill, radius 6). She releases at ${f(1, T.release[0])}–${f(1, T.release[1])}. Leo settles ${tall ? "just below the selection's left end" : "just outside its left edge"}, frames ${f(1, T.leo2[0])}–${f(1, T.leo2[1])}, on travel.`,
      `Camera, frames ${f(1, T.zoom[0])}–${f(1, T.zoom[1])} on ${travel}: one scale + translate on the canvas, from 1 to ${S.toFixed(2)}×, bringing the selection to ${zw}×${zh}px (${pct(zw / W)} of the width) centred ${CAMERA_DY}px below the frame's middle. Draw the selection box, frame label and cursors in screen space from the transformed coordinates, so strokes, handles and cursors stay their size; render the screenshot at its zoomed size so it stays sharp. During ${f(1, T.mayaRest[0])}–${f(1, T.mayaRest[1])} Maya eases off the handle to just inside the selection's bottom-right.`,
      `Shot 3 (frames ${SHOTS[2]}–${SHOTS[3]}): hold the zoom. A chip "${p.feature}": white, black Inter 500 ${L.chip}px, ${L.chip * 2}px tall, ${CHIP.padX}px side padding, radius ${RADIUS.chip}, a 1px rgba(0,0,0,0.1) hairline and the same soft shadow, ${CHIP.gap}px above the selection and left-aligned with it. It pops in frames ${f(2, T.chip[0])}–${f(2, T.chip[1])} on ${bezierText("spring")}: scale ${CHIP.from}→1 from its bottom-left plus a fade. Both cursors idle with a ±${IDLE.amp}px sine drift (about ${Math.round(2 * Math.PI * IDLE.period)} frames per cycle), easing in over ${T.idleIn} frames.`,
      `Shot 4 (frames ${SHOTS[3]}–${end}): flat ${p.end}. ${rowsText} in ${ink}, Inter 500 ${Math.round(t.size)}px, tracking ${TRACK}em, line height ${LINE_H}, top-left at a ${MARGIN}px margin${tall ? ", wrapping within the width" : ""}.`,
      `Word rise: each row sits in its own overflow-hidden mask; every word rises from translateY(115%) to 0 over ${T.wordDur} frames on ${enter}, from frame ${f(3, T.wordStart)}, ${STAGGER} frames apart (capped at ${T.maxStagger} steps).`,
      `Bottom-left at a ${MARGIN}px margin: the user's logo file at ${L.logo}px tall, then "${p.brand}" in Inter 500 ${Math.round(L.logo * 0.82)}px, tracking -0.02em, ${ink}, gap ${Math.round(L.logo * 0.32)}px. It fades in and rises 16px over frames ${f(3, T.logo[0])}–${f(3, T.logo[1])} on ${enter}.`,
      `Hold the title card still to the end; the last ${FINAL_HOLD} frames (${end - FINAL_HOLD}–${end}) are perfectly still.`,
    ].join("\n");
  },
});
