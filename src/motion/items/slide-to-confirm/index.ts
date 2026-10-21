import { EASE_OPTIONS, STROKE, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { GEO, SNAP, SNAP_FRAMES, SlideToConfirm, T, dragFrames, isDark, timeline, type SlideToConfirmProps } from "./SlideToConfirm";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  line: t.line,
  ink: t.ink,
  ink2: t.ink2,
  button: t.button,
  onButton: t.onButton,
  accent: t.accent,
  onAccent: t.onAccent,
  success: t.success,
}));

export default defineMotion<SlideToConfirmProps>({
  slug: "slide-to-confirm",
  name: "Slide to Confirm",
  description: "A cursor drags the thumb of a slide-to-pay track, the accent fill follows it, and the last stretch snaps home on a spring into a green Paid state.",
  category: "ui",
  tags: ["payment", "slider", "cursor", "confirm", "success"],
  addedAt: "2026-10-22",
  durationInFrames: 150,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: SlideToConfirm,
  defaultProps: {
    ...palettes[0].values,
    label: "Slide to pay $240",
    doneLabel: "Paid",
    speed: 100,
    ease: "travel",
  } as SlideToConfirmProps,
  palettes,
  controls: [
    { type: "text", key: "label", label: "Label", maxLength: 24 },
    { type: "text", key: "doneLabel", label: "Done label", maxLength: 14 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Canvas" },
    { type: "number", key: "speed", label: "Drag speed", min: 75, max: 150, step: 5, unit: "%" },
    { type: "select", key: "ease", label: "Drag easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const g = GEO[ratio];
    const d = g.h - 2 * g.pad;
    const tl = timeline(p.speed);
    const s = (f: number) => secs(f, c.fps);
    const dark = isDark(p.background);
    return [
      targetLine(c.target, `a "${p.label}" slide-to-confirm track that a cursor drags to a "${p.doneLabel}" state`, c.width, c.height, c.seconds),
      `Canvas ${p.background}, flat. Sizes are px at 1080 on the short side. Inter only, sentence case. No gradients or glows.`,
      `Track: ${g.w}×${g.h}px full pill, centred, ${p.card} with a 1px ${p.line} border${dark ? "" : ", shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)"}, overflow hidden. Label "${p.label}" ${g.font}px/500, -0.02em, ${p.ink2}, centred in the run right of the thumb.`,
      `Thumb: a ${d}px circle inset ${g.pad}px, ${p.button}${dark ? "" : " with shadow 0 1px 2px rgba(0,0,0,.08), 0 6px 16px rgba(0,0,0,.12)"}, holding a right arrow in ${p.onButton} (${Math.round(d * 0.4)}px icon, ${STROKE.bar}px stroke, round caps).`,
      `Behind the thumb a ${d}px-tall ${p.accent} pill grows from the left inset to the thumb's right edge. As the thumb moves the label fades out by 35% of the run and slides right by 18% of the track width.`,
      `${s(T.mvA)}–${s(T.mvB)}: an arrow cursor (${p.ink}, ${p.background} outline) glides to the thumb on ${bezierText("travel")} and presses at ${s(T.grab)} (cursor 0.88, thumb 0.96).`,
      `${s(T.dragA)}–${s(tl.dragB)} (${dragFrames(p.speed)} frames): the cursor drags the thumb to ${Math.round(SNAP * 100)}% of its run on ${p.ease} ${bezierText(p.ease)}, then lets go; the thumb snaps the last ${Math.round((1 - SNAP) * 100)}% over ${SNAP_FRAMES} frames on ${bezierText("spring")}.`,
      `${s(tl.okA)}–${s(tl.okB)}: the track, its border and the fill turn ${p.success}; the thumb turns ${p.onAccent}, its arrow fades and a ${p.success} check draws in with stroke-dashoffset. "${p.doneLabel}" ${g.font}px/500 in ${p.onAccent} rises 18px into the run left of the thumb (${s(tl.paidA)}–${s(tl.paidB)}). The cursor drifts back to its rest point.`,
      `Reset: ${s(T.okOutA)}–${s(T.okOutB)} the green fades back on exit ${bezierText("exit")}; ${s(T.backA)}–${s(T.backB)} the thumb slides home on travel and the label returns with it. Hold the last 12 frames; the ${c.seconds}s loop is seamless.`,
    ].join("\n");
  },
});
