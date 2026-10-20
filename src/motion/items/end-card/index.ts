import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { EndCard, timeline, type EndCardProps } from "./EndCard";

const palettes = [
  { name: "Rose", swatch: ["#FF4F8B", "#12070B", "#FFF0F5"], values: { background: "#12070B", accent: "#FF4F8B", accentInk: "#FFFFFF", ink: "#FFF0F5", muted: "#9C7A86" } },
  { name: "Saffron", swatch: ["#FFB21E", "#120D03", "#FFF6E3"], values: { background: "#120D03", accent: "#FFB21E", accentInk: "#1A1203", ink: "#FFF6E3", muted: "#9C8A66" } },
  { name: "Pine", swatch: ["#34D399", "#06110C", "#EAFBF2"], values: { background: "#06110C", accent: "#34D399", accentInk: "#04140C", ink: "#EAFBF2", muted: "#7A9A8A" } },
  { name: "Linen", swatch: ["#F7F4EE", "#111111", "#7C776E"], values: { background: "#F7F4EE", accent: "#111111", accentInk: "#F7F4EE", ink: "#111111", muted: "#7C776E" } },
  { name: "Ultra", swatch: ["#8B7CFF", "#0B0A1A", "#F0EEFF"], values: { background: "#0B0A1A", accent: "#8B7CFF", accentInk: "#FFFFFF", ink: "#F0EEFF", muted: "#8A86AE" } },
];

export default defineMotion<EndCardProps>({
  slug: "end-card",
  name: "Launch End Card",
  description: "A premium end card that stages in a mark, brand name, URL and a call-to-action pill with a final sheen.",
  category: "logo",
  tags: ["logo", "end-card", "cta", "outro", "launch"],
  addedAt: "2026-10-15",
  durationInFrames: 120,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: EndCard,
  defaultProps: {
    ...palettes[0].values,
    monogram: "L",
    name: "Lumen",
    url: "lumen.app",
    cta: "Get early access",
    stagger: 7,
    ease: "smooth",
  } as EndCardProps,
  palettes,
  controls: [
    { type: "text", key: "monogram", label: "Monogram", maxLength: 2 },
    { type: "text", key: "name", label: "Brand name", maxLength: 14 },
    { type: "text", key: "url", label: "URL", maxLength: 28 },
    { type: "text", key: "cta", label: "Button", maxLength: 22 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "number", key: "stagger", label: "Stagger", min: 3, max: 12, step: 1, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const D = Math.round(c.seconds * c.fps);
    const vertical = c.height > c.width;
    const tl = timeline(D, p.stagger);
    const M = vertical ? 176 : 150;
    const s = (f: number) => secs(f, c.fps);
    return [
      targetLine(c.target, `a premium launch end card for "${p.name}" with a mark, URL and a "${p.cta}" button, staged in`, c.width, c.height, c.seconds),
      `Background ${p.background} with a soft ${p.accent} radial glow (20% at the centre) behind the top half. Font Geist; URL in Geist Mono.`,
      "",
      "One centred column, top to bottom:",
      `- Mark: ${M}×${M}px rounded square, radius ${Math.round(M * 0.28)}px, ${p.accent} with a 140° white-to-shade sheen, 1.5px inner white rim at 18%, ${p.accent} glow (0 24px 70px, 40%). Monogram "${p.monogram}" in Geist 700, -0.045em, ${p.accentInk}.`,
      `- Name "${p.name}": Geist 650, ${vertical ? 116 : 120}px, -0.04em, ${p.ink}, ${vertical ? 56 : 46}px below the mark.`,
      `- URL "${p.url}": Geist Mono 400, ${vertical ? 36 : 32}px, 0.02em, ${p.muted}, 16px below.`,
      `- Button: 100px tall pill, ${p.accent}, "${p.cta}" in Geist 600 34px ${p.accentInk} with a right arrow icon, padding 48px/40px, soft ${p.accent} shadow, ${vertical ? 72 : 56}px below.`,
      "",
      `Stage them in ${p.stagger} frames apart from ${s(tl.start(0))}, each over ${s(tl.dur)}: the mark from 60% scale, -12° and 10px blur; the name rising 36px with 10px blur; the URL rising 24px; the button rising 30px from 86% scale.`,
      `${s(tl.sheen[0])}–${s(tl.sheen[1])}: one white sheen (skewed -20°) sweeps across the button and the arrow nudges 6px right and back.`,
      `Ease ${p.ease} ${bezierText(p.ease)}. Hold the finished card to the end.`,
    ].join("\n");
  },
});
