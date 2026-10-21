import { EASE_OPTIONS, RADIUS, STROKE, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { DAY_NAMES, DRAFT, EVENTS, GEO, GRID_Y, GUTTER, NOW, T, TODAY, WeekCalendar, firstDay, clock, isDark, span, type WeekCalendarProps } from "./WeekCalendar";

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

export default defineMotion<WeekCalendarProps>({
  slug: "week-calendar",
  name: "Week Calendar",
  description: "A five-day week view where events drop in one by one, a now line drifts down, and a cursor drags out a new event whose title types in.",
  category: "ui",
  tags: ["calendar", "schedule", "events", "cursor", "productivity"],
  addedAt: "2026-10-22",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: WeekCalendar,
  defaultProps: {
    ...palettes[0].values,
    week: "Oct 19 – 23, 2026",
    newTitle: "Design critique",
    stagger: 5,
    ease: "spring",
  } as WeekCalendarProps,
  palettes,
  controls: [
    { type: "text", key: "week", label: "Week", maxLength: 22 },
    { type: "text", key: "newTitle", label: "New event", maxLength: 20 },
    { type: "number", key: "stagger", label: "Drop stagger", min: 2, max: 6, step: 1, unit: "f" },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Canvas" },
    { type: "select", key: "ease", label: "Drop easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const g = GEO[ratio];
    const k = g.scale;
    const px = (n: number) => `${Math.round(n * k)}px`;
    const s = (f: number) => secs(f, c.fps);
    const dark = isDark(p.background);
    const st = Math.min(6, Math.max(2, Math.round(Number(p.stagger) || 5)));
    const d0 = firstDay(p.week);
    const ch = GRID_Y + (g.to - g.from) * g.hourH + 20;
    const ev = (e: (typeof EVENTS)[number]) => `${DAY_NAMES[e.d].slice(0, 1)}${DAY_NAMES[e.d].slice(1).toLowerCase()} ${span(e.a, e.b)} "${e.t}"${e.accent ? " (accent)" : ""}`;
    return [
      targetLine(c.target, `a five-day week calendar where events drop in, a now line drifts, and a cursor drags out a new event and types its title`, c.width, c.height, c.seconds),
      `Canvas ${p.background}. Sizes are px at 1080 on the short side. Inter for text, Geist Mono for day names, hour labels and the now time. No gradients or glows.`,
      `Card ${px(g.cw)} × ${px(ch)}, ${p.card}, 1px ${p.line} border, radius ${RADIUS.card}px${dark ? ", no shadow" : ", shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)"}. Title "${p.week}" ${px(20)}/500, -0.02em, with prev/next chevrons on the right.`,
      `Grid: a ${px(GUTTER)} hour gutter then 5 equal day columns (${DAY_NAMES.map((n, i) => `${n} ${d0 + i}`).join(", ")}). Day header: mono ${px(11)} +0.1em ${p.ink3} name and a ${px(15)}/500 date; ${DAY_NAMES[TODAY]} is today, its date ${p.onAccent} on a ${px(26)} ${p.accent} circle. Hours ${g.from}–${g.to} at ${px(g.hourH)} each, ${STROKE.hair}px ${p.line} hour lines and column rules, mono ${px(10.5)} ${p.ink3} hour labels.`,
      `Events: ${EVENTS.map(ev).join("; ")}. Blocks inset ${px(3)}, radius ${RADIUS.chip}px: neutral ones ${p.fill}; accent ones ${p.accent} at ${dark ? 20 : 12}% with a ${STROKE.bar}px ${p.accent} left bar. Title ${px(12.5)}/500 ${p.ink}, time ${px(11)} ${p.ink2}.`,
      `Drop-in from ${s(T.dropA)}: each event fades in and falls ${px(24)} into place over ${T.drop} frames (${p.ease} ${bezierText(p.ease)}), ${st} frames apart.`,
      `Now line: a ${STROKE.hair}px ${p.accent} line at 30% across all columns, solid ${STROKE.ring}px in today's column with a ${px(8)} dot at its left and the mono time in the gutter; it drifts linearly from ${clock(NOW.from)} to ${clock(NOW.to)} over the loop and fades in over the first ${T.nowIn} frames.`,
      `${s(T.inA)}–${s(T.inB)}: an arrow cursor (30px, ${p.ink}, ${p.card} outline) glides to ${DAY_NAMES[DRAFT.d]} ${clock(DRAFT.a)} and presses at ${s(T.press)}; a 15-minute accent block pops in (scale 0.94→1, spring) with a ${STROKE.ring}px ${p.accent} inner ring. ${s(T.dragA)}–${s(T.dragB)} the cursor drags down and the block's bottom edge follows it to ${clock(DRAFT.b)}, its time label stepping in 15-minute increments to "${span(DRAFT.a, DRAFT.b)}".`,
      `On release the cursor glides away (${s(T.homeA)}–${s(T.homeB)}) and "${p.newTitle}" types into the block ${s(T.typeA)}–${s(T.typeEnd)} behind a blinking ${p.accent} caret; at ${s(T.commit)} the ring fades and it becomes a normal accent event.`,
      `${s(T.exitA)}–${s(T.exitB)}: all events and the now line fade out (exit ${bezierText("exit")}), leaving the empty grid. Hold the last 12 frames; the ${c.seconds}s loop is seamless.`,
    ].join("\n");
  },
});
