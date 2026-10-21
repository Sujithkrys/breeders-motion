import { EASE_OPTIONS, RADIUS, STROKE, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { CH, CW, DAYS, HEAD_H, ROLES, ROW_H, SCALE, SortableList, T, crossFrame, initials, isDark, type SortableListProps } from "./SortableList";

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

export default defineMotion<SortableListProps>({
  slug: "sortable-list",
  name: "Sortable List",
  description: "A team list where a cursor grabs the fourth row by its handle, lifts it and drags it to the top while the other rows slide down one by one.",
  category: "ui",
  tags: ["drag", "reorder", "list", "cursor", "team"],
  addedAt: "2026-10-22",
  durationInFrames: 150,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: SortableList,
  defaultProps: {
    ...palettes[0].values,
    title: "On-call rotation",
    name1: "Maya Chen",
    name2: "Leo Martins",
    name3: "Ava Okafor",
    name4: "Noah Fischer",
    name5: "Iris Novak",
    ease: "travel",
  } as SortableListProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title", maxLength: 24 },
    { type: "text", key: "name1", label: "Name 1", maxLength: 20 },
    { type: "text", key: "name2", label: "Name 2", maxLength: 20 },
    { type: "text", key: "name3", label: "Name 3", maxLength: 20 },
    { type: "text", key: "name4", label: "Name 4 (dragged)", maxLength: 20 },
    { type: "text", key: "name5", label: "Name 5", maxLength: 20 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "select", key: "ease", label: "Drag easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const k = SCALE[ratio];
    const px = (n: number) => `${Math.round(n * k)}px`;
    const s = (f: number) => secs(f, c.fps);
    const dark = isDark(p.background);
    const names = [p.name1, p.name2, p.name3, p.name4, p.name5];
    return [
      targetLine(c.target, `a team list card where a cursor drags the fourth row to the top and the other rows slide down to make room`, c.width, c.height, c.seconds),
      `Canvas ${p.background}, flat. Sizes are px at 1080 on the short side. Inter 400/500 sentence case; Geist Mono only for tiny caps labels (+0.12em). No gradients or glows.`,
      `Card ${px(CW)} × ${px(CH)} centred, ${p.card}, 1px ${p.line} border, radius ${RADIUS.card}px${dark ? ", no shadow" : ", shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)"}. Header ${px(HEAD_H)} tall: "${p.title}" ${px(20)}/500 -0.025em ${p.ink}, "Drag to set the order" ${px(13)} ${p.ink3}; "WEEK 43" mono ${px(11)} ${p.ink3} on the right; a 1px ${p.line} divider below.`,
      `Five ${px(ROW_H)} rows with 1px ${p.line} dividers: a 2×3 dot grip (${p.ink3}), a ${px(38)} round monogram (${p.fill}, ${px(13)}/500 ${p.ink2} initials), the name ${px(16)}/500 ${p.ink} over the role ${px(13)} ${p.ink2}. Rows: ${names.map((n, i) => `${n} (${initials(n)}, ${ROLES[i]})`).join("; ")}.`,
      `Fixed day labels sit at the right of each slot and never move: ${DAYS.join(", ")} (mono ${px(11)} ${p.ink3}); a ${px(6)} ${p.accent} dot sits before MON.`,
      `${s(T.mv1A)}–${s(T.mv1B)}: an arrow cursor (${p.ink}, ${p.card} outline) glides to "${p.name4}"'s grip (travel ${bezierText("travel")}) and presses at ${s(T.grab)} (scales to 0.88 and stays pressed while dragging).`,
      `On grab the row lifts over 12 frames on spring (${bezierText("spring")}): scale 1.02, ${dark ? p.fill : p.card} surface, radius ${RADIUS.button}px, a ${STROKE.hair}px ${p.accent} inner hairline${dark ? "" : " and a soft shadow 0 12px 32px rgba(0,0,0,.12)"}.`,
      `${s(T.dragA)}–${s(T.dragB)}: the cursor drags it up three slots to the top (${p.ease}, ${bezierText(p.ease)}). As its centre passes each row (frames ${[2, 1, 0].map((j) => crossFrame(j, p.ease)).join(", ")}) that row slides down one slot over ${T.shift} frames on spring, one by one.`,
      `${s(T.dropA)}: release; lift, shadow and hairline settle back over 16 frames on spring and the cursor glides away. Hold the new order.`,
      `${s(T.backA)}–${s(T.backB)}: the list sorts back to the original order on travel (rows stagger 3 frames; the moved row lifts slightly as it passes). The last 12 frames hold still; the ${c.seconds}s loop is seamless.`,
    ].join("\n");
  },
});
