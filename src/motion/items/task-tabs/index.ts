import { EASE_OPTIONS, RADIUS, STROKE, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { CH, CW, DONE, OTHER_TODO, SCALE, T, TaskTabs, isDark, type TaskTabsProps } from "./TaskTabs";

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

export default defineMotion<TaskTabsProps>({
  slug: "task-tabs",
  name: "Task Tabs",
  description: "A to-do card where a cursor ticks a task off, the list closes the gap, and the status tabs slide to show it under Completed.",
  category: "ui",
  tags: ["todo", "tabs", "checklist", "cursor", "productivity"],
  addedAt: "2026-10-20",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: TaskTabs,
  defaultProps: {
    ...palettes[0].values,
    date: "Monday, March 2",
    group: "Work",
    task: "Write the launch announcement",
    todoLabel: "To-do",
    doneLabel: "Completed",
    todoCount: 3,
    ease: "travel",
  } as TaskTabsProps,
  palettes,
  controls: [
    { type: "text", key: "task", label: "Checked task", maxLength: 34 },
    { type: "text", key: "group", label: "Group", maxLength: 16 },
    { type: "text", key: "date", label: "Date", maxLength: 22 },
    { type: "text", key: "todoLabel", label: "Tab 1", maxLength: 10 },
    { type: "text", key: "doneLabel", label: "Tab 2", maxLength: 10 },
    { type: "color", key: "background", label: "Canvas" },
    { type: "color", key: "accent", label: "Checkbox" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const k = SCALE[ratio];
    const px = (n: number) => `${Math.round(n * k)}px`;
    const s = (f: number) => secs(f, c.fps);
    const dark = isDark(p.background);
    const todo = Math.min(9, Math.max(2, Math.round(Number(p.todoCount) || 3)));
    return [
      targetLine(c.target, `a to-do card with status tabs where a cursor checks a task off, switches to Completed, unchecks it and switches back`, c.width, c.height, c.seconds),
      `Canvas ${p.background}. Sizes are px at 1080 on the short side. Inter for all text (400/500, sentence case), Geist Mono only for the tab counts. No gradients or glows.`,
      `Card ${px(CW)} × ${px(CH)}, ${p.card}, 1px ${p.line} border, radius ${RADIUS.card}px${dark ? ", no shadow" : ", shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)"}, ${px(28)} padding. Top: "${p.date}" ${px(13)} ${p.ink3}.`,
      `Tabs: a full-width ${px(48)} segmented control in ${p.fill} (radius ${RADIUS.button}px) with four equal tabs, "${p.todoLabel} ${todo}", "${p.doneLabel} ${DONE.length}", "Pending 1", "On hold 2": labels ${px(14)}/500 (${p.ink} when active, ${p.ink2} otherwise), counts ${px(12)} mono ${p.ink3}. The active tab sits on a ${p.card} chip (radius ${RADIUS.chip}px, ${px(4)} inset, tiny shadow${dark ? ", 1px border" : ""}).`,
      `To-do list: group header "${p.group}" (chevron, ${px(14)}/500) with "${OTHER_TODO[0]}" and "${p.task}", then "Personal" with "${OTHER_TODO[1]}". Rows ${px(42)} tall: a ${px(20)} checkbox (radius ${RADIUS.chip}px, ${STROKE.ring}px ${p.ink3} border) and ${px(15)} text in ${p.ink}. Completed list: "Today" with "${p.task}" then ${DONE.map((d) => `"${d}"`).join(", ")}, all checked and struck through in ${p.ink3}.`,
      `A checked box fills ${p.accent} (scales 0.6→1) and draws a ${p.onAccent} tick with stroke-dashoffset; the strikethrough is a ${STROKE.hair}px ${p.ink3} line that grows left to right as the text greys from ${p.ink} to ${p.ink3}.`,
      `${s(T.mv1A)}–${s(T.mv1B)}: an arrow cursor glides to the checkbox of "${p.task}" (travel ${bezierText("travel")}, slight bow) and clicks at ${s(T.click1)} (cursor scales 0.88). Check over 8 frames, strike over 14. ${s(T.colA)}–${s(T.colB)}: the row fades and its height closes to 0, the rows below reflow up; the ${p.todoLabel} count slides ${todo}→${todo - 1} and ${p.doneLabel} ${DONE.length}→${DONE.length + 1} (old number slides up and out, new one up from below).`,
      `${s(T.mv2A)}–${s(T.click2)}: the cursor clicks "${p.doneLabel}"; the chip slides across over 18 frames (${p.ease} ${bezierText(p.ease)}), the to-do list fades out over 12 frames on exit and the completed list fades in, rising ${px(10)}, over 18 frames on enter.`,
      `${s(T.mv3A)}–${s(T.click3)}: the cursor unchecks "${p.task}" in Completed (tick and strike retract, counts slide back). ${s(T.mv4A)}–${s(T.click4)}: it clicks "${p.todoLabel}", the chip slides back, the to-do list returns with the task restored, and the cursor glides home by ${s(T.homeB)}. Hold the last 12 frames; the ${c.seconds}s loop is seamless.`,
    ].join("\n");
  },
});
