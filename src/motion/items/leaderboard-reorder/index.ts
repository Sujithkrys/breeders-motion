import { EASE_OPTIONS, RADIUS, STAGGER, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { BAR_GREY, LB, LeaderboardReorder, boardLayout, introStagger, isDarkHex, mixHex, parseBoard, ranksOf, type LeaderboardReorderProps } from "./LeaderboardReorder";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  line: t.line,
  fill: t.fill,
  ink: t.ink,
  ink2: t.ink2,
  ink3: t.ink3,
  accent: t.accent,
  onAccent: t.onAccent,
  success: t.success,
  error: t.error,
}));

const r0 = (n: number) => Math.round(n);
const r1 = (n: number) => Math.round(n * 10) / 10;

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
    stagger: STAGGER,
    ease: "travel",
  } as LeaderboardReorderProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title", maxLength: 32 },
    { type: "text", key: "names", label: "Names (comma-separated)", maxLength: 100 },
    { type: "text", key: "from", label: "Start values", maxLength: 60 },
    { type: "text", key: "to", label: "End values", maxLength: 60 },
    { type: "color", key: "accent", label: "Leader" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "stagger", label: "Intro stagger", min: 2, max: 6, step: 1, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const { rows } = parseBoard(p.names, p.from, p.to);
    const n = rows.length;
    const rf = ranksOf(rows.map((r) => r.from));
    const rt = ranksOf(rows.map((r) => r.to));
    const endOrder = rows.map((r, i) => ({ r, i })).sort((a, b) => rt[a.i] - rt[b.i]);
    const L = boardLayout(c.width, c.height, n);
    const px = (v: number) => `${r0(v / L.u)}px`;
    const st = r1(introStagger(p.stagger, n));
    const chipA = LB.T1 - LB.chipLead;
    const shadow = isDarkHex(p.background) ? "no shadow" : "shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)";
    return [
      targetLine(c.target, `a ${n}-row leaderboard card whose bars grow to new values and reorder smoothly`, c.width, c.height, c.seconds),
      `Background: flat ${p.background}. Sizes are px at 1080 on the short side.`,
      `Type: Inter; Geist Mono with tabular figures for the label, ranks, values and chips. Mono label "TOP ${n} · RANKED" 18px, +0.12em, uppercase, ${p.ink3}. Title "${p.title}" ${L.wide ? 48 : 44}px, weight 400, -0.035em, ${p.ink}. Names ${L.vertical ? 30 : 28}px ${p.ink}, weight 500 for the leader and 400 for the rest. Values 24px mono: the leader's in ${p.ink} at 600, the rest ${p.ink2} at 500.`,
      `Card: ${px(L.cardW)}×${px(L.cardH)}, centred, fill ${p.card}, 1px ${p.line} border, radius ${RADIUS.card}px, ${shadow}, padding ${px(L.pad)}. Rows are ${px(L.rowH)} tall.`,
      `Left column: static ${px(L.badge)} rank circles 1–${n} in mono 20px/500; #1 is ${p.accent} with ${p.onAccent} text, the rest ${p.fill} with ${p.ink2} text.`,
      `Each row: name, then a ${px(L.barH)} bar with radius ${RADIUS.chip}px on a ${p.fill} track${L.vertical ? " below the name" : ""}, one shared scale (the largest start or end value). Bars are solid grey ${mixHex(p.fill, p.ink3, BAR_GREY)}; the row in the #1 slot cross-fades its bar to solid ${p.accent}, so the accent follows whoever moves into first. No gradients, no glow.`,
      `Rank-change chips (pill, mono 18px/500, small triangle): climbers ${p.success} on ${p.success} at 12%, fallers ${p.error} on ${p.error} at 12%. ${rows.map((r, i) => `${r.name} ${rf[i] - rt[i] > 0 ? "+" : ""}${rf[i] - rt[i]}`).join(", ")}.`,
      `Rows: ${rows.map((r) => `${r.name} ${r.from} → ${r.to}`).join(", ")}. Final order: ${endOrder.map((o) => o.r.name).join(", ")}.`,
      "",
      `Frame 0–${LB.cardIn}: the card fades in and rises 24px; frame ${LB.headA}–${LB.headB}: the header fades up 16px. Ease enter ${bezierText("enter")}.`,
      `From frame ${LB.slotA}, ${st} frames apart: rank circles fade and scale 0.8 → 1 over ${LB.slotIn} frames; rows slide in 40px from the right and fade over ${LB.rowIn} frames while bars grow to their start values (enter).`,
      `Frame ${LB.T0}–${LB.T1}: values interpolate to the end values while each row's y travels from its old rank to its new one, ${p.ease} ${bezierText(p.ease)}. Climbing rows sit on top and scale up 2% mid-move.`,
      `Frame ${chipA}–${chipA + LB.chipIn}: chips fade and scale 0.8 → 1 (enter). Still from frame ${chipA + LB.chipIn} to the end.`,
    ].join("\n");
  },
});
