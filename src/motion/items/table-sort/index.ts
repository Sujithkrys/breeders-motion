import { EASE_OPTIONS, RADIUS, STROKE, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { CH, CW, HEAD_H, HILITE, MOVE, ROWS, ROW_H, SCALE, SORTS, T, TableSort, isDark, maxStagger, money, type TableSortProps } from "./TableSort";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  fill: t.fill,
  line: t.line,
  ink: t.ink,
  ink2: t.ink2,
  ink3: t.ink3,
  accent: t.accent,
}));

export default defineMotion<TableSortProps>({
  slug: "table-sort",
  name: "Data Table Sort",
  description: "A clean accounts table where a cursor clicks the MRR header and the rows slide into ascending, then descending order on springs.",
  category: "charts",
  tags: ["table", "sort", "data", "rows", "cursor"],
  addedAt: "2026-10-22",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: TableSort,
  defaultProps: {
    ...palettes[0].values,
    title: "Top accounts",
    stagger: 3,
    ease: "spring",
  } as TableSortProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title", maxLength: 24 },
    { type: "number", key: "stagger", label: "Row stagger", min: 0, max: 4, step: 1, unit: "f" },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Canvas" },
    { type: "select", key: "ease", label: "Row easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const k = SCALE[ratio];
    const px = (n: number) => `${Math.round(n * k)}px`;
    const s = (f: number) => secs(f, c.fps);
    const dark = isDark(p.background);
    const st = maxStagger(p.stagger);
    return [
      targetLine(c.target, `a data table card where a cursor clicks the MRR header and the rows slide into sorted order, ascending then descending`, c.width, c.height, c.seconds),
      `Canvas ${p.background}. Sizes are px at 1080 on the short side. Inter for text, Geist Mono for the tiny column headers. No gradients or glows.`,
      `Card ${px(CW)} × ${px(CH)}, ${p.card}, 1px ${p.line} border, radius ${RADIUS.card}px${dark ? ", no shadow" : ", shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)"}. Title "${p.title}" ${px(20)}/500, -0.02em, ${p.ink}; a mono "${ROWS.length} ROWS" label right-aligned in ${p.ink3}.`,
      `Header row ${px(HEAD_H)} tall: NAME, PLAN, SEATS (right-aligned), MRR (right-aligned), Geist Mono ${px(11)}, +0.1em, ${p.ink3}, with a 1px ${p.line} rule under it.`,
      `${ROWS.length} rows, ${px(ROW_H)} tall, 1px ${p.line} rule on top of each: a ${px(30)} ${p.fill} circle with ${p.ink2} initials, the name ${px(15)}/500 ${p.ink}; the plan as a ${px(26)} ${p.fill} chip (radius ${RADIUS.chip}px, ${px(13)}/500 ${p.ink2}); seats ${px(15)} ${p.ink2}; MRR ${px(15)}/500. Each number is one text node. Data: ${ROWS.map((r) => `${r.name} · ${r.plan} · ${r.seats} · ${money(r.mrr)}`).join("; ")}.`,
      `An arrow cursor (30px, ${p.ink}, ${p.card} outline) glides to the MRR header ${s(T.inA)}–${s(T.inB)} and clicks it three times: ${SORTS.map((x) => `${s(x.click)} ${x.label}`).join(", ")} (cursor scales to 0.88 on each).`,
      `Sort arrow: a ${px(12)} ${p.accent} up-arrow (${STROKE.ring}px stroke) left of "MRR" fades in and rises on the first click, rotates 180° over 14 frames on the second (${bezierText("travel")}), fades out on the third. While sorted, the MRR header and MRR cells go from ${p.ink3}/${p.ink2} to ${p.ink}.`,
      `On each click every row slides from its old slot to its new one over ${MOVE} frames (${p.ease} ${bezierText(p.ease)}), staggered ${st} frames by new position. Rows are opaque, and moving rows draw on top.`,
      `Rows that change slot highlight briefly: a ${p.accent} tint at ${dark ? 16 : 8}% (radius ${RADIUS.button}px, inset ${px(6)}) fades in over ${HILITE.inEnd} frames and out between +${HILITE.outA} and +${HILITE.outB}.`,
      `After the third click the table is back in its original order and the cursor glides home by ${s(T.homeB)}. Hold the last 12 frames; the ${c.seconds}s loop is seamless.`,
    ].join("\n");
  },
});
