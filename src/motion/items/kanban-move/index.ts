import { EASE_OPTIONS, RADIUS, STROKE, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { CARD_H, CARD_W, COL_W, DOING, DONE, KanbanMove, MOVER, SCALE, T, TODO, isDark, type KanbanMoveProps } from "./KanbanMove";

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

export default defineMotion<KanbanMoveProps>({
  slug: "kanban-move",
  name: "Kanban Move",
  description: "A three-column task board where a cursor drags a card from In progress to Done, a drop placeholder opens, and the column counts roll.",
  category: "ui",
  tags: ["kanban", "board", "drag", "cursor", "productivity"],
  addedAt: "2026-10-22",
  durationInFrames: 150,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: KanbanMove,
  defaultProps: {
    ...palettes[0].values,
    board: "Sprint 24",
    col1: "To do",
    col2: "In progress",
    col3: "Done",
    task: "Ship the new pricing page",
    ease: "travel",
  } as KanbanMoveProps,
  palettes,
  controls: [
    { type: "text", key: "task", label: "Moving card", maxLength: 34 },
    { type: "text", key: "board", label: "Board", maxLength: 22 },
    { type: "text", key: "col1", label: "Column 1", maxLength: 14 },
    { type: "text", key: "col2", label: "Column 2", maxLength: 14 },
    { type: "text", key: "col3", label: "Column 3", maxLength: 14 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "select", key: "ease", label: "Drag easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const k = SCALE[ratio];
    const px = (n: number) => `${Math.round(n * k)}px`;
    const s = (f: number) => secs(f, c.fps);
    const dark = isDark(p.background);
    const list = (ts: { title: string; tag: string; id: string }[]) => ts.map((t) => `"${t.title}" (${t.tag}, ${t.id})`).join(", ");
    return [
      targetLine(c.target, `a kanban board where a cursor drags a card from "${p.col2}" to "${p.col3}" and the column counts roll`, c.width, c.height, c.seconds),
      `Canvas ${p.background}, flat. Sizes are px at 1080 on the short side. Inter 400/500 sentence case; Geist Mono for tags, ids and counts. No gradients or glows.`,
      `Header: "${p.board}" ${px(22)}/500 -0.03em ${p.ink}; "OCT 14 – OCT 28" mono ${px(11)} +0.12em ${p.ink3} on the right.`,
      ratio === "9:16"
        ? `Three stacked lanes (${px(752)} wide, ${px(164)} tall, ${px(14)} apart), each ${p.fill} with radius ${RADIUS.card}px; cards sit side by side in a row.`
        : `Three columns ${px(COL_W)} wide, ${px(14)} apart, each ${p.fill} with radius ${RADIUS.card}px; cards stack ${px(10)} apart with ${px(12)} padding.`,
      `Column headers: a ${px(14)} status glyph (open ring, half pie, filled tick; ${STROKE.hair}px), the name ${px(14)}/500 ${p.ink} ("${p.col1}", "${p.col2}", "${p.col3}") and a count chip (${p.card}, 1px ${p.line} ring, radius ${RADIUS.chip}px, mono ${px(12)} ${p.ink2}): 2, 3, 2.`,
      `Cards ${px(CARD_W)} × ${px(CARD_H)}, ${p.card}, 1px ${p.line} ring, radius ${RADIUS.button}px: title ${px(14.5)}/500 ${p.ink} (two lines max), then a mono tag chip (${p.fill}, ${p.ink2}), a mono id in ${p.ink3} and a ${px(22)} initial avatar on the right. ${p.col1}: ${list(TODO)}. ${p.col2}: "${p.task}" (${MOVER.tag}, ${MOVER.id}) on top, ${list(DOING)}. ${p.col3}: ${list(DONE)}.`,
      `${s(T.mv1A)}–${s(T.mv1B)}: an arrow cursor glides to "${p.task}" (travel ${bezierText("travel")}) and presses at ${s(T.grab)}. The card lifts over 12 frames on spring (${bezierText("spring")}): up ${px(4)}, scale 1.03, tilted 2°${dark ? "" : ", shadow 0 16px 36px rgba(0,0,0,.13)"}.`,
      `${s(T.dragA)}–${s(T.dragB)}: it travels in a slight arc to the top of "${p.col3}" (${p.ease}, ${bezierText(p.ease)}), the cursor holding it. From ${s(T.closeA)} the cards below it close the gap on spring (18 frames); from ${s(T.openA)} a drop placeholder opens at the top of "${p.col3}": dashed ${STROKE.hair}px ${p.accent} outline, ${p.accent} at 6% fill, scaling 0.94→1 as the cards below slide down one slot.`,
      `${s(T.drop)}: drop; tilt and lift settle on spring and the placeholder fades. Counts roll as digits: "${p.col2}" 3→2 at ${s(T.cnt1A)} (new digit from above), "${p.col3}" 2→3 at ${s(T.cnt2A)} (new digit from below), 8 frames on enter.`,
      `${s(T.backA)}–${s(T.backB)}: the card floats back to "${p.col2}" on travel with a slight lift, the gaps swap back on spring and the counts roll back. The last 12 frames hold still; the ${c.seconds}s loop is seamless.`,
    ].join("\n");
  },
});
