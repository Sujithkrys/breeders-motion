import { CURSOR_COLORS, FILM, SAMPLE } from "../../film";
import { FINAL_HOLD, STAGGER, bezierText, targetLine } from "../../kit";
import { areaText, pointText } from "../../placement";
import { defineMotion } from "../../types";
import {
  LINE_H,
  MARGIN,
  PLACEMENT_DEFAULTS,
  REF_PAGE,
  SEEDS,
  SHOTS,
  SIZE,
  SLOT_ASPECT,
  Statement,
  T,
  TEXTURE_OPACITY,
  TRACK,
  fitRows,
  placements,
  textOn,
  type StatementProps,
} from "./Statement";

// Each colourway sets the type-card base and the screenshot field together.
const looks: { name: string; base: string; field: string }[] = [
  { name: "Lavender", base: FILM.black, field: FILM.lavender },
  { name: "Lime", base: FILM.black, field: FILM.lime },
  { name: "Green", base: FILM.green, field: FILM.lime },
  { name: "Plum", base: FILM.plum, field: FILM.cream },
];
const palettes = looks.map((l) => ({ name: l.name, swatch: [l.base, l.field], values: { base: l.base, field: l.field } }));

export default defineMotion<StatementProps>({
  slug: "statement",
  name: "Statement",
  description: "Two big statements on black code-texture cards, your screenshot with a live cursor on a flat colour field, then your logo.",
  category: "templates",
  tags: ["kinetic type", "launch", "figma", "statement"],
  addedAt: "2026-10-21",
  durationInFrames: 240,
  fps: 30,
  ratios: ["16:9", "9:16"],
  component: Statement,
  defaultProps: {
    ...palettes[0].values,
    line1: "Your designs",
    line2: "Never meant to sit still.",
    line3: "Set them in motion",
    brand: SAMPLE.brand,
    logo: SAMPLE.logo,
    screenshot: SAMPLE.site,
    phoneShot: SAMPLE.phone,
    cursorName: "Maya",
    showCursor: true,
    showSelection: true,
    ...PLACEMENT_DEFAULTS,
  } as StatementProps,
  palettes,
  controls: [
    { type: "text", key: "line1", label: "Statement 1", maxLength: 28 },
    { type: "text", key: "line2", label: "Statement 2", maxLength: 40 },
    { type: "text", key: "line3", label: "Screenshot title", maxLength: 28 },
    { type: "text", key: "brand", label: "Brand name", maxLength: 16 },
    { type: "image", key: "logo", label: "Logo", hint: "PNG or SVG, transparent" },
    { type: "image", key: "screenshot", label: "Screenshot", hint: "16:10 page screenshot" },
    { type: "image", key: "phoneShot", label: "Phone screen", hint: "Phone screen, 9:19.5 (vertical film)" },
    { type: "toggle", key: "showCursor", label: "Cursor" },
    { type: "toggle", key: "showSelection", label: "Selection box" },
    { type: "point", key: "clickPoint", label: "Cursor click", image: "screenshot", aspect: SLOT_ASPECT.wide, ratio: "16:9", when: "showCursor" },
    { type: "area", key: "selectArea", label: "Selection box", image: "screenshot", aspect: SLOT_ASPECT.wide, ratio: "16:9", when: "showSelection" },
    { type: "point", key: "clickPointTall", label: "Cursor click", image: "phoneShot", aspect: SLOT_ASPECT.tall, ratio: "9:16", when: "showCursor" },
    { type: "area", key: "selectAreaTall", label: "Selection box", image: "phoneShot", aspect: SLOT_ASPECT.tall, ratio: "9:16", when: "showSelection" },
    { type: "color", key: "base", label: "Base" },
    { type: "color", key: "field", label: "Field" },
    { type: "text", key: "cursorName", label: "Cursor name", maxLength: 12 },
  ],
  prompt: (p, c) => {
    const tall = c.height > c.width;
    const L = tall ? SIZE.tall : SIZE.wide;
    const end = c.seconds * c.fps;
    const ink = textOn(p.base);
    const ink3 = textOn(p.field);
    const enter = `enter, ${bezierText("enter")}`;
    const f = (shot: number, local: number) => SHOTS[shot] + local;
    const s1 = fitRows(p.line1, L.maxW, L.statement, L.maxLines);
    const s2 = fitRows(p.line2, L.maxW, L.statement, L.maxLines);
    const rowsText = (r: string[][]) => r.map((x) => `"${x.join(" ")}"`).join(" / ");
    const w = L.shotW;
    const h = Math.round(tall ? (w * 19.5) / 9 : (w * 10) / 16);
    const place = tall
      ? `left-aligned at x 90px with its top at 50% of the height (lower middle), within ${L.maxW}px`
      : `centred in the frame, within ${L.maxW}px`;
    const pl = placements(p, tall);
    const ref = tall ? REF_PAGE.tall : REF_PAGE.wide;
    const showCursor = p.showCursor !== false;
    const showSelection = p.showSelection !== false;
    const clickAt = `${pointText(pl.click)} of the screenshot frame${pl.clickIsDefault ? ` (${tall ? "the full-width button at the bottom of the phone screen" : "the primary button under the hero headline"})` : ""}`;
    const areaAt = `${areaText(pl.to)} of the screenshot frame${pl.areaIsDefault ? ` (${tall ? "the whole phone screen" : "the hero area: headline, subtitle and buttons"})` : ""}`;
    const cursorLine = showCursor
      ? `A Figma multiplayer cursor (arrow in ${CURSOR_COLORS.pink} with a 1.6px white outline, ${Math.round(30 * L.cursor)}px tall, name tag "${p.cursorName}" in white Inter 500 on a ${CURSOR_COLORS.pink} pill) glides in from off-frame bottom-right along a slight arc, frames ${f(2, T.glide[0])}–${f(2, T.glide[1])} on travel, ${bezierText("travel")}, to the click point at ${clickAt}, riding with the frame as it rises, and clicks at frame ${f(2, T.click)} (scale dips 10% and returns over 8 frames).`
      : `No cursor is drawn.${showSelection ? ` The click point at ${clickAt} still anchors the selection.` : ""}`;
    const selectionLine = showSelection
      ? `Frames ${f(2, T.select[0])}–${f(2, T.select[1])}: a ${FILM.select} selection box (2px stroke, four 11px white square handles with blue outlines) grows from a small box around the click point (${areaText(pl.from)}) out to the selection area at ${areaAt} on ${enter}, with a "${pl.label}" tag below it (the area's size on a ${ref.w}×${ref.h} page): white Inter 500 16px on a ${FILM.select} pill, radius 6. Hold until the cut.`
      : `No selection box is drawn. Hold the screenshot until the cut.`;
    return [
      targetLine(c.target, "a four-shot launch film in the style of Figma's launch films: big calm statements, the product, the logo", c.width, c.height, c.seconds),
      `Hard cuts at frames ${SHOTS.join(", ")} (no transitions). Flat colour fields only: no gradients, glows or text shadows. Inter only, sentence case. Sizes are px at 1080 on the short side.`,
      `Word rise (shots 1–3): each row of type sits in its own overflow-hidden mask; every word rises from translateY(115%) to 0 over ${T.wordDur} frames on ${enter}, starting ${T.wordStart} frames after the cut, ${STAGGER} frames apart (capped at ${T.maxStagger} steps).`,
      `Shot 1 (frames ${SHOTS[0]}–${SHOTS[1]}): flat ${p.base} with a dim code texture: Geist Mono 15px, line height 1.7, rows of random code tokens in ${ink} at ${Math.round(TEXTURE_OPACITY * 100)}% opacity, drifting up 0.4px per frame (seed ${SEEDS[0]}). ${rowsText(s1.rows)} in ${ink}, Inter 500 ${Math.round(s1.size)}px, tracking ${TRACK.statement}em, line height ${LINE_H}, ${place}.`,
      `Shot 2 (frames ${SHOTS[1]}–${SHOTS[2]}): the same field and texture with a new seed (${SEEDS[1]}). ${rowsText(s2.rows)} as balanced rows, Inter 500 ${Math.round(s2.size)}px, same tracking and placement.`,
      `Shot 3 (frames ${SHOTS[2]}–${SHOTS[3]}): flat ${p.field}. "${p.line3}" top-left at a ${MARGIN}px margin, Inter 500 ${L.line3}px, tracking ${TRACK.line3}em, ${ink3}, same word rise.`,
      tall
        ? `The user's phone screenshot in a ${w}×${h}px phone frame (radius ${L.radius}), centred horizontally in the lower part of the frame, the image filling the width and cropped from the top.`
        : `The user's screenshot in a ${w}×${h}px 16:10 frame (radius ${L.radius}), centred horizontally, 40px below centre, the image filling the width and cropped from the top.`,
      `It has a 1px rgba(0,0,0,0.06) hairline and shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06); it rises ${T.travel}px over ${T.shotRise} frames on ${enter} while fading in over ${T.shotFade} frames, from frame ${SHOTS[2]}.`,
      `Placements are percentages of the visible screenshot frame (the width-fitted, top-cropped slot).`,
      cursorLine,
      selectionLine,
      `Shot 4 (frames ${SHOTS[3]}–${end}): flat ${p.base}. The user's logo file at ${L.logo}px tall followed by "${p.brand}" in Inter 500 ${Math.round(L.logo * 0.82)}px, tracking -0.02em, ${ink}, gap ${Math.round(L.logo * 0.32)}px, centred. It fades 0→1 and scales 0.96→1 over ${T.logoDur} frames from frame ${f(3, T.logoStart)} on ${enter}.`,
      `Hold the logo card still to the end; the last ${FINAL_HOLD} frames (${end - FINAL_HOLD}–${end}) are perfectly still.`,
    ].join("\n");
  },
});
