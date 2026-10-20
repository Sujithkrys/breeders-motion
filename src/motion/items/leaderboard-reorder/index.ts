import { EASE_OPTIONS, bezierText, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { LeaderboardReorder, parseBoard, ranksOf, type LeaderboardReorderProps } from "./LeaderboardReorder";

const palettes = [
  {
    name: "Gold",
    swatch: ["#0E0D12", "#4A4654", "#FFC53D"],
    values: { background: "#0E0D12", ink: "#F7F5EF", muted: "#8F8B98", track: "#24222B", bar: "#4A4654", accent: "#FFC53D", accentInk: "#1A1405", pos: "#4ADE80", neg: "#FB7185" },
  },
  {
    name: "Pine",
    swatch: ["#06110D", "#2B4A3E", "#34D399"],
    values: { background: "#06110D", ink: "#EAFBF3", muted: "#7F9C90", track: "#14261E", bar: "#2B4A3E", accent: "#34D399", accentInk: "#03170F", pos: "#A3E635", neg: "#FB923C" },
  },
  {
    name: "Sorbet",
    swatch: ["#FBF6F1", "#D3C4B5", "#F0503C"],
    values: { background: "#FBF6F1", ink: "#1D1714", muted: "#85796F", track: "#EDE4DA", bar: "#D3C4B5", accent: "#F0503C", accentInk: "#FFFFFF", pos: "#15945F", neg: "#D9452B" },
  },
  {
    name: "Violet",
    swatch: ["#0D0918", "#3B3260", "#C084FC"],
    values: { background: "#0D0918", ink: "#F2EDFF", muted: "#948BB0", track: "#1F1933", bar: "#3B3260", accent: "#C084FC", accentInk: "#1A0B33", pos: "#5EEAD4", neg: "#FDA4AF" },
  },
  {
    name: "Graphite",
    swatch: ["#0E0E10", "#3A3A40", "#F5F5F6"],
    values: { background: "#0E0E10", ink: "#F5F5F6", muted: "#8A8A92", track: "#1E1E22", bar: "#3A3A40", accent: "#F5F5F6", accentInk: "#0E0E10", pos: "#4ADE80", neg: "#F87171" },
  },
];

export default defineMotion<LeaderboardReorderProps>({
  slug: "leaderboard-reorder",
  name: "Leaderboard Reorder",
  description: "Five ranked bars animate to new values and glide into their new order, with rank-change chips.",
  category: "charts",
  tags: ["leaderboard", "ranking", "bars", "reorder", "data"],
  addedAt: "2026-10-19",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: LeaderboardReorder,
  defaultProps: {
    ...palettes[0].values,
    title: "Team leaderboard",
    names: "Atlas,Lumen,Orbit,Kestrel,Nova",
    from: "82,74,61,55,40",
    to: "71,96,58,83,64",
    stagger: 5,
    ease: "enter",
  } as LeaderboardReorderProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title", maxLength: 32 },
    { type: "text", key: "names", label: "Names (comma-separated)", maxLength: 100 },
    { type: "text", key: "from", label: "Start values", maxLength: 60 },
    { type: "text", key: "to", label: "End values", maxLength: 60 },
    { type: "color", key: "accent", label: "Leader" },
    { type: "number", key: "stagger", label: "Intro stagger", min: 2, max: 8, step: 1, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const { rows } = parseBoard(p.names, p.from, p.to);
    const rf = ranksOf(rows.map((r) => r.from));
    const rt = ranksOf(rows.map((r) => r.to));
    const endOrder = rows.map((r, i) => ({ r, i })).sort((a, b) => rt[a.i] - rt[b.i]);
    return [
      targetLine(c.target, `a ${rows.length}-row leaderboard whose bars grow to new values and reorder smoothly`, c.width, c.height, c.seconds),
      `Background ${p.background}. Font Geist; numbers in Geist Mono with tabular figures. Text ${p.ink}, secondary ${p.muted}.`,
      `Rows (comma-separated props): ${rows.map((r) => `${r.name} ${r.from} → ${r.to}`).join(", ")}. Final order: ${endOrder.map((o) => o.r.name).join(", ")}.`,
      "",
      `Header: mono uppercase "TOP ${rows.length} · RANKED" (20px, 0.14em) over the title "${p.title}" (68px, weight 650, -0.04em). Block 1240px wide, centred.`,
      `Left column: static 56px rank circles 1–${rows.length}; #1 is ${p.accent} with ${p.accentInk} text, the rest ${p.track} with ${p.muted} text. Rows are 120px tall.`,
      `Each row: name 30px (weight 650 when leading), a 40px bar (radius 12) on a ${p.track} track, gradient ${p.bar}; values in 26px mono after the bar end. One shared scale = the largest start or end value.`,
      `The row in the #1 slot cross-fades its bar to ${p.accent} with a soft glow, so the highlight follows whoever is moving into first.`,
      "",
      `0.27s on: rows slide in 40px from the right and bars grow to their start values, ${p.stagger} frames apart.`,
      `2.4s → 4s: values interpolate to the end values while each row's y moves from its old rank to its new one, ease ${p.ease} ${bezierText(p.ease)}. Climbing rows sit on top and scale up 2% mid-move.`,
      `At 4s, rank-change chips pop in at the right: ▲ in ${p.pos} for climbers, ▼ in ${p.neg} for fallers (${rows.map((r, i) => `${r.name} ${rf[i] - rt[i] > 0 ? "+" : ""}${rf[i] - rt[i]}`).join(", ")}). Hold for the last 2s.`,
    ].join("\n");
  },
});
