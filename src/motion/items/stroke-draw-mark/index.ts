import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { STROKE_W, StrokeDrawMark, timeline, type StrokeDrawMarkProps } from "./StrokeDrawMark";

const palettes = [
  { name: "Mint", swatch: ["#A7F3D0", "#14B8A6", "#06120F"], values: { background: "#06120F", stroke: "#A7F3D0", fill: "#14B8A6", nameColor: "#ECFDF5", taglineColor: "#7FA89B" } },
  { name: "Coral", swatch: ["#FFC2A8", "#FF6B4A", "#160B0B"], values: { background: "#160B0B", stroke: "#FFC2A8", fill: "#FF6B4A", nameColor: "#FFF1EC", taglineColor: "#B08A80" } },
  { name: "Indigo", swatch: ["#C7D2FE", "#6366F1", "#0A0B1C"], values: { background: "#0A0B1C", stroke: "#C7D2FE", fill: "#6366F1", nameColor: "#EEF0FF", taglineColor: "#8A8FB8" } },
  { name: "Butter", swatch: ["#FBF6E9", "#F2B705", "#1F1A10"], values: { background: "#FBF6E9", stroke: "#1F1A10", fill: "#F2B705", nameColor: "#1F1A10", taglineColor: "#7A6F58" } },
  { name: "Magenta", swatch: ["#F5B8FF", "#D946EF", "#14061A"], values: { background: "#14061A", stroke: "#F5B8FF", fill: "#D946EF", nameColor: "#FCEBFF", taglineColor: "#A07FAE" } },
  { name: "Graphite", swatch: ["#E5E5E7", "#8E8E96", "#0E0E10"], values: { background: "#0E0E10", stroke: "#E5E5E7", fill: "#8E8E96", nameColor: "#F4F4F5", taglineColor: "#7A7A82" } },
];

export default defineMotion<StrokeDrawMarkProps>({
  slug: "stroke-draw-mark",
  name: "Stroke Draw Mark",
  description: "A geometric glyph draws itself on stroke by stroke, floods with colour, and the name and tagline fade up.",
  category: "logo",
  tags: ["logo", "line-draw", "svg", "reveal", "stroke"],
  addedAt: "2026-09-16",
  durationInFrames: 120,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: StrokeDrawMark,
  defaultProps: {
    ...palettes[0].values,
    name: "Prism Labs",
    tagline: "Tools for teams that ship",
    stagger: 4,
    ease: "smooth",
  } as StrokeDrawMarkProps,
  palettes,
  controls: [
    { type: "text", key: "name", label: "Brand name", maxLength: 14 },
    { type: "text", key: "tagline", label: "Tagline", maxLength: 36 },
    { type: "color", key: "stroke", label: "Stroke" },
    { type: "color", key: "fill", label: "Fill" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "stagger", label: "Stroke stagger", min: 0, max: 8, step: 1, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const D = Math.round(c.seconds * c.fps);
    const vertical = c.height > c.width;
    const tl = timeline(D, p.stagger);
    const S = vertical ? 400 : 330;
    const k = S / 200;
    const s = (f: number) => secs(f, c.fps);
    return [
      targetLine(c.target, `a line-draw logo reveal: a geometric hexagon glyph draws on, floods with colour, then "${p.name}" and its tagline fade up`, c.width, c.height, c.seconds),
      `Background ${p.background}. Font Geist only. Everything stacked and centred.`,
      "",
      `Glyph: inline SVG, ${S}×${S}px. A pointy-top hexagon of radius ${Math.round(80 * k)}px split into three rhombus faces by three spokes from the centre to alternate corners (an isometric cube). Strokes ${p.stroke}, ${(STROKE_W * k).toFixed(0)}px, round joins and caps.`,
      `${s(tl.hex[0])}–${s(tl.hex[1])}: the hexagon outline draws on clockwise from the top with strokeDasharray/strokeDashoffset, led by a small glowing pen-head dot.`,
      `From ${s(tl.spoke(0)[0])}: the three spokes draw out from the centre, ${p.stagger} frames apart, ${s(tl.spoke(0)[1] - tl.spoke(0)[0])} each.`,
      `${s(tl.flood[0])}–${s(tl.flood[1])}: fill ${p.fill} floods the faces from the bottom up through a rising clip rect (top face 100%, left 78%, right 55% opacity), with a soft ${p.fill} radial glow behind.`,
      `${s(tl.recolor[0])}–${s(tl.recolor[1])}: the strokes shift to the background colour, so they become clean cuts between the faces.`,
      `Name "${p.name}": Geist 650, ${vertical ? 112 : 104}px, -0.04em, ${p.nameColor}, ${vertical ? 64 : 52}px below the glyph. Tagline "${p.tagline}": Geist 400, ${vertical ? 40 : 36}px, ${p.taglineColor}, 16px below.`,
      `Name fades up 28px with 8px blur over ${s(tl.name[0])}–${s(tl.name[1])}; tagline follows at ${s(tl.tag[0])}–${s(tl.tag[1])}.`,
      `Ease ${p.ease} ${bezierText(p.ease)}. Hold the final lockup to the end.`,
    ].join("\n");
  },
});
