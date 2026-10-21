import { RADIUS, STROKE, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import {
  BAR_LEN,
  BAR_TOP,
  BOX,
  CHECKS,
  CHECK_LEN,
  CW,
  INITIALS,
  InteractiveChecklist,
  LIST_TOP,
  PAD,
  ROW_H,
  SCALE,
  STRIKE_LEN,
  T,
  isDark,
  type InteractiveChecklistProps,
} from "./InteractiveChecklist";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  fill: t.fill,
  line: t.line,
  ink: t.ink,
  ink2: t.ink2,
  ink3: t.ink3,
  accent: t.accent,
  onAccent: t.onAccent,
}));

export default defineMotion<InteractiveChecklistProps>({
  slug: "interactive-checklist",
  name: "Interactive Checklist",
  description: "A cursor ticks off a five-task launch checklist one by one as each task strikes through, the progress bar fills, and the header flips to Ready to ship.",
  category: "ui",
  tags: ["checklist", "todo", "progress", "cursor", "launch"],
  addedAt: "2026-10-22",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: InteractiveChecklist,
  defaultProps: {
    ...palettes[0].values,
    title: "Launch checklist",
    doneTitle: "Ready to ship",
    task1: "Freeze the release branch",
    task2: "Run the final QA pass",
    task3: "Update the changelog",
    task4: "Record the demo video",
    task5: "Schedule the announcement",
  } as InteractiveChecklistProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title", maxLength: 22 },
    { type: "text", key: "task1", label: "Task 1", maxLength: 30 },
    { type: "text", key: "task2", label: "Task 2", maxLength: 30 },
    { type: "text", key: "task3", label: "Task 3", maxLength: 30 },
    { type: "text", key: "task4", label: "Task 4", maxLength: 30 },
    { type: "text", key: "task5", label: "Task 5", maxLength: 30 },
    { type: "text", key: "doneTitle", label: "Done title", maxLength: 22 },
    { type: "color", key: "accent", label: "Accent" },
  ],
  prompt: (p, c) => {
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const k = SCALE[ratio];
    const px = (n: number) => `${Math.round(n * k)}px`;
    const s = (f: number) => secs(f, c.fps);
    const dark = isDark(p.background);
    const tasks = [p.task1, p.task2, p.task3, p.task4, p.task5];
    return [
      targetLine(c.target, `a "${p.title}" card where a cursor ticks off ${tasks.length} tasks, a progress bar fills and the title flips to "${p.doneTitle}"`, c.width, c.height, c.seconds),
      `Canvas ${p.background}, flat. Sizes are px at 1080 on the short side. Inter (400 tasks, 500 title and initials, sentence case); Geist Mono for the tiny labels and count. No gradients or glows.`,
      `Card ${px(CW)} wide, centred, ${p.card}, 1px ${p.line} border, radius ${RADIUS.card}px${dark ? ", no shadow" : ", shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)"}, ${px(PAD)} padding. Title "${p.title}" ${px(24)}/500 -0.03em ${p.ink}; under it "Due Friday, Oct 24" ${px(13)} ${p.ink3}.`,
      `Above the bar: "PROGRESS" Geist Mono ${px(11)} +0.12em ${p.ink3} on the left, the count "0/${tasks.length}" Geist Mono ${px(13)} ${p.ink2} on the right. Bar at ${px(BAR_TOP)} from the top: full width, ${STROKE.bar}px tall, round ends, ${p.fill} track, ${p.accent} fill.`,
      `From ${px(LIST_TOP)}: ${tasks.length} rows of ${px(ROW_H)}: ${tasks.map((t) => `"${t}"`).join(", ")}. Each has a ${px(BOX)} checkbox (radius ${RADIUS.chip}px, ${STROKE.ring}px ${p.ink3} border), the task ${px(17)} ${p.ink}, and on the right a ${px(30)} ${p.fill} circle with initials ${INITIALS.map((i) => `"${i}"`).join(", ")} ${px(11)}/500 ${p.ink2}. 1px ${p.line} dividers start at the text.`,
      `Ticks at ${CHECKS.map(s).join(", ")}: an arrow cursor glides between checkboxes on ${bezierText("travel")} and clicks each (scales 0.88). The box fills ${p.accent}, scaling 0.5→1 over ${CHECK_LEN} frames on ${bezierText("spring")}, and a ${p.onAccent} tick draws with stroke-dashoffset; a ${STROKE.hair}px ${p.ink3} strike-through grows across the text over ${STRIKE_LEN} frames on enter ${bezierText("enter")} while the text greys ${p.ink}→${p.ink3} and the initials dim to 60%.`,
      `Each tick moves the bar up a fifth over ${BAR_LEN} frames on travel ${bezierText("travel")}; the count's old value slides up and out as the new one rises in.`,
      `${s(T.swapA)}–${s(T.swapB)}: after the last tick the title slides up and out as "${p.doneTitle}" rises in on enter; the cursor glides back below the card.`,
      `${s(T.resetA)}–${s(T.resetB)}: reset. Ticks fade out bottom-up 3 frames apart on exit ${bezierText("exit")}, strikes retract, the bar empties on travel, the count goes back to 0 and the title returns. Hold the last 12 frames; the ${c.seconds}s loop is seamless.`,
    ].join("\n");
  },
});
