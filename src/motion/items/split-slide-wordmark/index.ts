import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { CUT, SplitSlideWordmark, timeline, type SplitSlideWordmarkProps } from "./SplitSlideWordmark";

const palettes = [
  { name: "Paper", swatch: ["#F2EEE6", "#151412", "#2F6BFF"], values: { background: "#F2EEE6", ink: "#151412", accent: "#2F6BFF" } },
  { name: "Noir", swatch: ["#0B0B0C", "#F5F5F4", "#FF4D3D"], values: { background: "#0B0B0C", ink: "#F5F5F4", accent: "#FF4D3D" } },
  { name: "Matcha", swatch: ["#0E1410", "#E8F5E0", "#9BE15D"], values: { background: "#0E1410", ink: "#E8F5E0", accent: "#9BE15D" } },
  { name: "Peach", swatch: ["#FFE8DA", "#2B140C", "#E8552B"], values: { background: "#FFE8DA", ink: "#2B140C", accent: "#E8552B" } },
  { name: "Grape", swatch: ["#120A1F", "#F1E9FF", "#C38BFF"], values: { background: "#120A1F", ink: "#F1E9FF", accent: "#C38BFF" } },
];

export default defineMotion<SplitSlideWordmarkProps>({
  slug: "split-slide-wordmark",
  name: "Split Wordmark",
  description: "A big wordmark splits along its middle, the halves slide apart to reveal a tagline, then close back together.",
  category: "logo",
  tags: ["logo", "wordmark", "split", "typography", "reveal"],
  addedAt: "2026-09-08",
  durationInFrames: 150,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: SplitSlideWordmark,
  defaultProps: {
    ...palettes[0].values,
    wordmark: "Helix",
    tagline: "Design at the speed of thought",
    spread: 200,
    ease: "snappy",
  } as SplitSlideWordmarkProps,
  palettes,
  controls: [
    { type: "text", key: "wordmark", label: "Wordmark", maxLength: 12 },
    { type: "text", key: "tagline", label: "Tagline", maxLength: 32 },
    { type: "color", key: "ink", label: "Wordmark" },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "spread", label: "Opening", min: 120, max: 320, step: 10, unit: "px" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const D = Math.round(c.seconds * c.fps);
    const vertical = c.height > c.width;
    const tl = timeline(D);
    const s = (f: number) => secs(f, c.fps);
    return [
      targetLine(c.target, `a wordmark reveal where "${p.wordmark}" splits horizontally, opens to reveal the tagline "${p.tagline}", then closes again`, c.width, c.height, c.seconds),
      `Background ${p.background}. Font Geist only. Everything centred.`,
      "",
      `Wordmark "${p.wordmark}": Geist 700, ${vertical ? 250 : 300}px (shrink to fit 86% of the width), -0.045em tracking, line-height 1.2, ${p.ink}.`,
      `Draw it twice, stacked exactly: the top copy clipped with clip-path inset(0 0 ${100 - CUT}% 0), the bottom with inset(${CUT}% 0 0 0), so the cut runs through the middle of the lowercase letters.`,
      `${s(tl.enter[0])}–${s(tl.enter[1])}: the top half slides in from 110px left and the bottom half from 110px right, from 0 opacity and 12px blur, meeting perfectly aligned.`,
      `${s(tl.line[0])}–${s(tl.line[1])}: a 4px ${p.accent} line with round ends draws across the cut from the centre (scaleX 0 → 1).`,
      `${s(tl.open[0])}–${s(tl.open[1])}: the halves slide apart vertically to a ${p.spread}px opening (±${p.spread / 2}px) as the line fades. The tagline sits in the opening, clipped to it so it is revealed by the halves.`,
      `Tagline: Geist 500, ${vertical ? 46 : 44}px, uppercase, ${p.accent}, shrunk to fit 88% of the width; its tracking tightens 0.4em → 0.24em while it fades in over ${s(tl.tag[0])}–${s(tl.tag[1])}.`,
      `Hold open, then ${s(tl.close[0])}–${s(tl.close[1])}: the halves close back together over the tagline, with a 1.2% scale dip on impact.`,
      `Ease ${p.ease} ${bezierText(p.ease)}. Hold the closed wordmark for the last ${Math.round((1 - tl.close[1] / D) * 100)}%.`,
    ].join("\n");
  },
});
