import { FILM, SAMPLE } from "../../film";
import { ACCENT, FINAL_HOLD, RADIUS, STAGGER, STROKE, bezierText, targetLine } from "../../kit";
import { pointText, pointValue } from "../../placement";
import { defineMotion } from "../../types";
import {
  BEZEL,
  DIGIT_CELL,
  EM,
  LaunchDay,
  LINE_H,
  PLACEMENT_DEFAULTS,
  POINTS_TALL,
  POINTS_WIDE,
  POINT_WHAT,
  SHOTS,
  SIZE,
  SLOT_ASPECT,
  T,
  TICKS,
  TRACK,
  calloutLayout,
  compact,
  countSize,
  fitRows,
  pointsOf,
  productGeometry,
  textOn,
  thousands,
  votesOf,
  type LaunchDayProps,
} from "./LaunchDay";

// Each colourway sets all four fields and the accent together.
const looks: { name: string; dark: string; pop: string; stage: string; warm: string; accent: string }[] = [
  { name: "Lime", dark: FILM.black, pop: FILM.lime, stage: FILM.canvas, warm: FILM.cream, accent: FILM.orange },
  { name: "Lavender", dark: FILM.black, pop: FILM.lavender, stage: FILM.canvas, warm: FILM.cream, accent: ACCENT.blue },
  { name: "Green", dark: FILM.green, pop: FILM.lime, stage: FILM.cream, warm: FILM.canvas, accent: FILM.orange },
  { name: "Plum", dark: FILM.plum, pop: FILM.lavender, stage: FILM.cream, warm: FILM.canvas, accent: FILM.select },
];
const palettes = looks.map((l) => ({
  name: l.name,
  swatch: [l.dark, l.pop, l.warm, l.accent],
  values: { dark: l.dark, pop: l.pop, stage: l.stage, warm: l.warm, accent: l.accent },
}));

export default defineMotion<LaunchDayProps>({
  slug: "launch-day",
  name: "Launch Day",
  description: "A 3-2-1 countdown that becomes your launch date: name card, your screenshot with feature callouts, an upvote count and a live-now card.",
  category: "templates",
  tags: ["launch", "countdown", "product", "announcement", "upvotes"],
  addedAt: "2026-10-21",
  durationInFrames: 450,
  fps: 30,
  ratios: ["16:9", "9:16"],
  component: LaunchDay,
  defaultProps: {
    ...palettes[0].values,
    kicker: "Launching today",
    name: "Lumen 2.0",
    tagline: "The calendar that plans itself",
    feature1: "Auto-planning",
    feature2: "Focus time",
    feature3: "Team sync",
    votes: 1240,
    rank: "#1 Product of the day",
    cta: "Live now",
    url: "lumen.app",
    date: "Oct 21",
    brand: SAMPLE.brand,
    logo: SAMPLE.logo,
    screenshot: SAMPLE.site,
    phoneShot: SAMPLE.phone,
    showCallouts: true,
    ...PLACEMENT_DEFAULTS,
  } as LaunchDayProps,
  palettes,
  controls: [
    { type: "text", key: "kicker", label: "Kicker", maxLength: 24 },
    { type: "text", key: "name", label: "Product name", maxLength: 18 },
    { type: "text", key: "tagline", label: "Tagline", maxLength: 44 },
    { type: "text", key: "feature1", label: "Feature 1", maxLength: 20 },
    { type: "text", key: "feature2", label: "Feature 2", maxLength: 20 },
    { type: "text", key: "feature3", label: "Feature 3", maxLength: 20 },
    { type: "number", key: "votes", label: "Upvotes", min: 10, max: 99999, step: 10 },
    { type: "text", key: "rank", label: "Rank label", maxLength: 28 },
    { type: "text", key: "cta", label: "Call to action", maxLength: 16 },
    { type: "text", key: "url", label: "URL", maxLength: 28 },
    { type: "text", key: "date", label: "Launch date", maxLength: 10 },
    { type: "text", key: "brand", label: "Brand name", maxLength: 16 },
    { type: "image", key: "logo", label: "Logo", hint: "PNG or SVG, transparent" },
    { type: "image", key: "screenshot", label: "Screenshot", hint: "16:10 page screenshot" },
    { type: "image", key: "phoneShot", label: "Phone screen", hint: "Phone screen, 9:19.5 (vertical film)" },
    { type: "toggle", key: "showCallouts", label: "Feature callouts" },
    { type: "point", key: "point1", label: "Feature 1 point", image: "screenshot", aspect: SLOT_ASPECT.wide, ratio: "16:9", when: "showCallouts" },
    { type: "point", key: "point2", label: "Feature 2 point", image: "screenshot", aspect: SLOT_ASPECT.wide, ratio: "16:9", when: "showCallouts" },
    { type: "point", key: "point3", label: "Feature 3 point", image: "screenshot", aspect: SLOT_ASPECT.wide, ratio: "16:9", when: "showCallouts" },
    { type: "point", key: "point1Tall", label: "Feature 1 point", image: "phoneShot", aspect: SLOT_ASPECT.tall, ratio: "9:16", when: "showCallouts" },
    { type: "point", key: "point2Tall", label: "Feature 2 point", image: "phoneShot", aspect: SLOT_ASPECT.tall, ratio: "9:16", when: "showCallouts" },
    { type: "point", key: "point3Tall", label: "Feature 3 point", image: "phoneShot", aspect: SLOT_ASPECT.tall, ratio: "9:16", when: "showCallouts" },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "dark", label: "Countdown field" },
    { type: "color", key: "pop", label: "Name field" },
    { type: "color", key: "stage", label: "Product field" },
    { type: "color", key: "warm", label: "Upvote field" },
  ],
  prompt: (p, c) => {
    const tall = c.height > c.width;
    const L = tall ? SIZE.tall : SIZE.wide;
    const short = Math.min(c.width, c.height);
    const W = (c.width * 1080) / short;
    const H = (c.height * 1080) / short;
    const end = c.seconds * c.fps;
    const f = (shot: number, local: number) => SHOTS[shot] + local;
    const r = (n: number) => Math.round(n);
    const enter = `enter, ${bezierText("enter")}`;
    const travel = `travel, ${bezierText("travel")}`;
    const spring = bezierText("spring");
    const inkD = textOn(p.dark);
    const inkP = textOn(p.pop);
    const inkS = textOn(p.stage);
    const inkW = textOn(p.warm);
    const rowsText = (rows: string[][]) => rows.map((x) => `"${x.join(" ")}"`).join(" / ");
    const name = fitRows(p.name, L.nameMaxW, L.name, L.nameLines, EM.semibold);
    const tag = fitRows(p.tagline, L.tagMaxW, L.tagline, L.tagLines, EM.regular);
    const cta = fitRows(p.cta, L.ctaMaxW, L.cta, L.ctaLines, EM.semibold);
    const votes = votesOf(p);
    const { frame, slot } = productGeometry(W, H, 1, tall);
    const pts = pointsOf(p, tall);
    const labels = [p.feature1, p.feature2, p.feature3];
    const lay = calloutLayout(labels, pts, W, H, 1, tall);
    const defaults = tall ? POINTS_TALL : POINTS_WIDE;
    const sample = (tall ? p.phoneShot : p.screenshot) === (tall ? SAMPLE.phone : SAMPLE.site);
    const what = tall ? POINT_WHAT.tall : POINT_WHAT.wide;
    const showCallouts = p.showCallouts !== false;
    const outer1 = L.ring + TICKS.gap + TICKS.major;
    const R5 = L.ring5;
    const outer5 = R5 + TICKS.gap + TICKS.major;
    const dateSize = Math.min(L.date5, (1.6 * R5) / (Math.max(1, p.date.length) * EM.mono));
    const marks = `Quiet marks on shots 1–4: Geist Mono 20px, +0.1em tracking, uppercase, at 50% of the shot's ink, ${L.marksBottom}px from the bottom and ${L.margin}px from the sides: the shot number ("02 / 05" etc.) bottom-left and "${p.date.toUpperCase()}" bottom-right.`;

    const callouts = showCallouts
      ? lay.items
          .map((it) => {
            const st = T.calls[it.i];
            const isDef = sample && pointValue(pts[it.i]) === pointValue(defaults[it.i]);
            return `"${labels[it.i]}" at ${pointText(pts[it.i])} of the visible screen${isDef ? ` (${what[it.i]})` : ""}: from frame ${f(2, st)} an accent dot (r 8px, ${p.accent}, ${STROKE.ring}px white stroke) with a hairline accent halo (r 20px, 30% opacity) springs in over ${T.callDot}f; a ${STROKE.hair}px ${p.accent} line draws from the dot to the pill's ${it.side === "right" ? "left" : "right"} edge (frames ${f(2, st + T.callLine[0])}–${f(2, st + T.callLine[1])}, ${enter}); the pill sits ${it.side} of the screen at (${r(it.near)}, ${r(it.y)})px and springs in (fade, scale 0.9→1 from its near edge) over frames ${f(2, st + T.callPill[0])}–${f(2, st + T.callPill[1])}.`;
          })
          .join(" ")
      : "";

    return [
      targetLine(c.target, "a five-shot launch-day film: a 3-2-1 countdown whose digit becomes the launch date, the product name, the product with feature callouts, an upvote count, a live-now card", c.width, c.height, c.seconds),
      `Hard cuts at frames ${SHOTS.join(", ")}. Flat fields only (no gradients, glows or text shadows). Inter only (Geist Mono for small labels and the date), sentence case. Sizes are px at 1080 on the short side. One accent, ${p.accent}, used only for the ring arc, dots, the upvote button, the rank label and the live dot. Springs below are ${spring}, stretched over the stated frames.`,
      `Motif: the countdown's bezel ring (a ${STROKE.hair}px circle at 18% ink, 60 ticks outside it every 6° starting ${TICKS.gap}px out, ${TICKS.minor}px long and ${TICKS.major}px every fifth, at 22% ink, drawn as one path) returns in the last shot around the date, centred on the same point as the digit.`,
      `Shot 1 (frames ${SHOTS[0]}–${SHOTS[1]}): flat ${p.dark}. A countdown digit centred in the frame, Inter 600 ${L.digit}px, ${inkD}: one column of three text nodes "1", "2", "3" plus an empty cell, each ${DIGIT_CELL}em tall, in an overflow-hidden mask one cell tall. The column rolls down one cell at frames ${T.rolls.map((x) => `${x[0]}–${x[1]}`).join(", ")} (${travel}): blank → 3 → 2 → 1. Around it the bezel ring at radius ${L.ring}px; an accent arc (${STROKE.ring}px, round cap) sweeps clockwise from 12 o'clock once per second (linear, 30 frames), restarting at each snap. "${p.kicker}" in Geist Mono ${L.kicker}px, +0.12em, uppercase, 60% ink, with a 10px accent dot, centred ${outer1 + 56}px above the centre, fades and rises 12px over frames ${T.kicker[0]}–${T.kicker[1]} (${enter}). A full-width ${STROKE.hair}px rule at 22% ink, 40px above the bottom marks, draws left to right over frames ${T.rule[0]}–${T.rule[1]}; bottom-left a mono timecode "T–00:03" → "T–00:02" → "T–00:01" changing at each second. Camera: the whole shot scales 1 → ${T.push1} over the shot on ${travel}.`,
      `Shot 2 (frames ${SHOTS[1]}–${SHOTS[2]}): flat ${p.pop}. Centred: ${rowsText(name.rows)} in Inter 600 ${r(name.size)}px, tracking ${TRACK.name}em, line height ${LINE_H}, ${inkP}; under it (${tall ? 44 : 36}px gap) ${rowsText(tag.rows)} in Inter 400 ${r(tag.size)}px, tracking ${TRACK.tagline}em, line height 1.3, ${inkP} at 62%. Word rise: each row is an overflow-hidden mask; each word rises translateY(115%) → 0 over ${T.wordDur}f on ${enter}, ${STAGGER}f apart (capped at ${T.maxStagger} steps), the name from local frame ${T.wordStart}; the tagline's words rise over ${T.tagDur}f from local frame ${T.tagline}. Camera: scale 1 → ${T.push2} over the shot on travel.`,
      tall
        ? `Shot 3 (frames ${SHOTS[2]}–${SHOTS[3]}): flat ${p.stage}. The user's phone screenshot in a phone: a ${r(frame.w)}×${r(frame.h)}px black body (radius ${RADIUS.hero}px) at (${r(frame.x)}, ${r(frame.y)})px with a ${r(slot.w)}×${r(slot.h)}px screen inset ${BEZEL}px (radius ${RADIUS.card}px), the image filling the width and cropped from the top.`
        : `Shot 3 (frames ${SHOTS[2]}–${SHOTS[3]}): flat ${p.stage}. A browser window ${r(frame.w)}×${r(frame.h)}px at (${r(frame.x)}, ${r(frame.y)})px, white, radius ${RADIUS.card}px, 1px rgba(0,0,0,.08) hairline: a ${L.chrome}px chrome bar with three 12px grey dots and a centred 460×34px address pill (#F2F2F0) showing "${p.url}" in Geist Mono 16px #6B6B6B, then the user's screenshot ${r(slot.w)}×${r(slot.h)}px (16:10), filling the width and cropped from the top.`,
      `Shadow 0 1px 2px rgba(0,0,0,.05), 0 10px 28px rgba(0,0,0,.08). It enters from ${T.rise}px below with rotateX ${T.tilt}° → 0 (origin at its bottom edge, perspective 2400px), spring over frames ${f(2, T.enter3[0])}–${f(2, T.enter3[1])}; then the shot scales 1 → ${T.push3Scale} over frames ${f(2, T.push3[0])}–${f(2, T.push3[1])} on ${travel}. "${p.name.toUpperCase()}" in Geist Mono 20px at 50% ink top-left.`,
      showCallouts
        ? `Feature callouts (positions are % of the visible screen; pills are white, full-pill radius, ${L.pillH}px tall, 1px #EAEAEA hairline, small shadow, a ${r(0.36 * lay.fs)}px accent dot then the label in Inter 500 ${L.pill}px #111111; pills on one side are spaced at least ${L.pillH + 14}px apart): ${callouts}`
        : `Feature callouts are off: the product just rises, tilts flat and pushes in.`,
      `Shot 4 (frames ${SHOTS[3]}–${SHOTS[4]}): flat ${p.warm}. "${p.rank.toUpperCase()}" in Geist Mono 22px, +0.12em, ${p.accent}, left-aligned 28px above a white card ${L.cardW}px wide (radius ${RADIUS.card}px, 56px padding, 1px #EAEAEA hairline, shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)); card and label fade and rise 24px over 18f on enter.`,
      `In the card${tall ? ", top row" : ", left"}: a 150×168px upvote button (radius ${RADIUS.button}px, ${STROKE.ring}px #EAEAEA inner border) with a 56px up triangle in the accent; at frame ${f(3, T.press)} it presses (scale dips 5%) and fills with ${p.accent} while the triangle turns white over 4f. Beside it the count, one text node with thousands separators, Inter 600 ${r(countSize(L.count, votes))}px, tracking ${TRACK.count}em, #111111, counting ${thousands(votes * T.countFrom)} → ${thousands(votes)} over frames ${f(3, T.count[0])}–${f(3, T.count[1])} on ${enter}. ${tall ? "Under a hairline divider" : "Right-aligned in the card"}: five ${L.avatar}px round avatars overlapping by 28% with 4px white rings spring in (fade, scale 0.6 → 1, ${T.avatarDur}f) from frame ${f(3, T.avatars)}, ${STAGGER}f apart, then a "+${compact(votes)}" chip (48px, black, white Geist Mono 22px) springs in at frame ${f(3, T.chip)}. Camera: scale 1 → ${T.push4} over the shot on travel.`,
      `Shot 5 (frames ${SHOTS[4]}–${end}): flat ${p.dark}. The bezel ring at radius ${R5}px centred where the digit was; its accent arc draws a full circle over frames ${f(4, T.ring5[0])}–${f(4, T.ring5[1])} on ${enter}. Inside, "${p.date}" in Geist Mono ${r(dateSize)}px, ${inkD}, rolls down into an overflow-hidden mask (translateY -110% → 0) over frames ${f(4, T.date5[0])}–${f(4, T.date5[1])} on ${travel}, the countdown's roll.`,
      `Above the ring (bottom edge ${outer5 + 48}px above centre): ${rowsText(cta.rows)} in Inter 600 ${r(cta.size)}px, tracking ${TRACK.cta}em, ${inkD}, word rise from local frame ${T.cta5}. Below the ring (${outer5 + 48}px below centre): a white pill ${L.urlH}px tall with a 14px accent dot and "${p.url}" in Inter 500 ${L.url}px #111111, springing in (fade, rise 24px) over frames ${f(4, T.url5[0])}–${f(4, T.url5[1])}. Bottom-left at a ${L.margin}px margin, the user's logo file at ${L.logo}px tall followed by "${p.brand}" in Inter 500 ${r(L.logo * 0.82)}px, ${inkD}, fading in over frames ${f(4, T.logo5[0])}–${f(4, T.logo5[1])}.`,
      marks,
      `Everything has landed by frame ${f(4, T.logo5[1])}; hold the live card perfectly still to the end (the last ${end - f(4, T.logo5[1])} frames, at least ${FINAL_HOLD}).`,
      `Ink: ${inkD} on ${p.dark}, ${inkP} on ${p.pop}, ${inkS} on ${p.stage}, ${inkW} on ${p.warm}.`,
    ].join("\n");
  },
});
