import { EASE_OPTIONS, RADIUS, STAGGER, STROKE, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import {
  ACTIVE_ROW,
  ACTIVE_TINT,
  CARD,
  IntegrationsTimeline,
  LINE_ALPHA,
  ROW_AT,
  TIMING,
  isDark,
  layoutFor,
  lettersOf,
  timing,
  type IntegrationsTimelineProps,
} from "./IntegrationsTimeline";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  line: t.line,
  fill: t.fill,
  ink: t.ink,
  ink2: t.ink2,
  ink3: t.ink3,
  accent: t.accent,
}));

const r0 = (n: number) => Math.round(n);

export default defineMotion<IntegrationsTimelineProps>({
  slug: "integrations-timeline",
  name: "Integrations Timeline",
  description: "Six tool tiles drop in and hairline connectors draw into a Today card, filling its schedule row by row.",
  category: "ui",
  tags: ["integrations", "calendar", "connectors", "schedule", "saas"],
  addedAt: "2026-10-20",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: IntegrationsTimeline,
  defaultProps: {
    title: "Every tool, one timeline",
    subline: "Tempo connects to the tools you already live in.",
    heading: "Today",
    tiles: "MCVNTD",
    time1: "9:00",
    label1: "Deep work",
    time2: "11:00",
    label2: "Design sync",
    time3: "13:00",
    label3: "Lunch",
    time4: "14:00",
    label4: "Focus · launch",
    ...palettes[0].values,
    stagger: 8,
    ease: "spring",
  } as IntegrationsTimelineProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title", maxLength: 36 },
    { type: "text", key: "subline", label: "Subline", maxLength: 64 },
    { type: "text", key: "heading", label: "Card heading", maxLength: 14 },
    { type: "text", key: "tiles", label: "Tile letters (6)", maxLength: 6 },
    { type: "text", key: "time1", label: "Time 1", maxLength: 5 },
    { type: "text", key: "label1", label: "Row 1", maxLength: 18 },
    { type: "text", key: "time2", label: "Time 2", maxLength: 5 },
    { type: "text", key: "label2", label: "Row 2", maxLength: 18 },
    { type: "text", key: "time3", label: "Time 3", maxLength: 5 },
    { type: "text", key: "label3", label: "Row 3", maxLength: 18 },
    { type: "text", key: "time4", label: "Time 4 (now)", maxLength: 5 },
    { type: "text", key: "label4", label: "Row 4 (now)", maxLength: 18 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "stagger", label: "Connector stagger", min: 4, max: 10, step: 1, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const L = layoutFor(c.width, c.height);
    const u = L.u;
    const px = (n: number) => `${r0(n / u)}px`;
    const k = L.k;
    const dur = Math.round(c.seconds * c.fps);
    const tm = timing(p.stagger, dur);
    const shadow = isDark(p.background) ? "no shadow" : "shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)";
    const letters = lettersOf(p.tiles);
    const rowFrames = ROW_AT.map((a) => tm.arriveAt(a) + 2);
    const times = [p.time1, p.time2, p.time3, p.time4];
    const labels = [p.label1, p.label2, p.label3, p.label4];
    const sides = L.vertical ? ["top", "bottom"] : ["left", "right"];
    const tilePos = L.vertical
      ? `three in a row above the card and three below, centres ${px(L.tileOffset)} from the card centre, ${px(L.tileGap)} apart`
      : `three in a column on each side, centres ±${px(L.tileOffset)} from the card centre, ${px(L.tileGap)} apart vertically`;
    return [
      targetLine(c.target, `six tool tiles wired by hairline connectors into a "${p.heading}" schedule card that fills row by row`, c.width, c.height, c.seconds),
      `Background: flat ${p.background}, no grid, texture or gradient. Sizes are px at 1080 on the short side.`,
      `Type: Inter; Geist Mono with tabular figures for times and the counter. Title "${p.title}" centred ${px(L.titleTop)} from the top: ${px(L.titleSize)}, weight 400, -0.04em, ${p.ink}. Subline "${p.subline}" ${px(L.subGap)} below: ${px(L.subSize)}, weight 400, ${p.ink2}. Card heading "${p.heading}" ${r0(30 * k)}px/500 ${p.ink}; counter "n/6 synced" mono ${r0(20 * k)}px ${p.ink3}; row labels ${r0(CARD.label * k)}px/500 ${p.ink}; times mono ${r0(CARD.time * k)}px, ${p.ink3} brightening to ${p.ink2} when the row fills.`,
      `Card: ${px(L.cardW)}×${px(L.cardH)}, centre (${px(L.cx)}, ${px(L.cy)}), radius ${RADIUS.card}px, fill ${p.card}, 1px ${p.line} border, ${shadow}, padding ${r0(CARD.pad * k)}px. Header: a ${r0(30 * k)}px ${p.accent} clock mark, the heading, the counter right-aligned.`,
      `Four rows, ${r0(CARD.row * k)}px tall with ${r0(CARD.rowGap * k)}px gaps: a right-aligned time in a ${r0(CARD.timeCol * k)}px column, then a pill (radius ${RADIUS.button}px, 1px ${p.line} border) holding the label: ${times.map((t, i) => `${t} "${labels[i]}"`).join(", ")}. Filled pills are neutral ${p.fill}; only the "now" row (${times[ACTIVE_ROW]}) is ${p.accent} at ${r0(ACTIVE_TINT * 100)}%.`,
      `Tiles: six ${px(L.tileSize)} squares, radius ${RADIUS.card}px, fill ${p.card}, 1px ${p.line} border, same shadow, letters ${letters.map((l) => `"${l}"`).join(" ")} in Inter 500 ${r0((L.tileSize / u) * 0.4)}px ${p.ink}; ${tilePos}.`,
      `Connectors: ${STROKE.hair}px lines in ${p.ink} at ${r0(LINE_ALPHA * 100)}% from each tile's inner edge to a spine ${px(L.spineGap)} off the card, ${px(L.corner)} rounded corners, merging into a 6.5px port on the card's ${sides[0]} and ${sides[1]} edges (${p.card} fill, ${STROKE.hair}px ${p.ink} 30% ring; a 3.5px ${p.accent} dot lights on first arrival).`,
      "",
      `Frame ${TIMING.first}–${tm.tileAt(5) + TIMING.drop}: tiles drop in alternating sides (${sides[0]} 1, ${sides[1]} 1, ${sides[0]} 2, …) ${STAGGER} frames apart: 28px drop, scale 0.94 → 1 and fade over ${TIMING.drop} frames, ${p.ease} ${bezierText(p.ease)}.`,
      `From frame ${TIMING.lineFirst}, ${p.stagger} frames apart in the same order: each line draws in ${TIMING.draw} frames (travel ${bezierText("travel")}) with a 5px ${p.accent} dot at its tip; on arrival a ${STROKE.ring}px ${p.accent} ring grows from 7 to 26px and fades out of the port over ${TIMING.ripple} frames (enter), and the counter ticks.`,
      `Rows fill on the 1st, 3rd, 4th and 6th arrivals (frames ${rowFrames.join(", ")}): the pill colour wipes in left to right over ${TIMING.fill} frames (${p.ease}), the label slides in 10px and fades up.`,
      `Frame ${tm.exitAt}–${tm.exitAt + TIMING.exit}: tiles, lines, row fills, labels and the counter fade out on exit ${bezierText("exit")}, back to the title and the empty card. Frames ${tm.exitAt + TIMING.exit}–${dur} are still and match frame 0, so the ${c.seconds}s loop is seamless.`,
    ].join("\n");
  },
});
