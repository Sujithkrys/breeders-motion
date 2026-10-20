import { EASE_OPTIONS, RADIUS, STROKE, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { CopyConfirmation, GEO, SHOW, T, shownValue, type CopyConfirmationProps } from "./CopyConfirmation";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  fill: t.fill,
  line: t.line,
  ink: t.ink,
  ink2: t.ink2,
  accent: t.accent,
  success: t.success,
}));

export default defineMotion<CopyConfirmationProps>({
  slug: "copy-confirmation",
  name: "Copy Confirmation",
  description: "An id field with a copy button; one click turns the value into a green-ticked confirmation inside the same box, which then reverts.",
  category: "ui",
  tags: ["copy", "input", "feedback", "success", "cursor", "micro-interaction"],
  addedAt: "2026-10-20",
  durationInFrames: 150,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: CopyConfirmation,
  defaultProps: {
    ...palettes[0].values,
    label: "ID",
    value: "con_ij4wyajc4wl9xq7m2kd8",
    copied: "Copied!",
    ease: "enter",
  } as CopyConfirmationProps,
  palettes,
  controls: [
    { type: "text", key: "label", label: "Label", maxLength: 16 },
    { type: "text", key: "value", label: "Value", maxLength: 40 },
    { type: "text", key: "copied", label: "Confirmation", maxLength: 16 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Canvas" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const g = GEO[ratio];
    const f = (a: readonly [number, number]) => `${a[0]}–${a[1]}`;
    return [
      targetLine(c.target, `a copy-to-clipboard id field whose value turns into a "${p.copied}" confirmation and back`, c.width, c.height, c.seconds),
      `Canvas ${p.background}, flat. Sizes are px at 1080 on the short side. Inter only, sentence case, no gradients or glows.`,
      `Label row, left-aligned with the field: a ${g.label}px "#" glyph stroked ${STROKE.ring}px in ${p.accent}, 12px gap, "${p.label}" ${g.label}px/500 in ${p.ink2}. ${g.labelGap}px below it the field.`,
      `Field, centred: ${g.w}×${g.h}px, radius ${RADIUS.button}px, fill ${p.fill}, 1px ${p.line} inner border, overflow hidden; it never changes size. Inside, ${g.pad}px from the left: "${shownValue(p.value)}" (first ${SHOW} characters, then an ellipsis) Inter ${g.font}px/400, -0.02em tracking, ${p.ink}.`,
      `Copy button at the right: a ${g.btn}px square hit area (radius ${RADIUS.button}px) centred vertically, holding a ${g.icon}px copy icon (two offset rounded squares) in ${p.ink2}, ${STROKE.ring}px strokes. Hover fills it with ${p.ink} at 7% over ${p.fill}.`,
      `Frames ${f(T.toBtn)}: an arrow cursor (30px, ${p.ink} with a ${p.background} outline) glides from below-right onto the button on ${bezierText("travel")}; hover appears ${f(T.hoverIn)}. Click at ${T.click}: cursor scales to 0.88 and the button to 0.92 for 9 frames.`,
      `Then the value rises half a line, blurs 8px and fades (${f(T.valueOut)}, exit ${bezierText("exit")}) while "${p.copied}" (${g.font}px/500, ${p.ink}) rises in from half a line below and un-blurs (${f(T.copiedIn)}); the copy icon shrinks to 60% and fades (${f(T.copyIconOut)}) and a ${p.success} tick draws in with a stroke-dash reveal (${f(T.checkIn)}).`,
      `The cursor glides back to rest (${f(T.toRest)}). At ${T.copiedOut[0]} it reverts: "${p.copied}" and the tick leave upward (${f(T.copiedOut)}, exit) and the value and copy icon return from below (${f(T.valueIn)}).`,
      `Entrances use ${p.ease} ${bezierText(p.ease)}. Everything is still from frame ${T.valueIn[1]}; loop ${c.seconds}s, seamless.`,
    ].join("\n");
  },
});
