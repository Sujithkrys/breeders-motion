import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { T, UploadCard, extOf, type UploadCardProps } from "./UploadCard";

const palettes = [
  { name: "Peach", swatch: ["#FBEFE7", "#F2643D", "#16A34A"], values: { background: "#FBEFE7", card: "#FFFFFF", ink: "#24150E", accent: "#F2643D", success: "#16A34A" } },
  { name: "Teal", swatch: ["#061211", "#2DD4BF", "#A3E635"], values: { background: "#061211", card: "#0F1F1D", ink: "#E8FFFB", accent: "#2DD4BF", success: "#A3E635" } },
  { name: "Violet", swatch: ["#0D0A18", "#A78BFA", "#4ADE80"], values: { background: "#0D0A18", card: "#18142A", ink: "#F2EEFF", accent: "#A78BFA", success: "#4ADE80" } },
  { name: "Amber", swatch: ["#120E06", "#F5A524", "#84CC16"], values: { background: "#120E06", card: "#1E1810", ink: "#FFF6E5", accent: "#F5A524", success: "#84CC16" } },
  { name: "Graphite", swatch: ["#0B0B0C", "#A1A1AA", "#4ADE80"], values: { background: "#0B0B0C", card: "#18181B", ink: "#F4F4F5", accent: "#A1A1AA", success: "#4ADE80" } },
];

export default defineMotion<UploadCardProps>({
  slug: "upload-card",
  name: "Upload Card",
  description: "A file drops into a dashed drop zone, uploads with live percentage and speed, and lands in a done state with a check.",
  category: "ui",
  tags: ["upload", "file", "progress", "dropzone", "success"],
  addedAt: "2026-10-03",
  durationInFrames: 195,
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
    { type: "color", key: "success", label: "Success" },
    { type: "color", key: "background", label: "Background" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) =>
    [
      targetLine(c.target, "a file upload card: drag into a drop zone, progress, done state", c.width, c.height, c.seconds),
      `Background ${p.background}. Card ${p.card}, ${c.width < c.height ? 820 : 760}×620, radius 40, 40px padding, 1.5px ${p.ink} border at 8%, soft deep shadow. Font Geist; percentage in Geist Mono. Text ${p.ink}, secondary at 56%.`,
      `Header: "Upload files" 34px weight 650 (-0.035em), "Add documents to the shared workspace" 21px, and a muted close X.`,
      `Drop zone: 300px tall, radius 28, a 2px dashed SVG border (12/9 dash) and a faint ${p.accent} fill, with a ${p.accent} upload arrow in a tinted 68px tile, "Drop files here or browse" (browse in ${p.accent}) and "PDF, PNG or ZIP · up to 500 MB".`,
      `File icon: a ${p.accent} document with a lighter folded corner and a white "${extOf(p.fileName)}" label, 120px wide.`,
      "",
      `${secs(T.drop, c.fps)}–${secs(T.land, c.fps)}: the icon drops from 460px above into the zone centre, untilting from −10° with a blurred shadow that tightens as it lands; the zone's border turns ${p.accent}, its tint deepens and its contents fade out. On landing it squashes 8% and springs back.`,
      `${secs(T.travel, c.fps)}: the icon shrinks to 56px and flies into a 112px file row below the zone, which fades up 12px. The zone settles back to idle (${p.ease} ${bezierText(p.ease)}).`,
      `${secs(T.upStart, c.fps)}–${secs(T.upEnd, c.fps)}: an 8px bar fills with a ${p.accent} gradient on a soft eased curve with a slight wobble. Status line: "X of ${Math.round(p.sizeMb * 10) / 10} MB · ~5.2 MB/s · Ns left" with live speed; "N%" on the right.`,
      `${secs(T.done, c.fps)}: the bar turns ${p.success}, the status becomes "${Math.round(p.sizeMb * 10) / 10} MB · Uploaded just now" ("Uploaded" in ${p.success}), and the percentage swaps for a 48px ${p.success} check circle that pops in while its tick draws on. File name "${p.fileName}" at 25px weight 600 throughout.`,
      `Hold the done state to ${c.seconds}s.`,
    ].join("\n"),
});
