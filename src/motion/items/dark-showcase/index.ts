import { FILM, SAMPLE } from "../../film";
import { FINAL_HOLD, RADIUS, STAGGER, STROKE, bezierText, targetLine } from "../../kit";
import { areaText, areaValue, parseArea } from "../../placement";
import { defineMotion } from "../../types";
import {
  BUTTON_PAD,
  CAMERA,
  DETAIL_AREA,
  DRIFT,
  DarkShowcase,
  EDGE_LINE,
  ICON_GAP,
  LINE_H,
  MARGIN,
  PERSPECTIVE,
  PLATE_ASPECT,
  PLATE_LINE,
  SHOTS,
  SIZE,
  T,
  TILT,
  TRACK,
  detailCamera,
  fitRows,
  labelSize,
  textOn,
  type DarkShowcaseProps,
} from "./DarkShowcase";

// Each colourway sets the film's base field and the logo card together.
const looks: { name: string; base: string; end: string }[] = [
  { name: "Black", base: FILM.black, end: FILM.white },
  { name: "Plum", base: FILM.plum, end: FILM.cream },
  { name: "Green", base: FILM.green, end: FILM.lime },
  { name: "Black Lime", base: FILM.black, end: FILM.lime },
];
const palettes = looks.map((l) => ({ name: l.name, swatch: [l.base, l.end], values: { base: l.base, end: l.end } }));

export default defineMotion<DarkShowcaseProps>({
  slug: "dark-showcase",
  name: "Dark Showcase",
  description: "Your dark app on a tilted plane in pure black, a slow camera glide into the detail, one key control pressed, then your logo.",
  category: "templates",
  tags: ["product", "dark", "showcase", "3d"],
  addedAt: "2026-10-21",
  durationInFrames: 240,
  fps: 30,
  ratios: ["16:9", "9:16"],
  component: DarkShowcase,
  defaultProps: {
    ...palettes[0].values,
    kicker: "Lumen for Mac",
    line: "Your week, already planned.",
    action: "Plan my week",
    actionDone: "Planned",
    brand: SAMPLE.brand,
    logo: SAMPLE.logo,
    screenshot: SAMPLE.appDark,
    phoneShot: SAMPLE.phoneDark,
    detailArea: areaValue(DETAIL_AREA.wide),
    detailAreaTall: areaValue(DETAIL_AREA.tall),
    showCursor: true,
  } as DarkShowcaseProps,
  palettes,
  controls: [
    { type: "text", key: "kicker", label: "Caption", maxLength: 28 },
    { type: "text", key: "line", label: "Statement", maxLength: 40 },
    { type: "text", key: "action", label: "Button", maxLength: 18 },
    { type: "text", key: "actionDone", label: "Button after press", maxLength: 18 },
    { type: "toggle", key: "showCursor", label: "Cursor" },
    { type: "text", key: "brand", label: "Brand name", maxLength: 16 },
    { type: "image", key: "logo", label: "Logo", hint: "PNG or SVG, transparent" },
    { type: "image", key: "screenshot", label: "App screenshot", hint: "Dark app screenshot, 16:10" },
    { type: "image", key: "phoneShot", label: "Phone screen", hint: "Phone screen, 9:19.5 (vertical film)" },
    { type: "area", key: "detailArea", label: "Detail area", image: "screenshot", aspect: PLATE_ASPECT.wide, hint: "The camera glides over this part", ratio: "16:9" },
    { type: "area", key: "detailAreaTall", label: "Detail area", image: "phoneShot", aspect: PLATE_ASPECT.tall, hint: "The camera glides over this part", ratio: "9:16" },
    { type: "color", key: "base", label: "Base" },
    { type: "color", key: "end", label: "Logo card" },
  ],
  prompt: (p, c) => {
    const tall = c.height > c.width;
    const L = tall ? SIZE.tall : SIZE.wide;
    const area = tall ? parseArea(p.detailAreaTall, DETAIL_AREA.tall) : parseArea(p.detailArea, DETAIL_AREA.wide);
    const drift = tall ? CAMERA.drift.tall : CAMERA.drift.wide;
    const end = c.seconds * c.fps;
    const ink = textOn(p.base);
    const btn = ink;
    const onBtn = textOn(btn);
    const endInk = textOn(p.end);
    const f = (shot: number, local: number) => SHOTS[shot] + local;
    const enter = `enter, ${bezierText("enter")}`;
    const travel = `travel, ${bezierText("travel")}`;
    const w = L.plateW;
    const h = Math.round(tall ? (w * 19.5) / 9 : (w * 10) / 16);
    const width = tall ? 1080 : 1920; // in px at 1080 on the short side
    const winPct = Math.round(L.window * 100);
    const cam = detailCamera(area, width, (tall ? 1920 : 1080) * L.window, w, tall ? PLATE_ASPECT.tall : PLATE_ASPECT.wide);
    const zx = (n: number) => (n / w).toFixed(2);
    const driftText = [drift[0] ? `${Math.round(drift[0] * 100)}% of its width to the right` : "", drift[1] ? `${Math.round(drift[1] * 100)}% of its height down` : ""].filter(Boolean).join(" and ");
    const st = fitRows(p.line, width - 2 * MARGIN, L.statement, L.maxLines);
    const rows = st.rows.map((r) => `"${r.join(" ")}"`).join(" / ");
    const fs = Math.round(labelSize(p.action, p.actionDone, L.button.w - 2 * BUTTON_PAD - L.icon - ICON_GAP, L.label));
    return [
      targetLine(c.target, "a four-shot dark product film in the style of Spotify and Apple launch films: the app on a tilted plane in pure black, a camera glide into the detail, one key control pressed, the logo", c.width, c.height, c.seconds),
      `Hard cuts at frames ${SHOTS.join(", ")} (no transitions). Flat colour fields only: no gradients, glows, tinted darks or text shadows. Inter only (Geist Mono for the caption), sentence case. Sizes are px at 1080 on the short side.`,
      `Shot 1 (frames ${SHOTS[0]}–${SHOTS[1]}): flat ${p.base}. ${tall ? `The user's phone screenshot in a ${w}×${h}px 9:19.5 frame, radius ${RADIUS.hero}` : `The user's screenshot in a ${w}×${h}px 16:10 frame, radius ${RADIUS.card}`}, the image filling the width and cropped from the top, with a 1px white hairline at ${Math.round(PLATE_LINE * 100)}% and no shadow; centred, ${Math.abs(L.plateY)}px above centre.`,
      `It lies on a tilted plane: transform perspective(${PERSPECTIVE}px) rotateX(${TILT.from.x}deg) rotateZ(${TILT.from.z}deg) scale(${L.plateScale[0]}) settling to rotateX(${TILT.to.x}deg) rotateZ(${TILT.to.z}deg) scale(${L.plateScale[1]}) across the whole shot on ${travel}, while drifting from (${DRIFT.from.join(", ")})px to (${DRIFT.to.join(", ")})px on the same curve. It fades in from 0 over the first ${T.plateFade} frames on ${enter}.`,
      p.kicker
        ? `Caption "${p.kicker.toUpperCase()}" bottom-left at a ${MARGIN}px margin: Geist Mono ${L.kicker}px, uppercase, tracking +${TRACK.kicker}em, ${ink} at 50%, fading in over frames ${f(0, T.kicker[0])}–${f(0, T.kicker[1])} on enter.`
        : `No caption.`,
      `Shot 2 (frames ${SHOTS[1]}–${SHOTS[2]}): flat ${p.base}. A camera glide into the detail: a full-width, overflow-hidden window over the top ${winPct}% of the frame holds the same ${tall ? "phone screenshot" : "screenshot"}, flat (no tilt), framing the detail area at ${areaText(area)} of the image (fractions of the image as drawn in shot 1: width-fitted, cropped from the top). The image is scaled so the whole area fits the window (by width or height, whichever keeps it all visible), capped at ${CAMERA.zoom[0]}–${CAMERA.zoom[1]}× the shot-1 frame width and never smaller than the window: here ${zx(cam.startW)}× → ${zx(cam.endW)}× (it starts ${Math.round((CAMERA.push - 1) * 100)}% wider and pushes in to the fit), while the view centre drifts across the area's centre by ${driftText}, both on linear for the whole shot, clamped so the view never leaves the image. A ${STROKE.hair}px hairline in ${ink} at ${Math.round(EDGE_LINE * 100)}% marks the window's bottom edge.`,
      `Below the window, on the field, left-aligned at x ${MARGIN}px and vertically centred in the remaining band: ${rows} in ${ink}, Inter 500 ${Math.round(st.size)}px, tracking ${TRACK.statement}em, line height ${LINE_H}. Word rise: each row in its own overflow-hidden mask, each word rises from translateY(115%) to 0 over ${T.wordDur} frames on ${enter}, from frame ${f(1, T.wordStart)}, ${STAGGER} frames apart (capped at ${T.maxStagger} steps).`,
      `Shot 3 (frames ${SHOTS[2]}–${SHOTS[3]}): flat ${p.base}. The key control, isolated and large: a ${btn} button ${L.button.w}×${L.button.h}px, radius ${RADIUS.hero}, centred. Inside, centred: a stroked calendar glyph (${L.icon}px, ${STROKE.ring}px stroke, round caps) then "${p.action}" in ${onBtn}, Inter 600 ${fs}px, tracking ${TRACK.label}em, gap ${ICON_GAP}px. The button fades in and rises ${T.buttonRise}px over frames ${f(2, T.button[0])}–${f(2, T.button[1])} on ${enter}.`,
      p.showCursor
        ? `A macOS-style pointer (black arrow with a white outline, ${Math.round(30 * L.cursor)}px tall, no name tag) glides in from off-frame bottom-right along a slight arc, frames ${f(2, T.glide[0])}–${f(2, T.glide[1])} on ${travel}, to the right half of the label, and clicks at frame ${f(2, T.click)}: the pointer dips 10% and the button scales to 0.96 and back over 8 frames.`
        : `No cursor is shown: at frame ${f(2, T.click)} the button presses on its own, scaling to 0.96 and back over 8 frames.`,
      `Frames ${f(2, T.swap[0])}–${f(2, T.swap[1])}: the label rolls inside the button (overflow hidden): "${p.action}" slides up out of the button while a stroked check glyph and "${p.actionDone}" slide up in from below, both fully opaque, on travel, ${bezierText("travel")}. Hold until the cut.`,
      `Shot 4 (frames ${SHOTS[3]}–${end}): flat ${p.end}. The user's logo file at ${L.logo}px tall followed by "${p.brand}" in Inter 500 ${Math.round(L.logo * 0.82)}px, tracking -0.02em, ${endInk}, gap ${Math.round(L.logo * 0.32)}px, centred. It fades 0→1 and scales 0.96→1 over ${T.logoDur} frames from frame ${f(3, T.logoStart)} on ${enter}.`,
      `Hold the logo card still to the end; the last ${FINAL_HOLD} frames (${end - FINAL_HOLD}–${end}) are perfectly still.`,
    ].join("\n");
  },
});
