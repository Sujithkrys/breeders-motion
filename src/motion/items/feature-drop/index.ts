import { FILM, SAMPLE } from "../../film";
import { ACCENT, CANVAS, FINAL_HOLD, RADIUS, STAGGER, STROKE, bezierText, targetLine } from "../../kit";
import { areaText, areaValue } from "../../placement";
import { defineMotion } from "../../types";
import {
  AREA_WHAT,
  BAR,
  BEZEL,
  CAMERA_DY,
  CARD_MARGIN,
  CARD_MIN_MARGIN,
  COVER_ROOM,
  CHIP,
  DIM,
  EDGE,
  EM,
  FEATURE_AREA,
  FEATURE_AREA_TALL,
  FeatureDrop,
  LINE_H,
  MARGIN,
  MAX_ZOOM,
  PERSPECTIVE,
  PRESS,
  RING,
  RISE,
  RULE_GAP,
  SHADOW,
  SHOTS,
  SIZE,
  T,
  TILT,
  TRACK,
  featureAreaOf,
  fitRows,
  geometry,
  textOn,
  type FeatureDropProps,
} from "./FeatureDrop";

// Each colourway sets the title field, the product stage, the end card and the one accent together.
const looks: { name: string; field: string; stage: string; end: string; accent: string }[] = [
  { name: "Cream", field: FILM.cream, stage: FILM.canvas, end: FILM.black, accent: FILM.orange },
  { name: "White", field: FILM.white, stage: FILM.canvas, end: FILM.black, accent: ACCENT.blue },
  { name: "Lavender", field: FILM.lavender, stage: FILM.white, end: FILM.plum, accent: FILM.orange },
  { name: "Lime", field: FILM.lime, stage: FILM.white, end: FILM.green, accent: FILM.orange },
];
const palettes = looks.map((l) => ({
  name: l.name,
  swatch: [l.field, l.stage, l.end, l.accent],
  values: { field: l.field, stage: l.stage, end: l.end, accent: l.accent },
}));

export default defineMotion<FeatureDropProps>({
  slug: "feature-drop",
  name: "Feature Drop",
  description: "The weekly “we shipped it” post: the feature name, your screenshot in a browser window with a push into the feature, three benefits, then a call to action.",
  category: "templates",
  tags: ["changelog", "feature", "product", "launch", "browser"],
  addedAt: "2026-10-21",
  durationInFrames: 270,
  fps: 30,
  ratios: ["16:9", "9:16"],
  component: FeatureDrop,
  defaultProps: {
    ...palettes[0].values,
    kicker: "Lumen 2.4 · Changelog",
    date: "Oct 21",
    badge: "New",
    feature: "Smart scheduling",
    subline: "Lumen finds the time, so you don't have to.",
    benefit1: "Finds focus time automatically",
    benefit2: "Moves meetings when plans change",
    benefit3: "Works with your calendar",
    cta: "Try it today",
    url: "lumen.app/schedule",
    brand: SAMPLE.brand,
    logo: SAMPLE.logo,
    screenshot: SAMPLE.site,
    phoneShot: SAMPLE.phone,
    featureArea: areaValue(FEATURE_AREA),
    featureAreaTall: areaValue(FEATURE_AREA_TALL),
    showSelection: true,
  } as FeatureDropProps,
  palettes,
  controls: [
    { type: "text", key: "feature", label: "Feature name", maxLength: 28 },
    { type: "text", key: "subline", label: "Subline", maxLength: 64 },
    { type: "text", key: "kicker", label: "Caption", maxLength: 32 },
    { type: "text", key: "date", label: "Date", maxLength: 16 },
    { type: "text", key: "badge", label: "Badge", maxLength: 12 },
    { type: "text", key: "benefit1", label: "Benefit 1", maxLength: 40 },
    { type: "text", key: "benefit2", label: "Benefit 2", maxLength: 40 },
    { type: "text", key: "benefit3", label: "Benefit 3", maxLength: 40 },
    { type: "text", key: "cta", label: "Call to action", maxLength: 28 },
    { type: "text", key: "url", label: "URL", maxLength: 28 },
    { type: "text", key: "brand", label: "Brand name", maxLength: 16 },
    { type: "image", key: "logo", label: "Logo", hint: "PNG or SVG, transparent" },
    { type: "image", key: "screenshot", label: "Screenshot", hint: "16:10 page or app screenshot (shown in the browser window)" },
    { type: "image", key: "phoneShot", label: "Phone screen", hint: "Phone screen, 9:19.5 (vertical film)" },
    { type: "area", key: "featureArea", label: "Feature area", image: "screenshot", aspect: 16 / 10, ratio: "16:9", hint: "The camera pushes in here" },
    { type: "area", key: "featureAreaTall", label: "Feature area", image: "phoneShot", aspect: 9 / 19.5, ratio: "9:16", hint: "The camera pushes in here" },
    { type: "toggle", key: "showSelection", label: "Highlight" },
    { type: "color", key: "field", label: "Title field" },
    { type: "color", key: "stage", label: "Product field" },
    { type: "color", key: "end", label: "End card" },
    { type: "color", key: "accent", label: "Accent" },
  ],
  prompt: (p, c) => {
    const tall = c.height > c.width;
    const short = Math.min(c.width, c.height);
    const W = (c.width * 1080) / short;
    const H = (c.height * 1080) / short;
    const L = tall ? SIZE.tall : SIZE.wide;
    const area = featureAreaOf(p, tall);
    const G = geometry(W, H, 1, tall, area, p.feature);
    const end = c.seconds * c.fps;
    const f = (shot: number, local: number) => SHOTS[shot] + local;
    const r = (n: number) => Math.round(n);
    const enter = `enter, ${bezierText("enter")}`;
    const travel = `travel, ${bezierText("travel")}`;
    const spring = bezierText("spring");
    const exit = `exit, ${bezierText("exit")}`;
    const ink1 = textOn(p.field);
    const ink2 = textOn(p.stage);
    const ink4 = textOn(p.end);
    const rowsText = (rows: string[][]) => rows.map((x) => `"${x.join(" ")}"`).join(" / ");
    const feat = fitRows(p.feature, Math.min(L.featureMaxW, W - 2 * MARGIN), L.feature, L.featureLines, EM[600]);
    const cta = fitRows(p.cta, Math.min(L.ctaMaxW, W - 2 * MARGIN), L.cta, L.ctaLines, EM[500]);
    const showSel = p.showSelection !== false;
    const ruleY = MARGIN + L.caption + RULE_GAP;
    const { content: ct, card, S, K } = G;
    const sample = (tall ? p.phoneShot : p.screenshot) === (tall ? SAMPLE.phone : SAMPLE.site);
    const isDefault = sample && areaValue(area) === areaValue(tall ? FEATURE_AREA_TALL : FEATURE_AREA);
    const shot = tall ? "phone screenshot" : "screenshot";
    const areaDesc = `the feature area at ${areaText(area)} of the visible ${shot} (fractions of the slot as drawn: the image fills the width and crops from the top)${isDefault ? `, ${tall ? AREA_WHAT.tall : AREA_WHAT.wide}` : ""}`;
    const benefits = [p.benefit1, p.benefit2, p.benefit3].filter((s) => s && s.trim());
    const benefitBox = tall
      ? `below the card, from y ${r(card.y + card.h + 56)}px to the bottom margin, ${r(W - 2 * MARGIN)}px wide`
      : `in the left column (x ${MARGIN}–${r(card.x - MARGIN)}px), vertically centred in the frame`;

    const device = tall
      ? `The user's phone screenshot as a ${ct.w}×${r(ct.h)}px 9:19.5 screen (radius ${RADIUS.card}) in a ${BEZEL}px ${FILM.black} bezel (outer radius ${RADIUS.hero}), with a black dynamic-island pill (32% of the screen width, 9.4% of it tall) 2.8% of the width below the screen's top edge; centred, screen top-left at (${r(ct.x)}, ${r(ct.y)})px; shadow ${SHADOW}.`
      : `The user's screenshot in a browser window made in code: a ${ct.w}×${r(ct.h)}px 16:10 content area (the image fills the width and crops from the top) under a ${BAR}px white top bar with three 12px dots in rgba(0,0,0,0.14) 8px apart from 22px in, a centred URL pill (30px tall, full radius, ${CANVAS.paper.fill}) holding a small lock outline and "${p.url}" in Inter 400 15px ${CANVAS.paper.ink2}, and a 1px rgba(0,0,0,0.08) hairline under the bar. Radius ${RADIUS.card} on the window, a 1px rgba(0,0,0,0.08) outline and shadow ${SHADOW}; centred, content top-left at (${r(ct.x)}, ${r(ct.y)})px.`;
    const ringLine = showSel
      ? `Highlight: a ${STROKE.ring}px ${p.accent} ring (radius ${RADIUS.button}) settles around the zoomed area, its padding easing ${RING.from}→${RING.pad}px with a fade, frames ${f(1, T.ring[0])}–${f(1, T.ring[1])} on ${enter}. A chip "${p.feature}" (${p.accent}, white Inter 500 ${L.chip}px, ${r(L.chip * 1.8)}px tall, ${CHIP.padX}px side padding, radius ${RADIUS.chip}) sits ${CHIP.gap}px ${G.chipV === "above" ? "above the ring" : G.chipV === "below" ? "below the ring (no room above)" : "inside the ring's top edge"}, ${G.chipRight ? "right" : "left"}-aligned with it and kept ${EDGE}px inside the frame; it pops in frames ${f(1, T.chip[0])}–${f(1, T.chip[1])} on ${spring} (scale ${CHIP.from}→1 + fade).`
      : `No ring or chip is drawn (highlight off); the camera still pushes in.`;

    return [
      targetLine(c.target, `a four-shot "we shipped a feature" film: the feature name on a flat field, the user's ${tall ? "phone screen in a phone frame" : "screenshot in a browser window"} with a camera push into the feature, three benefits beside the zoomed product, then a call to action`, c.width, c.height, c.seconds),
      `Hard cuts at frames ${SHOTS[1]} and ${SHOTS[3]}; shots 2 and 3 (from frame ${SHOTS[1]} and ${SHOTS[2]}) share one stage and one camera, so that cut is invisible. Flat colour fields only: no gradients, glows or text shadows. Inter for all type, Geist Mono for captions; sentence case. Sizes are px at 1080 on the short side. One accent, ${p.accent}.`,
      `Word rise: each row of display type sits in its own overflow-hidden mask; every word rises from translateY(115%) to 0 over ${T.wordDur} frames on ${enter}, ${STAGGER} frames apart (capped at ${T.maxStagger} steps).`,
      `Shot 1 (frames ${SHOTS[0]}–${SHOTS[1]}): flat ${p.field}. Captions in Geist Mono ${L.caption}px, uppercase, tracking +${TRACK.caption}em, ${ink1} at 55%: "${p.kicker}" top-left and "${p.date}" top-right at a ${MARGIN}px margin, fading in and rising 8px over frames ${T.caption[0]}–${T.caption[1]} on enter. A ${STROKE.hair}px hairline (${ink1} at 20%) at y ${ruleY}px between the margins draws on left to right (scaleX 0→1) over frames ${T.rule[0]}–${T.rule[1]} on enter.`,
      `Below it, left-aligned at the margin and centred vertically in the space under the hairline: a "${p.badge}" pill (${L.pill}px tall, radius ${RADIUS.button}, white with a 1px rgba(0,0,0,0.08) outline and the soft shadow, a ${L.dot}px ${p.accent} dot then Inter 500 ${L.pillText}px) that springs in (scale 0.9→1 + fade) over frames ${T.pill[0]}–${T.pill[1]} on ${spring}; 36px below, ${rowsText(feat.rows)} in ${ink1}, Inter 600 ${r(feat.size)}px, tracking ${TRACK.feature}em, line height ${LINE_H.display}, word rise from frame ${T.wordStart}; 28px below, "${p.subline}" in Inter 400 ${L.sub}px, line height ${LINE_H.body}, ${ink1} at 60%, max ${L.subMaxW}px wide, fading in and rising 24px over frames ${T.sub[0]}–${T.sub[1]} on enter.`,
      `Shot 2 (frames ${SHOTS[1]}–${SHOTS[2]}): flat ${p.stage}. ${device}`,
      `It rises ${RISE}px and untilts from rotateX(${TILT}deg) to 0 (perspective ${PERSPECTIVE}px, origin bottom centre) over frames ${f(1, T.rise[0])}–${f(1, T.rise[1])} on ${spring}, fading in over the first ${T.fade[1]} frames.`,
      `Camera, frames ${f(1, T.zoom[0])}–${f(1, T.zoom[1])} on ${travel}: one scale + translate on the ${tall ? "phone" : "window"} into ${areaDesc}, its centre aimed ${CAMERA_DY}px below the frame's middle. The landed view never shows part of the ${tall ? "phone" : "window"}: take the fit scale (the area fills ${Math.round(L.fill * 100)}% of the width or ${Math.round(L.fillH * 100)}% of the height, 1×–${MAX_ZOOM}×); if the whole ${tall ? "phone" : "window"} still fits ${EDGE}px inside the frame, use it; else if it makes the screenshot (inset ${RADIUS.card}px for its rounded corners) cover the full frame, use it; else zoom to exactly that cover scale if the area still fits ${Math.round(COVER_ROOM.w * 100)}% × ${Math.round(COVER_ROOM.h * 100)}% of the frame; otherwise accept less zoom: the largest scale that keeps the whole ${tall ? "phone" : "window"} ${EDGE}px inside the frame. Here: ${S.toFixed(2)}× (${G.zoomMode === "whole" ? "whole device in view" : G.zoomMode === "cover" ? "screenshot covers the frame" : G.zoomMode === "cover-min" ? "raised to the cover scale" : "reduced so the whole device stays in view"}). Then clamp the translate per axis: covering → the inset screenshot must cover the frame; fitting → the device stays fully inside; in between → centre it. The area lands at ${r(G.zoomed.w)}×${r(G.zoomed.h)}px, x ${r(G.zoomed.x)}, y ${r(G.zoomed.y)}. Lay the ${tall ? "phone" : "window"} out at its zoomed size so the image and chrome stay sharp.`,
      ringLine,
      `Shot 3 (frames ${SHOTS[2]}–${SHOTS[3]}): same ${p.stage} stage. Over frames ${f(2, T.move[0])}–${f(2, T.move[1])} on ${travel}, the full-frame view shrinks into a card cropped to the feature area plus an even margin (${Math.round(CARD_MARGIN * 100)}% of the area's mean side, at least ${CARD_MIN_MARGIN}px on screen; never beyond the screenshot), scaled to fit ${tall ? `${r(W - 2 * MARGIN)}×${L.card.h}` : `${L.card.w}×${L.card.h}`}px: here ${r(card.w)}×${r(card.h)}px at (${r(card.x)}, ${r(card.y)})px${tall ? ", centred horizontally" : ", right margin, centred vertically"} (radius 0→${RADIUS.card}, the 1px outline and soft shadow fading in, the device's own corners squaring off). The zoom eases from ${S.toFixed(2)}× to ${K.toFixed(2)}× with the area re-centred in the card, so no partial page content sits at its edges.${showSel ? ` The ring travels with the area; the chip fades out over frames ${f(2, T.chipOut[0])}–${f(2, T.chipOut[1])} on ${exit}.` : ""}`,
      `Benefits ${benefitBox}: "${p.feature}" as a Geist Mono ${L.caption}px uppercase label (${ink2} at 55%) fading in over frames ${f(2, T.header[0])}–${f(2, T.header[1])}, then ${benefits.length} rows separated by ${STROKE.hair}px hairlines (${ink2} at 16%), ${L.rowPad}px vertical padding: a ${L.check}px ${p.accent} circle with a white ${STROKE.ring}px check (springs in, scale 0.6→1 + fade) and the text in Inter 500 ${L.benefit}px, tracking -0.025em, line height ${LINE_H.row}, ${ink2}, 28px gap. Rows: ${benefits.map((b, i) => `"${b}" from frame ${f(2, T.rows[i])}`).join(", ")}; each text rises from translateY(115%) in its own mask over ${T.rowDur} frames on enter. As each row lands, the earlier rows dim to ${Math.round(DIM * 100)}% over ${T.dim} frames; all return to full over frames ${f(2, T.back[0])}–${f(2, T.back[1])}.`,
      `Shot 4 (frames ${SHOTS[3]}–${end}): flat ${p.end}. Centred: ${rowsText(cta.rows)} in ${ink4}, Inter 500 ${r(cta.size)}px, tracking ${TRACK.cta}em, line height ${LINE_H.display}, word rise from frame ${f(3, T.ctaStart)}. 52px below, a ${ink4} pill button ${L.button}px tall (full radius, ${r(0.44 * L.button)}px side padding) with "${p.url}" in Inter 500 ${L.buttonText}px in ${p.end} and a ${STROKE.ring}px arrow glyph; it fades in and rises 24px over frames ${f(3, T.button[0])}–${f(3, T.button[1])} on enter, then presses: scale 1→${1 - PRESS} over frames ${f(3, T.press[0])}–${f(3, T.press[1])} on travel and back over ${f(3, T.press[1])}–${f(3, T.press[2])} on enter.`,
      `Bottom-left at a ${MARGIN}px margin: the user's logo file at ${L.logo}px tall then "${p.brand}" in Inter 500 ${r(L.logo * 0.82)}px, ${ink4}${tall ? "" : `; bottom-right, "${p.kicker}" as a Geist Mono ${L.caption}px uppercase caption at 50%`}; ${tall ? "it fades" : "both fade"} in (the logo rising 12px) over frames ${f(3, T.logo[0])}–${f(3, T.logo[1])} on enter.`,
      `Everything is still from frame ${f(3, T.press[2])}; the last ${FINAL_HOLD} frames (${end - FINAL_HOLD}–${end}) are perfectly still.`,
    ].join("\n");
  },
});
