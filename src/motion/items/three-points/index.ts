import { CURSOR_COLORS, FILM, SAMPLE } from "../../film";
import { ACCENT, FINAL_HOLD, RADIUS, STAGGER, bezierText, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import {
  HIGHLIGHT_DEFAULT,
  LIFT,
  LINE_H,
  MARGIN,
  PAD,
  POINT_LINE_H,
  RISE,
  SHOTS,
  SIZE,
  T,
  TARGET,
  TRACK,
  ThreePoints,
  approachFor,
  cardRects,
  fitRows,
  highlightIndex,
  textOn,
  type ThreePointsProps,
} from "./ThreePoints";

// Each colourway sets the title field, the three cards and the end card together.
const looks: { name: string; field: string; c1: string; c2: string; c3: string; end: string }[] = [
  { name: "Lime", field: FILM.lime, c1: FILM.lavender, c2: FILM.green, c3: ACCENT.blue, end: FILM.black },
  { name: "Cream", field: FILM.cream, c1: FILM.lime, c2: FILM.plum, c3: FILM.orange, end: FILM.black },
  { name: "Lavender", field: FILM.lavender, c1: FILM.white, c2: FILM.black, c3: FILM.lime, end: FILM.green },
  { name: "Black", field: FILM.black, c1: FILM.lavender, c2: FILM.lime, c3: FILM.orange, end: FILM.white },
];
const palettes = looks.map(({ name, ...v }) => ({ name, swatch: [v.field, v.c1, v.c2, v.c3], values: v }));

export default defineMotion<ThreePointsProps>({
  slug: "three-points",
  name: "Three Points",
  description: "A big title on a flat lime field, three flat colour cards carrying your points, a cursor lifts one, then your logo.",
  category: "templates",
  tags: ["feature list", "launch", "figma", "cards"],
  addedAt: "2026-10-21",
  durationInFrames: 240,
  fps: 30,
  ratios: ["16:9", "9:16"],
  component: ThreePoints,
  defaultProps: {
    ...palettes[0].values,
    title: "Three things that changed",
    point1: "Plan in one place",
    point2: "Focus, defended",
    point3: "Works everywhere",
    brand: SAMPLE.brand,
    logo: SAMPLE.logo,
    cursorName: "Maya",
    showCursor: true,
    highlight: HIGHLIGHT_DEFAULT,
  } as ThreePointsProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title", maxLength: 40 },
    { type: "text", key: "point1", label: "Point 1", maxLength: 28 },
    { type: "text", key: "point2", label: "Point 2", maxLength: 28 },
    { type: "text", key: "point3", label: "Point 3", maxLength: 28 },
    {
      type: "select",
      key: "highlight",
      label: "Card that lifts",
      options: [
        { label: "First", value: "1" },
        { label: "Second", value: "2" },
        { label: "Third", value: "3" },
      ],
    },
    { type: "toggle", key: "showCursor", label: "Cursor" },
    { type: "text", key: "brand", label: "Brand name", maxLength: 16 },
    { type: "image", key: "logo", label: "Logo", hint: "PNG or SVG, transparent" },
    { type: "color", key: "field", label: "Field" },
    { type: "color", key: "c1", label: "Card 1" },
    { type: "color", key: "c2", label: "Card 2" },
    { type: "color", key: "c3", label: "Card 3" },
  ],
  prompt: (p, c) => {
    const tall = c.height > c.width;
    const L = tall ? SIZE.tall : SIZE.wide;
    const u = Math.min(c.width, c.height) / 1080;
    const W = c.width / u;
    const H = c.height / u;
    const end = c.seconds * c.fps;
    const ink = textOn(p.field);
    const enter = `enter, ${bezierText("enter")}`;
    const spring = bezierText("spring");
    const f = (shot: number, local: number) => SHOTS[shot] + local;
    const t1 = fitRows(p.title, Math.min(L.titleMaxW, W - 2 * MARGIN), L.title, L.titleLines);
    const t2 = fitRows(p.title, W - 2 * MARGIN, L.small, L.smallLines);
    const rowsText = (r: string[][]) => r.map((x) => `"${x.join(" ")}"`).join(" / ");
    const rects = cardRects(W, H, tall);
    const r0 = rects[0];
    const cw = Math.round(r0.w);
    const cards = [
      { c: p.c1, t: p.point1 },
      { c: p.c2, t: p.point2 },
      { c: p.c3, t: p.point3 },
    ]
      .map((k, i) => `card ${i + 1} ${k.c} with "${k.t}" in ${textOn(k.c)}`)
      .join("; ");
    const tg = tall ? TARGET.tall : TARGET.wide;
    const hi = highlightIndex(p.highlight);
    const n = hi + 1;
    const others = [1, 2, 3].filter((k) => k !== n).join(" and ");
    const from = { "bottom-left": "off-frame bottom-left", "bottom-right": "off-frame bottom-right", right: "off-frame right, a little below the card" }[approachFor(hi, tall)];
    return [
      targetLine(c.target, `a three-shot feature-list film in the style of Figma's flat-block launch films: a big title, three flat colour cards carrying three points, ${p.showCursor ? "a cursor lifts one" : "one lifts"}, the logo`, c.width, c.height, c.seconds),
      `Hard cuts at frames ${SHOTS.join(", ")} (no transitions). Flat colour fields only: no gradients, glows, borders or text shadows. Inter only, sentence case. Sizes are px at 1080 on the short side.`,
      `Shot 1 (frames ${SHOTS[0]}–${SHOTS[1]}): flat ${p.field}. ${rowsText(t1.rows)} as balanced rows in ${ink}, Inter 500 ${Math.round(t1.size)}px, tracking ${TRACK.title}em, line height ${LINE_H}, top-left at x ${MARGIN}px, y ${L.top}px. Each row sits in its own overflow-hidden mask; every word rises from translateY(115%) to 0 over ${T.wordDur} frames on ${enter}, starting ${T.wordStart} frames after the cut, ${STAGGER} frames apart (capped at ${T.maxStagger} steps).`,
      `Shot 2 (frames ${SHOTS[1]}–${SHOTS[2]}): the same ${p.field} field. Hard cut to the new layout (no animated shrink): the title is now static and small at the same top-left spot, ${rowsText(t2.rows)}, Inter 500 ${Math.round(t2.size)}px, tracking ${TRACK.small}em, ${ink}.`,
      tall
        ? `Three flat cards stacked vertically, each ${cw}×${L.cardH}px, gap ${L.gap}px, ${MARGIN}px side margins, the stack's bottom ${L.bottom}px above the frame's bottom edge; radius ${RADIUS.card}px, no border or shadow.`
        : `Three flat cards in a row, each ${cw}×${L.cardH}px, gap ${L.gap}px, the row spanning the frame between ${MARGIN}px margins (aligned to the title), its bottom ${L.bottom}px above the frame's bottom edge; radius ${RADIUS.card}px, no border or shadow.`,
      `Colours and text: ${cards}. Each point sits bottom-left at ${PAD}px padding, Inter 500 ${L.point}px, tracking ${TRACK.point}em, line height ${POINT_LINE_H}, wrapping inside the card; text colour is black on light cards and white on dark ones (by luminance).`,
      `Cards enter from frame ${f(1, T.cardStart)}, ${T.cardStagger} frames apart: each rises ${RISE}px over ${T.cardDur} frames on ${spring} and fades 0→1 over ${T.cardFade} frames on ${enter}.`,
      p.showCursor
        ? `A Figma multiplayer cursor (arrow in ${CURSOR_COLORS.pink} with a 1.6px white outline, ${Math.round(30 * L.cursor)}px tall, name tag "${p.cursorName}" in white Inter 500 on a ${CURSOR_COLORS.pink} pill) glides in from ${from} along a slight arc, frames ${f(1, T.glide[0])}–${f(1, T.glide[1])} on travel, ${bezierText("travel")}, landing on card ${n} at ${Math.round(tg[0] * 100)}% across and ${Math.round(tg[1] * 100)}% down; it clicks at frame ${f(1, T.click)} (scale dips 10% and returns over 8 frames).`
        : `No cursor is shown: nothing else moves until card ${n} lifts on its own.`,
      `Frames ${f(1, T.lift[0])}–${f(1, T.lift[1])} on ${spring}: card ${n} lifts (${tall ? `slides right ${LIFT.slide}px` : `translateY -${LIFT.up}px`} and scales 1→${LIFT.scale}) while a soft shadow fades in (0 2px 4px rgba(0,0,0,.06), 0 24px 48px rgba(0,0,0,.16)), drawn above its neighbours; cards ${others} dim to ${LIFT.dim} opacity${p.showCursor ? `; the cursor rides with card ${n}` : ""}. Hold until the cut.`,
      `Shot 3 (frames ${SHOTS[2]}–${end}): flat ${p.end}. The user's logo file at ${L.logo}px tall followed by "${p.brand}" in Inter 500 ${Math.round(L.logo * 0.82)}px, tracking -0.02em, ${textOn(p.end)}, gap ${Math.round(L.logo * 0.32)}px, centred. It fades 0→1 and scales 0.96→1 over ${T.logoDur} frames from frame ${f(2, T.logoStart)} on ${enter}.`,
      `Hold the logo card still to the end; the last ${FINAL_HOLD} frames (${end - FINAL_HOLD}–${end}) are perfectly still.`,
    ].join("\n");
  },
});
