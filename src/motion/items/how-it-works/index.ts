import { FILM, SAMPLE } from "../../film";
import { ACCENT, FINAL_HOLD, RADIUS, STAGGER, STATE, STROKE, bezierText, targetLine } from "../../kit";
import { areaText, areaValue } from "../../placement";
import { defineMotion } from "../../types";
import {
  BODY_LH,
  CARD_W,
  CONNECT,
  DOTS,
  FILL,
  HowItWorks,
  LINE_H,
  MAX_ZOOM,
  NUM_OVERLAP,
  PRIORITIES,
  REORDER,
  RESULT_AREA,
  RESULT_AREA_TALL,
  SHADOW,
  SHOTS,
  SIZE,
  SLOT_ASPECT,
  SOURCES,
  T,
  TEXT_GAP,
  TRACKING,
  WINDOW,
  cardBox,
  endLayout,
  hookLayout,
  inkOn,
  resultAreaOf,
  resultBox,
  stepLayout,
  zoomFor,
  type HowItWorksProps,
} from "./HowItWorks";

// Each colourway changes the hook, the three step fields, the end card and the accent together.
const looks: { name: string; hook: string; field1: string; field2: string; field3: string; end: string; accent: string }[] = [
  { name: "Lavender", hook: FILM.black, field1: FILM.cream, field2: FILM.canvas, field3: FILM.lavender, end: FILM.white, accent: FILM.orange },
  { name: "Lime", hook: FILM.black, field1: FILM.canvas, field2: FILM.white, field3: FILM.lime, end: FILM.cream, accent: ACCENT.blue },
  { name: "Green", hook: FILM.green, field1: FILM.cream, field2: FILM.lime, field3: FILM.white, end: FILM.cream, accent: FILM.select },
  { name: "Plum", hook: FILM.plum, field1: FILM.white, field2: FILM.cream, field3: FILM.lavender, end: FILM.white, accent: FILM.orange },
];
const palettes = looks.map(({ name, ...values }) => ({ name, swatch: [values.hook, values.field1, values.field3, values.accent], values }));

export default defineMotion<HowItWorksProps>({
  slug: "how-it-works",
  name: "How It Works",
  description: "A three-step product explainer: a step track fills as each step plays out in real UI, then completes as the underline of your call to action.",
  category: "templates",
  tags: ["explainer", "onboarding", "steps", "product", "website"],
  addedAt: "2026-10-21",
  durationInFrames: 540,
  fps: 30,
  ratios: ["16:9", "9:16"],
  component: HowItWorks,
  defaultProps: {
    ...palettes[0].values,
    title: "Plan your week in three steps",
    step1: "Connect your calendar",
    step2: "Set your priorities",
    step3: "Lumen plans it for you",
    detail1: "Work, personal and team calendars in one place.",
    detail2: "Drag what matters most to the top.",
    detail3: "Focus time lands where it fits, every week.",
    result: "Your week is planned",
    cta: "Start planning free",
    url: "lumen.app",
    brand: SAMPLE.brand,
    logo: SAMPLE.logo,
    screenshot: SAMPLE.site,
    phoneShot: SAMPLE.phone,
    resultArea: areaValue(RESULT_AREA),
    resultAreaTall: areaValue(RESULT_AREA_TALL),
    showCursor: true,
  } as HowItWorksProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Hook title", maxLength: 40 },
    { type: "text", key: "step1", label: "Step 1", maxLength: 28 },
    { type: "text", key: "detail1", label: "Step 1 detail", maxLength: 60 },
    { type: "text", key: "step2", label: "Step 2", maxLength: 28 },
    { type: "text", key: "detail2", label: "Step 2 detail", maxLength: 60 },
    { type: "text", key: "step3", label: "Step 3", maxLength: 28 },
    { type: "text", key: "detail3", label: "Step 3 detail", maxLength: 60 },
    { type: "text", key: "result", label: "Step 3 toast", maxLength: 26 },
    { type: "text", key: "cta", label: "Call to action", maxLength: 28 },
    { type: "text", key: "url", label: "URL", maxLength: 28 },
    { type: "text", key: "brand", label: "Brand name", maxLength: 16 },
    { type: "image", key: "logo", label: "Logo", hint: "PNG or SVG, transparent" },
    { type: "image", key: "screenshot", label: "Screenshot", hint: "16:10 page screenshot (step 3)" },
    { type: "image", key: "phoneShot", label: "Phone screen", hint: "Phone screen, 9:19.5 (vertical film)" },
    { type: "area", key: "resultArea", label: "Result area", image: "screenshot", aspect: SLOT_ASPECT.wide, ratio: "16:9", hint: "The camera pushes toward this" },
    { type: "area", key: "resultAreaTall", label: "Result area", image: "phoneShot", aspect: SLOT_ASPECT.tall, ratio: "9:16", hint: "The camera pushes toward this" },
    { type: "toggle", key: "showCursor", label: "Cursor" },
    { type: "color", key: "accent", label: "Accent" },
  ],
  prompt: (p, c) => {
    const tall = c.height > c.width;
    const short = Math.min(c.width, c.height);
    const W = (c.width * 1080) / short;
    const H = (c.height * 1080) / short;
    const L = tall ? SIZE.tall : SIZE.wide;
    const end = c.seconds * c.fps;
    const f = (shot: number, local: number) => SHOTS[shot] + local;
    const r = (n: number) => Math.round(n);
    const enter = `enter, ${bezierText("enter")}`;
    const travel = `travel, ${bezierText("travel")}`;
    const spring = bezierText("spring");
    const rowsText = (rows: string[][]) => rows.map((x) => `"${x.join(" ")}"`).join(" / ");
    const showCursor = p.showCursor !== false;
    const dots = DOTS.map((d) => `${r(d * 100)}%`).join(", ");

    const hook = hookLayout(p.title, W, H, 1, tall);
    const steps = [
      { title: p.step1, detail: p.detail1, field: p.field1 },
      { title: p.step2, detail: p.detail2, field: p.field2 },
      { title: p.step3, detail: p.detail3, field: p.field3 },
    ].map((s) => ({ ...s, G: stepLayout(s.title, s.detail, W, H, 1, tall) }));
    const G0 = steps[0].G;
    const c1 = cardBox(CONNECT.h, W, H, 1, tall, steps[0].G.bottom);
    const c2 = cardBox(REORDER.h, W, H, 1, tall, steps[1].G.bottom);
    const box = resultBox(W, H, 1, tall, steps[2].G.bottom);
    const area = resultAreaOf(p, tall);
    const z = zoomFor(area, box.sw, box.sh);
    const isDefaultArea = (tall ? p.phoneShot : p.screenshot) === (tall ? SAMPLE.phone : SAMPLE.site) && areaValue(area) === areaValue(tall ? RESULT_AREA_TALL : RESULT_AREA);
    const E = endLayout(p.cta, H, 1, tall);
    const cardWhere = (b: { cx: number; cy: number; k: number }, h: number) =>
      tall
        ? `designed ${CARD_W}×${h}px and scaled ×${b.k.toFixed(2)} (to ${r(CARD_W * b.k)}px wide), centred horizontally below the text at y ${r(b.cy)}px`
        : `designed ${CARD_W}×${h}px and scaled ×${b.k.toFixed(3)} (to ${r(CARD_W * b.k)}×${r(h * b.k)}px), its right edge ${L.margin}px from the frame's right, centred at y ${r(b.cy)}px`;
    const cardSurface = `white card (the Ink card #1A1A1A if the field is dark), radius ${RADIUS.card}, a 1px rgba(0,0,0,0.06) hairline and shadow ${SHADOW}`;
    const stage = (push: boolean) =>
      `The card springs in over frames ${T.step.card[0]}–${T.step.card[1]} of the shot (${spring}): fade in and rise 60px${push ? `, then a slow linear push from scale 1 to ${1 + T.step.push} across the whole shot` : ""}.`;
    const cursorText = `a black arrow cursor (#111111, 1.6px white outline, ${r(34 * L.cursor)}px tall, no name tag)`;

    const stepCommon = (i: number) => {
      const s = steps[i];
      const G = s.G;
      const ink = inkOn(s.field);
      return `Shot ${i + 2} (frames ${SHOTS[i + 1]}–${SHOTS[i + 2]}): flat ${s.field}, type ${ink}. Top-left, the track at x ${G.x}px, y ${G.trackY}px, ${L.track}px long with ${L.trackR * 2}px dots; the accent fill travels from ${i === 0 ? "0" : `the ${["first", "second"][i - 1]} dot`} to dot ${i + 1} over frames ${f(i + 1, T.step.fill[0])}–${f(i + 1, T.step.fill[1])} on ${travel}, and dot ${i + 1} fills with the accent (scale 0→1, ${spring}) at ${f(i + 1, T.step.pop[0])}–${f(i + 1, T.step.pop[1])}${i > 0 ? "; earlier dots stay filled" : ""}. "Step ${i + 1} of 3" in Geist Mono ${L.mono}px at 50% ${ink}, 28px right of the track; "${p.url}" in the same mono, right-aligned at the ${L.margin}px margin on the track's line. Left column at x ${G.x}px: "0${i + 1}" in Inter 600 ${L.numeral}px, tracking ${TRACKING.numeral}em, line height 1, ${ink} at 10% opacity, top at y ${r(G.numTop)}px, fading in and rising 40px over frames ${f(i + 1, T.step.numeral[0])}–${f(i + 1, T.step.numeral[1])} on enter; over its lower part (${NUM_OVERLAP}em down), ${rowsText(G.rows)} in Inter 500 ${r(G.size)}px, tracking ${TRACKING.step}em, line height ${LINE_H}, with the word rise from frame ${f(i + 1, T.step.words)}; ${TEXT_GAP}px below it "${s.detail}" in Inter 400 ${L.detail}px, line height ${BODY_LH}, ${ink} at 60%, max ${L.detailMaxW}px wide, fading in and rising 20px over frames ${f(i + 1, T.step.detail[0])}–${f(i + 1, T.step.detail[1])} on enter.`;
    };

    const tg = CONNECT.toggle;
    const C = T.connect;
    const R = T.reorder;
    const shot2ui = `Right: "Connect calendars" — a ${cardSurface}, ${cardWhere(c1, CONNECT.h)}. Header: "Connect calendars" Inter 500 30px, "3 sources found" Geist Mono 18px grey below it, and a live counter "0 / 3 connected" (Geist Mono 20px) at the right; a 1px divider at y ${CONNECT.header}. Three ${CONNECT.row}px rows: a 56px grey tile (radius ${RADIUS.button}) with a line calendar icon, the name in Inter 500 28px over a Geist Mono 18px grey sub-line (${SOURCES.map((s) => `"${s.name}" / "${s.sub}"`).join(", ")}), and a ${tg.w}×${tg.h}px pill toggle at the right: off is ink at 12%, on fades to the accent while the ${tg.knob}px white knob slides right (${T.connect.toggle} frames, ${spring}). Toggles switch on at frames ${C.clicks.map((k) => f(1, k)).join(", ")}. Footer under a divider: "Read-only · syncs every 5 min" in grey mono; "All connected" with a ${STATE.success} dot fades in at the right over ${f(1, C.done[0])}–${f(1, C.done[1])}. ${stage(true)}`;
    const shot2cursor = showCursor
      ? `Cursor: ${cursorText} glides in from off-frame bottom-right along a slight arc to toggle 1 (frames ${f(1, C.enter[0])}–${f(1, C.enter[1])}), then to toggle 2 (${f(1, C.moves[0][0])}–${f(1, C.moves[0][1])}) and toggle 3 (${f(1, C.moves[1][0])}–${f(1, C.moves[1][1])}), all on ${travel}, clicking each as it switches (scale dips 10% and returns over 8 frames), then eases off below the card (${f(1, C.rest[0])}–${f(1, C.rest[1])}). It lives inside the card's transform, so it rides the push.`
      : `No cursor is drawn (cursor off); the toggles still switch on at the same frames.`;

    const shot3ui = `Right: "This week's priorities" — the same card, ${cardWhere(c2, REORDER.h)}, header sub-line "Drag to reorder"; "Order saved" with a ${STATE.success} dot fades in at the header's right over ${f(2, R.saved[0])}–${f(2, R.saved[1])}. Three ${REORDER.tile}px tiles (radius ${RADIUS.button}, ${REORDER.step - REORDER.tile}px apart, light grey fill): a six-dot drag handle, the label in Inter 500 28px, an hours bar (${STROKE.bar}px, full pill, ${REORDER.barMax}px at 12 h; the dragged row's bar is the accent, the others ink at 18%) and the hours in Geist Mono 20px. Starting order: ${[1, 2, 0].map((i) => `"${PRIORITIES[i].label}" (${PRIORITIES[i].hours} h)`).join(", ")}. "Deep work" lifts at ${f(2, R.lift[0])}–${f(2, R.lift[1])} (scale 1.025, turns white with a ${STROKE.ring}px accent ring and a 0 12px 28px rgba(0,0,0,0.12) shadow, ${spring}), springs up to the top slot over ${f(2, R.drag[0])}–${f(2, R.drag[1])}; "Admin" steps down at ${f(2, R.admin[0])}–${f(2, R.admin[1])} and "Meetings" at ${f(2, R.meetings[0])}–${f(2, R.meetings[1])}, both on the spring; the row drops (lift reverses) at ${f(2, R.drop[0])}–${f(2, R.drop[1])}. ${stage(true)}`;
    const shot3cursor = showCursor
      ? `Cursor: the same cursor glides from off-frame bottom-right to Deep work's handle (${f(2, R.enter[0])}–${f(2, R.enter[1])}, ${travel}), presses at ${f(2, R.press)}, rides the handle up, releases at ${f(2, R.drop[0])} and eases away (${f(2, R.rest[0])}–${f(2, R.rest[1])}).`
      : `No cursor is drawn (cursor off); the row still lifts and moves.`;

    const frameText = tall
      ? `the user's phone screen in a ${r(box.sw)}×${r(box.sh)}px frame (radius ${RADIUS.hero}, 1px rgba(0,0,0,0.08) hairline, the same soft shadow), centred horizontally below the text at y ${r(box.cy)}px`
      : `a browser window ${r(box.w)}×${r(box.h)}px (radius ${RADIUS.card}, the same card surface): a ${WINDOW.chrome}px bar with three 12px dots at 15% ink and a centred ${RADIUS.chip}px-radius pill showing "${p.url}" in Geist Mono 20px, then the user's screenshot in a ${r(box.sw)}×${r(box.sh)}px 16:10 slot; right edge at the ${L.margin}px margin, centred at y ${r(box.cy)}px`;
    const shot4ui = `Right: ${frameText}. The image fills the slot's width and crops from the top. Camera push inside the slot over frames ${f(3, T.result.zoom[0])}–${f(3, T.result.zoom[1])} on ${travel}: scale 1→${z.S.toFixed(2)}× toward the result area at ${areaText(area)} of the visible slot${isDefaultArea ? ` (${tall ? "the first two event cards" : "the Mon–Thu events in the week view"})` : ""}: the zoom fits the area into ${r(FILL * 100)}% of the slot (between 1× and ${MAX_ZOOM}×), centres it, then clamps the translate so the view never leaves the image (final translate ${r(z.tx)}, ${r(z.ty)}px). The image is laid out at its zoomed size so it stays sharp. At ${f(3, T.result.toast[0])}–${f(3, T.result.toast[1])} a toast pops in ${tall ? "centred 40px above the frame's bottom" : "28px in from the window's bottom-left"} (${spring}, fade + rise 16px): white, 64px tall, radius ${RADIUS.button}, a 12px accent dot and "${p.result}" in Inter 500 24px. The window springs in like the cards, with no push of its own.`;

    return [
      targetLine(c.target, `a five-shot "how it works" explainer: a hook, three steps shown in real UI, and a call to action; a three-dot step track fills through the film and ends as the CTA's underline`, c.width, c.height, c.seconds),
      `Hard cuts at frames ${SHOTS.join(", ")}. Flat colour fields only: no gradients, glows or text shadows. Inter only (Geist Mono for tiny labels), sentence case. Sizes are px at 1080 on the short side. One accent, ${p.accent}, for the track fill, toggles, the dragged row and the underline.`,
      `The motif: a hairline track (${STROKE.hair}px, ink at 25%) with three dots at ${dots} of its length (hollow: field colour with a ${STROKE.hair}px ring at 30% ink). The accent fill (${STROKE.ring}px, round ends) reaches one more dot each step; reached dots fill solid accent.`,
      `Word rise: each row of type sits in its own overflow-hidden mask; every word rises from translateY(115%) to 0 over 16 frames on ${enter}, ${STAGGER} frames apart.`,
      `Shot 1 (frames ${SHOTS[0]}–${SHOTS[1]}): flat ${p.hook}. ${rowsText(hook.rows)} centred, Inter 600 ${r(hook.size)}px, tracking ${TRACKING.display}em, line height ${LINE_H}, ${inkOn(p.hook)}, word rise from frame ${T.hook.words} (capped at ${T.hook.cap} steps). ${L.hookGap}px below it, the track, ${L.hookTrack}px long and centred, with ${L.hookR * 2}px dots: the hairline draws left to right over frames ${T.hook.line[0]}–${T.hook.line[1]} on ${travel}, each dot pops (scale 0→1, ${spring}, ${T.hook.dotDur} frames) as the line reaches it, and "STEP 01" / "STEP 02" / "STEP 03" in Geist Mono ${r(L.mono * 0.9)}px, tracking 0.12em, 50% ${inkOn(p.hook)}, fade in and rise 12px 28px under each dot. The user's logo file (${L.hookLogo}px tall) with "${p.brand}" top-left and "${p.url}" in mono top-right, at the ${L.margin}px margin, fade in over frames ${T.hook.marks[0]}–${T.hook.marks[1]}.`,
      stepCommon(0),
      shot2ui,
      shot2cursor,
      stepCommon(1),
      shot3ui,
      shot3cursor,
      stepCommon(2),
      shot4ui,
      `The track sits in the same top-left place in shots 2–4, so it carries across those cuts as a match.${tall ? ` 9:16: the text stacks on top (from y ${r(G0.numTop)}px) and the card or phone goes below it, full width.` : ""}`,
      `Shot 5 (frames ${SHOTS[4]}–${end}): flat ${p.end}. ${rowsText(E.rows)} centred, Inter 600 ${r(E.size)}px, tracking ${TRACKING.display}em, ${inkOn(p.end)}, word rise from frame ${f(4, T.end.words)}. The full track becomes its underline: exactly the last row's text width, 0.06em below it, a ${STROKE.hair}px hairline at 20% ink with three hollow ${L.endR * 2}px dots at ${dots}; a ${STROKE.bar}px accent bar (full pill) draws left to right over frames ${f(4, T.end.line[0])}–${f(4, T.end.line[1])} on ${travel}, each dot filling with the accent as the bar passes (${spring}, ${T.end.dotDur} frames); then all dots shrink to 0 over ${f(4, T.end.dotsOut[0])}–${f(4, T.end.dotsOut[1])} on exit, ${bezierText("exit")}, leaving a clean accent underline. The user's logo file (${L.logo}px tall) with "${p.brand}" bottom-left and "${p.url}" in Geist Mono ${r(L.mono * 1.1)}px at 60% bottom-right, at the ${L.margin}px margin, fade in and rise 16px over ${f(4, T.end.marks[0])}–${f(4, T.end.marks[1])}.`,
      `Hold the end card still from frame ${f(4, T.end.dotsOut[1])}; the last ${Math.max(FINAL_HOLD, end - f(4, T.end.dotsOut[1]))} frames are perfectly still.`,
    ].join("\n");
  },
});

