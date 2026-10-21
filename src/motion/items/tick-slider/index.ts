import { EASE_OPTIONS, RADIUS, STROKE, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { DRAGS, FOLLOW, GEO, SIGMA, T, TICKS, TickSlider, isDark, range, type TickSliderProps } from "./TickSlider";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  line: t.line,
  ink: t.ink,
  ink2: t.ink2,
  ink3: t.ink3,
  accent: t.accent,
}));

export default defineMotion<TickSliderProps>({
  slug: "tick-slider",
  name: "Tick Slider",
  description: "A wide scrubber of 41 ticks that swell like a lens around the thumb as a cursor drags it with inertia, while a big value rolls above.",
  category: "ui",
  tags: ["slider", "scrubber", "ticks", "cursor", "input"],
  addedAt: "2026-10-22",
  durationInFrames: 150,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: TickSlider,
  defaultProps: {
    ...palettes[0].values,
    label: "Speed",
    min: 0,
    max: 100,
    lens: 1,
    ease: "travel",
  } as TickSliderProps,
  palettes,
  controls: [
    { type: "text", key: "label", label: "Label", maxLength: 12 },
    { type: "number", key: "min", label: "Min", min: 0, max: 100, step: 1 },
    { type: "number", key: "max", label: "Max", min: 10, max: 1000, step: 10 },
    { type: "number", key: "lens", label: "Lens", min: 0.4, max: 2, step: 0.1, unit: "×" },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Canvas" },
    { type: "select", key: "ease", label: "Drag easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const g = GEO[ratio];
    const { lo, hi } = range(p.min, p.max);
    const at = (q: number) => Math.round(lo + q * (hi - lo));
    const s = (f: number) => secs(f, c.fps);
    const dark = isDark(p.background);
    const lens = Math.min(2, Math.max(0.4, Number(p.lens) || 1));
    return [
      targetLine(c.target, `a wide tick-mark slider whose ticks swell like a lens around the thumb as a cursor drags it, with a large rolling value above`, c.width, c.height, c.seconds),
      `Canvas ${p.background}. Sizes are px at 1080 on the short side. Inter only, Geist Mono for the scale labels. No gradients or glows.`,
      `Card ${g.w}px wide, ${p.card}, 1px ${p.line} border, radius ${RADIUS.card}px${dark ? ", no shadow" : ", shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)"}, ${g.pad}px side padding.`,
      `Readout, top left, one line at ${g.font}px, -0.04em tracking: "${p.label}" 400 in ${p.ink3}, then the value 600 in ${p.ink} (starts at ${at(0.5)}). The value is an odometer: as it crosses each integer the old number slides up and out while the next slides up from below, clipped to one line.`,
      `Track: ${TICKS} vertical ticks spread evenly across the card in one SVG, ${STROKE.ring}px strokes with round caps, centred on one midline, ${g.tick}px tall (every 10th tick 30% taller). Ticks left of the thumb are ${p.ink2}, right of it ${p.ink3}.`,
      `Lens: each tick grows by ${Math.round(g.amp * lens)}px × exp(-d²/(2·${SIGMA}²)), where d is its distance from the thumb in ticks, and darkens toward ${p.ink}. At rest the lens runs at half strength; while the thumb is held it eases to full.`,
      `Thumb: a ${STROKE.bar}px ${p.accent} vertical capsule with round caps, a little taller than the tallest tick; it scales to 1.05 while held. Under the track, mono ${g.label}px ${p.ink3} labels: ${[0, 0.25, 0.5, 0.75, 1].map(at).join(", ")}.`,
      `Cursor: a 30px arrow (${p.ink}, ${p.card} outline) glides to the thumb ${s(T.inA)}–${s(T.inB)} and presses at ${s(T.press)}. Drags: ${DRAGS.map((d) => `${at(d.from)}→${at(d.to)} over ${s(d.a)}–${s(d.b)}`).join(", ")}, each on ${p.ease} ${bezierText(p.ease)}.`,
      `Inertia: the thumb chases the drag target on an under-damped spring (per frame: a = ${FOLLOW.k}·(target − x) − ${FOLLOW.c}·v), so it lags about 4 frames and overshoots slightly at each turn; the cursor rides the thumb.`,
      `Release at ${s(T.release)}, the cursor glides back to its rest point below right by ${s(T.homeB)}. Hold the last 12 frames; the ${c.seconds}s loop is seamless at ${at(0.5)}.`,
    ].join("\n");
  },
});
