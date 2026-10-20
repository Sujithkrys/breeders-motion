import { EASE_OPTIONS, alpha, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import {
  CARD,
  IntegrationsTimeline,
  ROW_AT,
  TIMING,
  TINTS,
  TINT_ALPHA,
  isDark,
  layoutFor,
  lettersOf,
  timing,
  type IntegrationsTimelineProps,
} from "./IntegrationsTimeline";

const palettes = [
  { name: "Ink", swatch: ["#0E0F12", "#FFFFFF", "#FF5A1F"], values: { background: "#0E0F12", card: "#FFFFFF", border: "#FFFFFF", accent: "#FF5A1F" } },
  { name: "White", swatch: ["#FFFFFF", "#0E0F12", "#0067FC"], values: { background: "#FFFFFF", card: "#FFFFFF", border: "#0E0F12", accent: "#0067FC" } },
  { name: "Deep green", swatch: ["#0C5A2F", "#FFFFFF"], values: { background: "#0C5A2F", card: "#FFFFFF", border: "#FFFFFF", accent: "#0C5A2F" } },
  { name: "Paper", swatch: ["#FAFAF8", "#E8E8EC", "#FF5A1F"], values: { background: "#FAFAF8", card: "#FFFFFF", border: "#E8E8EC", accent: "#FF5A1F" } },
];

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
    ease: "enter",
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
    { type: "text", key: "time4", label: "Time 4", maxLength: 5 },
    { type: "text", key: "label4", label: "Row 4", maxLength: 18 },
    { type: "color", key: "background", label: "Canvas" },
    { type: "color", key: "card", label: "Card" },
    { type: "color", key: "accent", label: "Accent" },
    { type: "number", key: "stagger", label: "Stagger", min: 4, max: 10, step: 1, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const L = layoutFor(c.width, c.height);
    const u = L.u;
    const px = (n: number) => `${r0(n / u)}px`;
    const k = L.k;
    const tm = timing(p.stagger);
    const darkCanvas = isDark(p.background);
    const darkCard = isDark(p.card);
    const ink = darkCard ? "#FFFFFF" : "#0E0F12";
    const exitAt = TIMING.exitAt;
    const letters = lettersOf(p.tiles);
    const f = (n: number) => secs(n, c.fps);
    const rowFrames = ROW_AT.map((a) => tm.arriveAt(a) + 2);
    const sides = L.vertical ? ["top", "bottom"] : ["left", "right"];
    const tilePos = L.vertical
      ? `three in a row above the card and three below, centres ${px(L.tileOffset)} from the card centre, ${px(L.tileGap)} apart`
      : `three in a column on each side, centres ±${px(L.tileOffset)} from the card centre, ${px(L.tileGap)} apart vertically`;
    return [
      targetLine(c.target, `six tool tiles wired by hairline connectors into a "${p.heading}" schedule card that fills row by row`, c.width, c.height, c.seconds),
      `Canvas ${p.background} with a 64px grid of 1px lines in ${darkCanvas ? "white at 5%" : "#0E0F12 at 4.5%"}, faded at top and bottom with a linear mask. Font Geist; times and the counter in Geist Mono. No glows, no gradients.`,
      `Title "${p.title}" centred ${px(L.titleTop)} from the top: Geist 500, ${px(L.titleSize)}, -0.04em tracking, ${darkCanvas ? "#FFFFFF" : "#0E0F12"}. Subline "${p.subline}" ${px(L.subGap)} below: Geist 400, ${px(L.subSize)}, ${darkCanvas ? "white at 55%" : "#7B7E87"}.`,
      `Card: ${px(L.cardW)}×${px(L.cardH)}, centre at (${px(L.cx)}, ${px(L.cy)}), radius ${r0(CARD.radius * k)}px, fill ${p.card}, 1.5px ${p.border} border, ${darkCanvas ? "shadow 0 30px 70px rgba(0,0,0,.45)" : "shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)"}, padding ${r0(CARD.pad * k)}px. Header: a ${r0(30 * k)}px ${p.accent} clock mark, "${p.heading}" Geist 600 ${r0(30 * k)}px ${ink}, and a right-aligned mono ${r0(20 * k)}px counter "n/6 synced".`,
      `Four rows, ${r0(CARD.row * k)}px tall with ${r0(CARD.rowGap * k)}px gaps: a right-aligned mono ${r0(CARD.time * k)}px time in a ${r0(CARD.timeCol * k)}px column, then a pill (radius ${r0(14 * k)}px) with a Geist 600 ${r0(CARD.label * k)}px label: ${[p.time1, p.time2, p.time3, p.time4].map((t, i) => `${t} "${[p.label1, p.label2, p.label3, p.label4][i]}" on ${TINTS[i]} at ${r0(TINT_ALPHA * 100)}%`).join(", ")}. Empty rows show a ${ink} 4% placeholder and the time at 40%.`,
      `Tiles: six ${px(L.tileSize)} squares, radius ${r0((L.tileSize / u) * 0.26)}px, fill ${p.card}, 1.5px ${p.border} border, letters ${letters.map((l) => `"${l}"`).join(" ")} in Geist 600 ${r0((L.tileSize / u) * 0.4)}px ${ink}; ${tilePos}.`,
      `Connectors: 1.5px ${darkCanvas ? "white at 30%" : alpha("#0E0F12", 0.22)} lines from each tile's inner edge to a spine ${px(L.spineGap)} off the card, ${px(L.corner)} rounded corners, merging into one 6.5px port dot on the card's ${sides[0]} and ${sides[1]} edges (the port fills ${p.accent} on first arrival).`,
      "",
      `Tiles drop in alternating sides (${sides[0]} 1, ${sides[1]} 1, ${sides[0]} 2, …) every ${p.stagger} frames from frame ${TIMING.first}: 28px drop, scale 0.94 → 1 and fade over ${TIMING.drop} frames, ease ${p.ease} ${bezierText(p.ease)}.`,
      `Each line starts ${TIMING.lineDelay} frames after its tile and draws in ${TIMING.draw} frames (ease soft ${bezierText("travel")}) with a 5px ${p.accent} dot at its tip; on arrival a ${p.accent} ring grows from 7 to 26px and fades out of the port, and the counter ticks.`,
      `Rows fill on the 1st, 3rd, 4th and 6th arrivals (${rowFrames.map(f).join(", ")}): the tint wipes in left to right over ${TIMING.fill} frames, the label slides in 10px and fades up, the time brightens.`,
      `Hold until ${r0(exitAt * 100)}% of the loop, then everything fades out (soft) back to the title and the empty card, so the ${c.seconds}s loop is seamless.`,
    ].join("\n");
  },
});
