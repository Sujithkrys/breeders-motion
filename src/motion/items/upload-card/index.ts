import { EASE_OPTIONS, FINAL_HOLD, RADIUS, STROKE, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { ENTER, EXIT, T, UploadCard, cardWidth, extOf, zoomFor, type UploadCardProps } from "./UploadCard";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  line: t.line,
  fill: t.fill,
  ink: t.ink,
  ink2: t.ink2,
  ink3: t.ink3,
  accent: t.accent,
  onAccent: t.onAccent,
  success: t.success,
}));

const DURATION = 180;

export default defineMotion<UploadCardProps>({
  slug: "upload-card",
  name: "Upload Card",
  description: "A file drops into a dashed drop zone, uploads with live percentage and speed, and lands in a done state with a check.",
  category: "ui",
  tags: ["upload", "file", "progress", "dropzone", "success"],
  addedAt: "2026-10-03",
  durationInFrames: DURATION,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: UploadCard,
  defaultProps: {
    ...palettes[0].values,
    fileName: "Brand-guidelines.pdf",
    sizeMb: 24.6,
    ease: "enter",
  } as UploadCardProps,
  palettes,
  controls: [
    { type: "text", key: "fileName", label: "File name", maxLength: 26 },
    { type: "number", key: "sizeMb", label: "File size", min: 2, max: 200, step: 0.1, unit: "MB" },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Background" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const k = zoomFor(ratio === "16:9");
    const px = (n: number) => Math.round(n * k);
    const size = Math.max(1, Math.round(p.sizeMb * 10) / 10);
    return [
      targetLine(c.target, "a file upload card: a file drops into a drop zone, uploads, and confirms", c.width, c.height, c.seconds),
      `Background: flat ${p.background}. One card ${px(cardWidth(ratio))}×${px(620)}px: ${p.card} fill, 1px ${p.line} border, radius ${px(RADIUS.card)}, ${px(40)}px padding, shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06) (none on a dark canvas).`,
      `Type: Inter, sentence case, hierarchy by grey. "Upload files" ${px(34)}px weight 500, -0.035em, ${p.ink}; "Add documents to the shared workspace" ${px(21)}px ${p.ink2}; "Drop files here or browse" ${px(25)}px ${p.ink2} with "browse" in ${p.ink} 500; "PDF, PNG or ZIP · up to 500 MB" ${px(19)}px ${p.ink3}. File name "${p.fileName}" ${px(25)}px 500; status ${px(19)}px ${p.ink2} tabular; percentage in Geist Mono ${px(22)}px 500.`,
      `Geometry: drop zone ${px(300)}px tall, radius ${px(RADIUS.button)}, ${p.fill} fill, a ${STROKE.ring}px dashed SVG border (12/9) in ${p.ink} at 20%, with a ${px(68)}px ${p.card} upload tile (hairline ${p.line}, ${p.ink2} arrow). File row ${px(112)}px, radius ${px(RADIUS.button)}, ${STROKE.hair}px ${p.line} border; a ${STROKE.bar}px pill progress bar on a ${p.fill} track.`,
      `File icon: a ${p.card} page with a ${STROKE.hair}px ${p.ink3} outline, a ${p.fill} folded corner and a small ${p.accent} chip reading "${extOf(p.fileName)}" in Geist Mono caps, ${p.onAccent}, +0.12em. ${p.accent} is the only accent; ${p.success} only marks the done state. No gradients or glows.`,
      `Motion: frames 0–${ENTER} the card fades up 30px (${p.ease} ${bezierText(p.ease)}).`,
      `Frames ${T.drop}–${T.land}: the icon drops 460px into the zone centre, untilting from −6° (travel ${bezierText("travel")}), with a soft contact shadow that tightens; the zone's dashes cross-fade to ${p.accent} with a 6% ${p.accent} tint and its contents fade out (exit, ${EXIT} frames). On landing it squashes 8% and recovers.`,
      `Frames ${T.travel}–${T.travel + ENTER}: the icon shrinks to ${px(56)}px and flies into the file row (travel) as the row fades up 12px; the zone returns to idle.`,
      `Frames ${T.upStart}–${T.upEnd} (${secs(T.upStart, c.fps)}–${secs(T.upEnd, c.fps)}): the bar fills in solid ${p.accent} (travel, slight wobble). Status "X of ${size} MB · ~5.2 MB/s · Ns left", live percentage on the right.`,
      `Frames ${T.done}–${T.done + ENTER}: the bar turns ${p.success}, the status becomes "${size} MB · Uploaded just now", and the percentage swaps for a ${px(44)}px ${p.success} check circle that springs in while its tick draws on. Frames ${DURATION - FINAL_HOLD}–${DURATION}: completely still.`,
    ].join("\n");
  },
});
