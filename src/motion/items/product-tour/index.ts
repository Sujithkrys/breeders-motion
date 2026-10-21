import { FILM, SAMPLE } from "../../film";
import { ACCENT, FINAL_HOLD, RADIUS, STAGGER, STROKE, bezierText, targetLine } from "../../kit";
import { areaText, areaValue } from "../../placement";
import { defineMotion } from "../../types";
import {
  BAR,
  BEZEL,
  CANVAS_SCALE,
  CARD_RISE,
  DRIFT,
  EM,
  FLY,
  HUD,
  LABEL,
  LAYOUT,
  LINE_H,
  MARGIN,
  MAX_ZOOM,
  ProductTour,
  RING,
  SHADOW,
  SHOTS,
  STOPS_TALL,
  STOPS_WIDE,
  STOP_COUNT,
  STOP_WHAT,
  STOP_WINDOW,
  T,
  TOUR,
  TRACK,
  WIN_RISE,
  arriveOf,
  camsOf,
  departOf,
  detailsOf,
  featuresOf,
  fitRows,
  flyDip,
  geometry,
  holdEnd,
  labelOn,
  stopCam,
  stopsOf,
  textOn,
  type ProductTourProps,
} from "./ProductTour";

// Each colourway sets the tour canvas and the one accent together (the title and end cards stay black).
const looks: { name: string; stage: string; accent: string }[] = [
  { name: "Canvas", stage: FILM.canvas, accent: FILM.orange },
  { name: "Cream", stage: FILM.cream, accent: ACCENT.blue },
  { name: "Lavender", stage: FILM.lavender, accent: FILM.orange },
  { name: "Lime", stage: FILM.lime, accent: FILM.select },
];
const palettes = looks.map((l) => ({ name: l.name, swatch: [FILM.black, l.stage, l.accent], values: { stage: l.stage, accent: l.accent } }));

const stopDefaults = {
  stop1: areaValue(STOPS_WIDE[0]),
  stop2: areaValue(STOPS_WIDE[1]),
  stop3: areaValue(STOPS_WIDE[2]),
  stop4: areaValue(STOPS_WIDE[3]),
  stop1Tall: areaValue(STOPS_TALL[0]),
  stop2Tall: areaValue(STOPS_TALL[1]),
  stop3Tall: areaValue(STOPS_TALL[2]),
  stop4Tall: areaValue(STOPS_TALL[3]),
};

const WIDE_ASPECT = LAYOUT.wide.aspect;
const TALL_ASPECT = LAYOUT.tall.aspect;

export default defineMotion<ProductTourProps>({
  slug: "product-tour",
  name: "Product Tour",
  description: "A homepage hero film: one continuous camera flies over your two screens on a big canvas, stopping on four features with a caption card at each, then a call to action.",
  category: "templates",
  tags: ["product tour", "homepage", "camera", "features", "hero"],
  addedAt: "2026-10-21",
  durationInFrames: 600,
  fps: 30,
  ratios: ["16:9", "9:16"],
  component: ProductTour,
  defaultProps: {
    ...palettes[0].values,
    title: "Meet Lumen",
    subtitle: "The calendar that plans itself",
    feature1: "One-click planning",
    detail1: "Turn your to-do list into a real week.",
    feature2: "Your week at a glance",
    detail2: "Every block has a place, Monday to Friday.",
    feature3: "Deep work, protected",
    detail3: "Lumen guards your best hours for focus.",
    feature4: "Replan in one click",
    detail4: "Plans move when your day does.",
    cta: "See your week, planned",
    url: "lumen.app",
    brand: SAMPLE.brand,
    logo: SAMPLE.logo,
    screenshot: SAMPLE.site,
    screenshot2: SAMPLE.appDark,
    phoneShot: SAMPLE.phone,
    phoneShot2: SAMPLE.phoneDark,
    ...stopDefaults,
    showSelection: true,
  } as ProductTourProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title", maxLength: 24 },
    { type: "text", key: "subtitle", label: "Subtitle", maxLength: 40 },
    { type: "text", key: "feature1", label: "Feature 1", maxLength: 28 },
    { type: "text", key: "detail1", label: "Detail 1", maxLength: 52 },
    { type: "text", key: "feature2", label: "Feature 2", maxLength: 28 },
    { type: "text", key: "detail2", label: "Detail 2", maxLength: 52 },
    { type: "text", key: "feature3", label: "Feature 3", maxLength: 28 },
    { type: "text", key: "detail3", label: "Detail 3", maxLength: 52 },
    { type: "text", key: "feature4", label: "Feature 4", maxLength: 28 },
    { type: "text", key: "detail4", label: "Detail 4", maxLength: 52 },
    { type: "text", key: "cta", label: "Call to action", maxLength: 32 },
    { type: "text", key: "url", label: "URL", maxLength: 28 },
    { type: "text", key: "brand", label: "Brand name", maxLength: 16 },
    { type: "image", key: "logo", label: "Logo", hint: "PNG or SVG, transparent" },
    { type: "image", key: "screenshot", label: "Screenshot 1", hint: "16:10 screenshot, left window (stops 1–2)" },
    { type: "image", key: "screenshot2", label: "Screenshot 2", hint: "16:10 screenshot, right window (stops 3–4)" },
    { type: "image", key: "phoneShot", label: "Phone screen 1", hint: "Phone screen, 9:19.5, left phone (vertical film)" },
    { type: "image", key: "phoneShot2", label: "Phone screen 2", hint: "Phone screen, 9:19.5, right phone (vertical film)" },
    { type: "area", key: "stop1", label: "Stop 1", image: "screenshot", aspect: WIDE_ASPECT, ratio: "16:9", hint: "The camera's first stop" },
    { type: "area", key: "stop2", label: "Stop 2", image: "screenshot", aspect: WIDE_ASPECT, ratio: "16:9", hint: "The camera's second stop" },
    { type: "area", key: "stop3", label: "Stop 3", image: "screenshot2", aspect: WIDE_ASPECT, ratio: "16:9", hint: "The camera's third stop" },
    { type: "area", key: "stop4", label: "Stop 4", image: "screenshot2", aspect: WIDE_ASPECT, ratio: "16:9", hint: "The camera's last stop" },
    { type: "area", key: "stop1Tall", label: "Stop 1", image: "phoneShot", aspect: TALL_ASPECT, ratio: "9:16", hint: "The camera's first stop" },
    { type: "area", key: "stop2Tall", label: "Stop 2", image: "phoneShot", aspect: TALL_ASPECT, ratio: "9:16", hint: "The camera's second stop" },
    { type: "area", key: "stop3Tall", label: "Stop 3", image: "phoneShot2", aspect: TALL_ASPECT, ratio: "9:16", hint: "The camera's third stop" },
    { type: "area", key: "stop4Tall", label: "Stop 4", image: "phoneShot2", aspect: TALL_ASPECT, ratio: "9:16", hint: "The camera's last stop" },
    { type: "toggle", key: "showSelection", label: "Selection ring" },
    { type: "color", key: "stage", label: "Canvas" },
    { type: "color", key: "accent", label: "Accent" },
  ],
  prompt: (p, c) => {
    const tall = c.height > c.width;
    const short = Math.min(c.width, c.height);
    const W = (c.width * 1080) / short;
    const H = (c.height * 1080) / short;
    const L = tall ? LAYOUT.tall : LAYOUT.wide;
    const G = geometry(W, H, 1, tall);
    const stops = stopsOf(p, tall);
    const cams = camsOf(G, stops);
    const end = c.seconds * c.fps;
    const r = (n: number) => Math.round(n);
    const enter = `enter, ${bezierText("enter")}`;
    const travel = `travel, ${bezierText("travel")}`;
    const exit = `exit, ${bezierText("exit")}`;
    const spring = bezierText("spring");
    const ink = textOn(p.stage);
    const showSelection = p.showSelection !== false;
    const features = featuresOf(p);
    const details = detailsOf(p);
    const t = fitRows(p.title, L.titleMaxW, L.title, L.titleLines, EM[600]);
    const s = fitRows(p.subtitle, L.subMaxW, L.subtitle, 2, EM[400]);
    const cta = fitRows(p.cta, L.ctaMaxW, L.cta, L.ctaLines, EM[500]);
    const rows = (x: string[][]) => x.map((w) => `"${w.join(" ")}"`).join(" / ");
    const segW = (W - 2 * MARGIN - (STOP_COUNT - 1) * BAR.gap) / STOP_COUNT;
    const shot = tall ? "phone screen" : "screenshot";
    const slots = tall ? ["phoneShot", "phoneShot2"] : ["screenshot", "screenshot2"];
    const samples = tall ? [SAMPLE.phone, SAMPLE.phoneDark] : [SAMPLE.site, SAMPLE.appDark];
    const defaults = tall ? STOPS_TALL : STOPS_WIDE;
    const what = tall ? STOP_WHAT.tall : STOP_WHAT.wide;
    const w0 = G.wins[0];
    const w1 = G.wins[1];
    const zoomOf = (sc: number) => `${(sc / G.sFit).toFixed(2)}×`;
    const C = L.card;

    const stopLines = stops.map((a, i) => {
      const win = STOP_WINDOW[i];
      const key = slots[win] as keyof ProductTourProps;
      const isDefault = p[key] === samples[win] && areaValue(a) === areaValue(defaults[i]);
      const cam = stopCam(G, a, win);
      const prev = cams[i].to;
      const dip = flyDip(G, prev, cam.from);
      const why = cam.capped
        ? `capped so the drift ends at the ${MAX_ZOOM}× limit`
        : cam.raised
          ? "raised so the view fits inside the window"
          : `fits the area into ${r(L.fillW * 100)}% of the width and ${r(L.fillH * 100)}% of the height`;
      return `Stop ${i + 1}, "${features[i]}": ${areaText(a)} of the ${win === 0 ? "first" : "second"} ${shot}${isDefault ? ` (${what[i]})` : ""}. Travel frames ${departOf(i)}–${arriveOf(i)}${dip > 0.01 ? `, pulling back mid-flight (k ${dip.toFixed(2)})` : ""}; land at scale ${cam.from.s.toFixed(3)} (${zoomOf(cam.from.s)} the overview; ${why}), centre (${r(cam.from.cx)}, ${r(cam.from.cy)}); drift to scale ${cam.to.s.toFixed(3)}, centre (${r(cam.to.cx)}, ${r(cam.to.cy)}) by frame ${holdEnd(i)}.`;
    });

    return [
      targetLine(
        c.target,
        `a product-tour hero film in three shots: a title on black, one continuous camera flight over the user's two ${tall ? "phone screens" : "screenshots"} laid out on a big canvas with four feature stops, then a call to action on black`,
        c.width,
        c.height,
        c.seconds,
      ),
      `Hard cuts at frames ${SHOTS.join(", ")}. Flat colour fields only (no gradients, glows or text shadows). Inter only, sentence case; Geist Mono only for tiny labels. Sizes are px at 1080 on the short side. One accent, ${p.accent}, used only for the progress fill, the selection ring and a dot on each caption card.`,
      `Motif, the progress bar: four pill segments ${STROKE.bar}px tall, ${r(segW)}px wide, ${BAR.gap}px apart, spanning the width inside ${MARGIN}px margins with their top ${L.bar}px above the bottom edge, at the same place in all three shots so both cuts match. Tracks are the field's ink at ${r(BAR.track * 100)}%. In shot 1 the tracks grow from their left ends over ${T.barDur} frames from frame ${T.barIn}, ${STAGGER} frames apart, on ${enter}, empty. In the tour, segment n fills with the accent linearly from stop n's departure to the end of its hold. On the end card all four are full.`,
      `A corner label in every shot: "PRODUCT TOUR", Geist Mono ${HUD.size}px, tracking +${HUD.track}em, the field's ink at 50%, top-left at (${MARGIN}, ${HUD.top})px; it fades in over frames ${T.hud[0]}–${T.hud[1]} and then stays put across the cuts.`,
      `Shot 1 (frames ${SHOTS[0]}–${SHOTS[1]}): flat ${FILM.black}. ${rows(t.rows)} in white Inter 600 ${r(t.size)}px, tracking ${TRACK.title}em, line height ${LINE_H}, centred; under it (${L.titleGap}px gap) ${rows(s.rows)} in Inter 400 ${r(s.size)}px, white at 60%, tracking ${TRACK.sub}em. Word-mask rise: each row sits in its own overflow-hidden mask and each title word rises from translateY(115%) to 0 over ${T.wordDur} frames on ${enter}, from frame ${T.title}, ${STAGGER} frames apart; the subtitle rises as one line over frames ${T.subtitle[0]}–${T.subtitle[1]}.`,
      `Shot 2 (frames ${SHOTS[1]}–${SHOTS[2]}): flat ${p.stage}. A canvas ${CANVAS_SCALE}× the frame on each side (${r(G.CW)}×${r(G.CH)}px). On it, side by side and vertically centred, the user's two ${shot}s as ${tall ? `phones ${r(w0.w)}×${r(w0.h)}px (9:19.5) with a ${BEZEL}px black bezel` : `windows ${r(w0.w)}×${r(w0.h)}px (16:10)`}, ${L.gap}px apart, at (${r(w0.x)}, ${r(w0.y)}) and (${r(w1.x)}, ${r(w1.y)}); each image fills its width and crops from the top, radius ${r(G.radius)}px (reads as ${tall ? RADIUS.hero : RADIUS.button}px at the overview and scales with the camera), a 1px rgba(0,0,0,0.08) hairline and shadow ${SHADOW}. ${LABEL.above}px above each one's top-left, in screen space: "${p.brand} — ${L.labels[0]}" and "${p.brand} — ${L.labels[1]}", Geist Mono ${LABEL.size}px, ${labelOn(p.stage)}. They settle in over frames ${SHOTS[1] + T.win[0]}–${SHOTS[1] + T.win[1]} (the second ${T.winStagger} frames later): fade in and rise ${WIN_RISE}px on ${spring}.`,
      `The camera is one transform: canvas point (x, y) lands at ((x − cx)·s + ${r(W / 2)}, (y − cy)·s + ${r(H / 2)}). Render the images at their on-screen size so they stay sharp, and draw labels, ring and card in screen space. Clamp every frame: s between ${G.sMin.toFixed(3)} (the whole canvas) and ${G.sMax.toFixed(3)} (${MAX_ZOOM}× the overview), and the centre at least half a view from every canvas edge, so the view never leaves the canvas. At a stop (landing and the whole hold) clamp tighter, to the target ${tall ? "phone screen" : "window"}: s is at least ${(Math.max(W / w0.w, H / w0.h)).toFixed(3)} so the view fits inside it, and the centre stays half a view inside its edges, so a landed stop only ever shows that ${tall ? "screen" : "window"} (an area at its edge shifts the aim inward). Only the flights show the canvas between them.`,
      `Overview: frames ${SHOTS[1]}–${departOf(0)} at s ${G.sFit.toFixed(3)} on the canvas centre, pushing linearly to ×${DRIFT.open}. Each stop then gets ${TOUR.travel + TOUR.hold} frames: ${TOUR.travel} of travel and ${TOUR.hold} of hold. The stop's scale is the largest that fits its area into ${r(L.fillW * 100)}% of the width and ${r(L.fillH * 100)}% of the height, kept under ${G.sMax.toFixed(3)} ÷ ${DRIFT.scale}; the area's centre lands at ${r(L.aimX * 100)}% across and ${r(L.aimY * 100)}% down. Travel on ${travel} for the centre; the scale moves in log space with a mid-flight pull-back, ln s(t) = mix(ln s₀, ln s₁, t) − k·sin(πt), where k = max(0, ln(1 + ${FLY}·m) − |ln s₁ − ln s₀| / 2) and m is the distance between centres × √(s₀s₁) ÷ ${r(W)}. During the hold drift linearly: scale ×${DRIFT.scale} and pan ${DRIFT.pan * 100}% of the frame width to the right.`,
      ...stopLines,
      `Caption card at each stop: white, radius ${RADIUS.card}px, a ${STROKE.hair}px rgba(0,0,0,0.1) border, shadow ${SHADOW}, padding ${C.padY}px ${C.padX}px, ${tall ? `full width inside ${MARGIN}px margins` : `${C.minW}–${C.maxW}px wide, left at ${MARGIN}px`}, bottom ${C.bottom}px above the frame's bottom. Inside: a ${10}px ${p.accent} dot and "01 / 04" in Geist Mono ${C.index}px at 45% black; the feature in Inter 600 ${C.feature}px, tracking ${TRACK.feature}em, black; the detail in Inter 400 ${C.detail}px, line height 1.35, black at 60%. Texts: ${features.map((f, i) => `"${f}" / "${details[i]}"`).join("; ")}.`,
      `The card enters ${-T.card[0]} frames before the camera lands: rises ${CARD_RISE}px and fades in over ${T.card[1]} frames on ${spring}; its three lines rise in their own masks from 110% over ${T.cardText[1]} frames on ${enter}, ${STAGGER} frames apart. It leaves as the camera departs: fade out and drop 16px over ${T.cardOut} frames on ${exit}. Stop 4's card stays to the cut.`,
      showSelection
        ? `Selection ring: a ${STROKE.ring}px ${p.accent} rounded rectangle (radius ${RADIUS.button}px) ${RING.pad}px outside the stop area, drawn on as a stroke from its top-left over frames arrival${T.ring[0]} to arrival+${T.ring[1]} on ${enter} (strokeDasharray), riding the drift; it fades out over ${T.ringOut} frames on ${exit} as the camera departs.`
        : `No selection ring is drawn (selection off); the camera still flies to each stop.`,
      `Top-right in the tour, mirroring the corner label: the live zoom as a percentage of the overview (e.g. "${r((cams[1].from.s / G.sFit) * 100)}%"), Geist Mono ${HUD.size}px, ${ink} at 50%.`,
      `Shot 3 (frames ${SHOTS[2]}–${end}): flat ${FILM.black}, a centred stack ${L.stackGap}px apart: the user's logo file at ${L.logo}px tall with "${p.brand}" in white Inter 500 ${r(L.logo * 0.82)}px (fades in and rises 16px over frames ${SHOTS[2] + T.logo[0]}–${SHOTS[2] + T.logo[1]} on ${enter}); ${rows(cta.rows)} in white Inter 500 ${r(cta.size)}px, tracking ${TRACK.cta}em, rising as one in its mask over frames ${SHOTS[2] + T.cta[0]}–${SHOTS[2] + T.cta[1]}; then a pill ${L.pillH}px tall with a ${STROKE.hair}px white-30% border holding "${p.url}" in white Inter 500 ${L.url}px and a small arrow (fades in and rises 16px over frames ${SHOTS[2] + T.url[0]}–${SHOTS[2] + T.url[1]}). The progress bar is full.`,
      `Hold the end card still; the last ${end - SHOTS[2] - T.url[1]} frames (${SHOTS[2] + T.url[1]}–${end}) are perfectly still, comfortably over the ${FINAL_HOLD}-frame minimum.`,
    ].join("\n");
  },
});
