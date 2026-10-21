import { EASE_OPTIONS, RADIUS, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { CAP, CELL_H, DRAG, DateRangePicker, SCALE, T, WEEKDAYS, isDark, layoutFor, parseMonth, readout, type DateRangePickerProps } from "./DateRangePicker";

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

export default defineMotion<DateRangePickerProps>({
  slug: "date-range-picker",
  name: "Date Range Picker",
  description: "A month calendar where a cursor drags out a date range that fills between two accent caps, then a preset chip moves the range to a new span.",
  category: "ui",
  tags: ["calendar", "date", "range", "picker", "cursor"],
  addedAt: "2026-10-22",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: DateRangePicker,
  defaultProps: {
    ...palettes[0].values,
    month: "October 2026",
    preset1: "Today",
    preset2: "This week",
    preset3: "Last 7 days",
    ease: "travel",
  } as DateRangePickerProps,
  palettes,
  controls: [
    { type: "text", key: "month", label: "Month", maxLength: 18 },
    { type: "text", key: "preset1", label: "Preset 1", maxLength: 14 },
    { type: "text", key: "preset2", label: "Preset 2", maxLength: 14 },
    { type: "text", key: "preset3", label: "Preset 3 (clicked)", maxLength: 14 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Canvas" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const side = ratio === "16:9";
    const cal = parseMonth(p.month);
    const L = layoutFor(side, cal.rows);
    const k = Math.min(SCALE[ratio], (c.height * 0.9) / ((Math.min(c.width, c.height) / 1080) * L.ch));
    const px = (n: number) => `${Math.round(n * k)}px`;
    const s = (f: number) => secs(f, c.fps);
    const dark = isDark(p.background);
    const a = readout(cal.short, DRAG.from, Math.min(DRAG.to, cal.days));
    const b = readout(cal.short, Math.max(1, cal.today - 6), cal.today);
    return [
      targetLine(c.target, `a date range picker card where a cursor drags out a range on a month grid, then a preset chip moves the range`, c.width, c.height, c.seconds),
      `Canvas ${p.background}. Sizes are px at 1080 on the short side. Inter for all text (400/500, sentence case); Geist Mono only for the weekday row. No gradients or glows.`,
      `Card ${px(L.cw)} × ${px(L.ch)}, ${p.card}, 1px ${p.line} border, radius ${RADIUS.card}px${dark ? ", no shadow" : ", shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)"}. Header: the range readout at ${px(28)}, -0.03em: dates 500 in ${p.ink}, then the day count 400 in ${p.ink2} (empty state "Select dates" in ${p.ink3}); a 1px ${p.line} divider below it.`,
      side
        ? `Presets in a ${px(200)} left column behind a 1px divider: "${p.preset1}", "${p.preset2}", "${p.preset3}" as ${px(36)} rows (radius ${RADIUS.button}px), ${px(15)}/500 ${p.ink2}; selected = ${p.fill} fill and ${p.ink} text.`
        : `Presets as a row of ${px(36)} chips under the header: "${p.preset1}", "${p.preset2}", "${p.preset3}", radius ${RADIUS.chip}px, 1px ${p.line} inner border, ${px(15)}/500 ${p.ink2}; selected = ${p.fill} fill and ${p.ink} text.`,
      `Calendar: "${p.month}" ${px(16)}/500 with prev/next chevrons on the right; a mono weekday row ${WEEKDAYS.join(" ")} (${px(11)}, +0.1em, ${p.ink3}); a 7 × ${cal.rows} grid (Monday first) of ${px(16)} day numbers in ${px(CELL_H)} rows, days outside the month in ${p.ink3}. Day ${cal.today} is today: a small ${p.accent} dot under it.`,
      `Range style: the two end days sit on ${px(CAP)} ${p.accent} squares (radius ${RADIUS.button}px) with ${p.onAccent} numbers; between them a ${px(CAP)}-tall band of ${p.accent} at ${dark ? 22 : 12}% opacity runs from cap centre to cap centre, wrapping row by row with rounded ends.`,
      `${s(T.inA)}–${s(T.inB)}: an arrow cursor glides to day ${DRAG.from} and presses at ${s(T.press)}; the start cap pops (scale 0.6 → 1.08 → 1, spring). ${s(T.dragA)}–${s(T.dragB)} it drags to day ${Math.min(DRAG.to, cal.days)} (${p.ease} ${bezierText(p.ease)}) while the band fills in reading order; on release at ${s(T.release)} the end cap pops and the header rolls up to "${a.main} ${a.tail}".`,
      `${s(T.toChipA)}–${s(T.click)}: the cursor clicks "${p.preset3}"; the chip fills, the old range fades out over 14 frames (exit ${bezierText("exit")}), the new start cap pops on day ${Math.max(1, cal.today - 6)}, the band fills to day ${cal.today} over 20 frames and its end cap pops; the header rolls to "${b.main} ${b.tail}".`,
      `${s(T.resetA)}–${s(T.resetB)}: the range and chip fade out, the header returns to "Select dates", and the cursor glides home. Hold the last 12 frames; the ${c.seconds}s loop is seamless.`,
    ].join("\n");
  },
});
