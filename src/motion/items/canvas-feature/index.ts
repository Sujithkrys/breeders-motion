import { CURSOR_COLORS, FILM, SAMPLE } from "../../film";
import { FINAL_HOLD, RADIUS, STAGGER, bezierText, targetLine } from "../../kit";
import { areaText, areaValue } from "../../placement";
import { defineMotion } from "../../types";
import {
  CAMERA_DY,
  CHIP,
  CanvasFeature,
  EDGE,
  FEATURE_AREA,
  FEATURE_AREA_TALL,
  FRAME_DY,
  IDLE,
  LABEL,
  LINE_H,
  MARGIN,
  MAX_ZOOM,
  SETTLE_FROM,
  SHADOW,
  SHOTS,
  SIZE,
  T,
  TRACK,
  featureAreaOf,
  fitRows,
  geometry,
  labelOn,
  sizeTag,
  stage,
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
    featureArea: areaValue(FEATURE_AREA),
    featureAreaTall: areaValue(FEATURE_AREA_TALL),
    showCursor: true,
    showSelection: true,
  } as CanvasFeatureProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title", maxLength: 32 },
    { type: "text", key: "feature", label: "Feature label", maxLength: 24 },
    { type: "text", key: "brand", label: "Brand name", maxLength: 16 },
    { type: "image", key: "logo", label: "Logo", hint: "PNG or SVG, transparent" },
    { type: "image", key: "screenshot", label: "Screenshot", hint: "16:10 page screenshot" },
    { type: "image", key: "phoneShot", label: "Phone screen", hint: "Phone screen, 9:19.5 (vertical film)" },
    { type: "area", key: "featureArea", label: "Feature area", image: "screenshot", aspect: 1 / SIZE.wide.aspect, ratio: "16:9", hint: "The camera zooms here" },
    { type: "area", key: "featureAreaTall", label: "Feature area", image: "phoneShot", aspect: 1 / SIZE.tall.aspect, ratio: "9:16", hint: "The camera zooms here" },
    { type: "toggle", key: "showCursor", label: "Cursors" },
    { type: "toggle", key: "showSelection", label: "Selection box" },
    { type: "color", key: "canvas", label: "Canvas" },
    { type: "color", key: "end", label: "Title card" },
  ],
  prompt: (p, c) => {
    const tall = c.height > c.width;
    const short = Math.min(c.width, c.height);
    const W = (c.width * 1080) / short;
    const H = (c.height * 1080) / short;
    const area = featureAreaOf(p, tall);
    const showCursor = p.showCursor !== false;
    const showSelection = p.showSelection !== false;
    const G = geometry(W, H, 1, tall, area);
    const { L, tg, fw, fh, sel, S, A } = G;
    const st = stage(G, W, H, 1, area, p.feature, showSelection);
    const end = c.seconds * c.fps;
    const f = (shot: number, local: number) => SHOTS[shot] + local;
    const ink = textOn(p.end);
    const travel = `travel, ${bezierText("travel")}`;
    const enter = `enter, ${bezierText("enter")}`;
    const pct = (n: number) => `${Math.round(n * 100)}%`;
    const px = (pt: readonly [number, number]) => `(${Math.round(pt[0])}, ${Math.round(pt[1])})px`;
    const t = fitRows(p.title, L.titleMaxW, L.title, L.maxLines);
    const rowsText = t.rows.map((x) => `"${x.join(" ")}"`).join(" / ");
    const zw = Math.round(A.w);
    const zh = Math.round(A.h);
    const finalTag = sizeTag(tg.size, area, 1);
    const cursorH = Math.round(34 * L.cursor);

    // the area, in the words the prompt uses everywhere
    const sample = (tall ? p.phoneShot : p.screenshot) === (tall ? SAMPLE.phone : SAMPLE.site);
    const isDefault = sample && areaValue(area) === areaValue(tall ? FEATURE_AREA_TALL : FEATURE_AREA);
    const shot = tall ? "phone screenshot" : "screenshot";
    const areaDesc = `the feature area, ${areaText(area)} of the visible ${shot} frame (fractions of the frame as drawn: the image fills the width and crops from the top)${isDefault ? `, ${tg.what}` : ""}`;
    const fitS = Math.min((L.fill * W) / sel.w, (L.fillH * H) / sel.h);
    const zoomWhy =
      fitS > MAX_ZOOM
        ? `capped at ${MAX_ZOOM}× because the area is small`
        : fitS < 1
          ? "held at 1× because the area is already larger than the fill limits"
          : `the largest zoom that fits the area into ${pct(L.fill)} of the width and ${pct(L.fillH)} of the height`;
    const leoSpots = tall
      ? ["just below the area's left end", "just above the area's right end", "just outside the area's left edge", "just outside the area's right edge"]
      : ["just outside the area's left edge", "just outside the area's right edge", "just below the area's left end", "just above the area's right end"];
    const leoWhere = st.leoSide >= 0 ? leoSpots[st.leoSide] : "beside the area, pulled inside the frame";
    const leoLine = `Leo settles ${leoWhere} (${st.leoSide > 0 ? "its usual side would leave the frame or overlap the chip, size tag or Maya; " : ""}tip at ${px(st.leoTip)} once the zoom lands), frames ${f(1, T.leo2[0])}–${f(1, T.leo2[1])}, on travel.`;
    const box = `a ${FILM.select} selection box (2px stroke, four 11px white square handles with blue outlines)`;
    const tagLine = `A size tag ${12}px below the box, centred, counts the live size in px of a ${tg.size[0]}px-wide page up to "${finalTag}" (white Inter 500 16px on a ${FILM.select} pill, 30px tall, radius 6); it slides to stay ${EDGE}px inside the video frame${st.tag.pinned ? ", which pins it over the box's bottom edge once the zoom lands" : ""}.`;
    const chipWhere =
      st.chip.v === "above"
        ? `${CHIP.gap}px above the area`
        : st.chip.v === "below"
          ? `${CHIP.gap}px below ${showSelection ? "the size tag" : "the area"} (no room above)`
          : `${CHIP.gap}px inside the area's top edge (no room above or below)`;
    const chipAlign = st.chip.side === "left" ? "left-aligned with it" : "right-aligned with it (no room to the right)";

    const shot2 = (() => {
      const range = `frames ${f(1, T.drag[0])}–${f(1, T.drag[1])} on ${travel}`;
      if (showCursor && showSelection)
        return `Shot 2 (frames ${SHOTS[1]}–${SHOTS[2]}): Maya presses (cursor scale dips 10%) at ${f(1, T.press[0])}–${f(1, T.press[1])} and drags ${range}: ${box} grows from that corner to cover ${areaDesc}. The cursor tip stays locked to the growing bottom-right corner. ${tagLine} She releases at ${f(1, T.release[0])}–${f(1, T.release[1])}. ${leoLine}`;
      if (showCursor)
        return `Shot 2 (frames ${SHOTS[1]}–${SHOTS[2]}): Maya presses (cursor scale dips 10%) at ${f(1, T.press[0])}–${f(1, T.press[1])} and drags ${range} from the top-left to the bottom-right corner of ${areaDesc}. No selection box, handles or size tag are drawn (selection off). She releases at ${f(1, T.release[0])}–${f(1, T.release[1])}. ${leoLine}`;
      if (showSelection)
        return `Shot 2 (frames ${SHOTS[1]}–${SHOTS[2]}): no cursors (cursors off). ${box[0].toUpperCase()}${box.slice(1)} grows from the top-left corner of ${areaDesc} to its full size, ${range}. ${tagLine}`;
      return `Shot 2 (frames ${SHOTS[1]}–${SHOTS[2]}): no cursors and no selection box (both off); ${areaDesc} is only the camera's target.`;
    })();
    const overlays = [showSelection ? "selection box and size tag" : "", "frame label", showCursor ? "cursors" : ""].filter(Boolean).join(", ");

    return [
      targetLine(c.target, `a four-shot product-feature film in the style of Figma's canvas films: the user's screenshot on a design canvas, ${showCursor ? "live multiplayer cursors, " : ""}${showSelection ? "a selection that zooms the camera into one feature" : "a camera zoom into one feature"}, then a flat title card`, c.width, c.height, c.seconds),
      `Shots start at frames ${SHOTS.join(", ")}. Shots 1–3 are one continuous canvas and camera; frame ${SHOTS[3]} is a hard cut. Flat colour fields only: no gradients, glows or text shadows. Inter only, sentence case. Sizes are px at 1080 on the short side.`,
      `Shot 1 (frames ${SHOTS[0]}–${SHOTS[1]}): flat ${p.canvas} canvas. The user's ${shot} in a ${fw}×${Math.round(fh)}px ${tall ? "9:19.5 phone" : "16:10"} frame with square corners, a 1px rgba(0,0,0,0.08) hairline and shadow ${SHADOW}, centred ${FRAME_DY}px below the middle; the image fills the width and crops from the top. ${LABEL.above}px above its top-left: "${p.brand} — Home" in Geist Mono ${LABEL.size}px, ${labelOn(p.canvas)}. The frame scales ${SETTLE_FROM}→1 and fades in over ${T.settle} frames on ${enter}.`,
      showCursor
        ? `Two Figma multiplayer cursors (arrow filled in colour with a 1.6px white outline, ${cursorH}px tall, a name pill in white Inter 500 ${Math.round(16 * L.cursor)}px): "Maya" (${CURSOR_COLORS.pink}) glides in from off-frame top-right to the feature area's top-left corner, frames ${f(0, T.maya1[0])}–${f(0, T.maya1[1])}; "Leo" (${CURSOR_COLORS.green}) from off-frame bottom-left onto the lower-left of the page, frames ${f(0, T.leo1[0])}–${f(0, T.leo1[1])}. Both on ${travel}, along a slight arc (bowed sideways by 10% of the distance). Cursors, size tag and chip always stay at least ${EDGE}px inside the video frame.`
        : `No cursors are drawn (cursors off).`,
      shot2,
      `Camera, frames ${f(1, T.zoom[0])}–${f(1, T.zoom[1])} on ${travel}: one scale + translate on the canvas, from 1 to ${S.toFixed(2)}× (${zoomWhy}; the zoom always stays between 1× and ${MAX_ZOOM}×), bringing the area to ${zw}×${zh}px (${pct(zw / W)} of the width), aimed with its centre ${CAMERA_DY}px below the frame's middle. Then clamp the translate per axis so the view never leaves the screenshot frame: a zoomed frame larger than the viewport always covers it, a smaller one stays fully in view${G.shifted ? `; here the clamp moves the area to x ${Math.round(A.x)}–${Math.round(A.x + A.w)}px, y ${Math.round(A.y)}–${Math.round(A.y + A.h)}px` : ""}. Final transform: scale ${S.toFixed(3)}, translate (${Math.round(G.tx)}, ${Math.round(G.ty)})px. Draw the ${overlays} in screen space from the transformed coordinates, so strokes${showCursor ? ", handles and cursors stay their size" : " and handles stay their size"}; render the screenshot at its zoomed size so it stays sharp.${showCursor ? ` During ${f(1, T.mayaRest[0])}–${f(1, T.mayaRest[1])} Maya eases off the corner to just inside the area's bottom-right (tip at ${px(st.mayaTip)} once the zoom lands).` : ""}`,
      `Shot 3 (frames ${SHOTS[2]}–${SHOTS[3]}): hold the zoom. A chip "${p.feature}": white, black Inter 500 ${L.chip}px, ${L.chip * 2}px tall, ${CHIP.padX}px side padding, radius ${RADIUS.chip}, a 1px rgba(0,0,0,0.1) hairline and the same soft shadow, ${chipWhere} and ${chipAlign}, kept ${EDGE}px inside the frame. It pops in frames ${f(2, T.chip[0])}–${f(2, T.chip[1])} on ${bezierText("spring")}: scale ${CHIP.from}→1 from its ${st.chip.v === "above" ? "bottom" : "top"}-${st.chip.side} corner plus a fade.${showCursor ? ` Both cursors idle with a ±${IDLE.amp}px sine drift (about ${Math.round(2 * Math.PI * IDLE.period)} frames per cycle), easing in over ${T.idleIn} frames.` : ""}`,
      `Shot 4 (frames ${SHOTS[3]}–${end}): flat ${p.end}. ${rowsText} in ${ink}, Inter 500 ${Math.round(t.size)}px, tracking ${TRACK}em, line height ${LINE_H}, top-left at a ${MARGIN}px margin${tall ? ", wrapping within the width" : ""}.`,
      `Word rise: each row sits in its own overflow-hidden mask; every word rises from translateY(115%) to 0 over ${T.wordDur} frames on ${enter}, from frame ${f(3, T.wordStart)}, ${STAGGER} frames apart (capped at ${T.maxStagger} steps).`,
      `Bottom-left at a ${MARGIN}px margin: the user's logo file at ${L.logo}px tall, then "${p.brand}" in Inter 500 ${Math.round(L.logo * 0.82)}px, tracking -0.02em, ${ink}, gap ${Math.round(L.logo * 0.32)}px. It fades in and rises 16px over frames ${f(3, T.logo[0])}–${f(3, T.logo[1])} on ${enter}.`,
      `Hold the title card still to the end; the last ${FINAL_HOLD} frames (${end - FINAL_HOLD}–${end}) are perfectly still.`,
    ].join("\n");
  },
});
