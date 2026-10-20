import { EASE_OPTIONS, FINAL_HOLD, RADIUS, STROKE, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { CARD, EndCard, elementStart, sizesFor, type EndCardProps } from "./EndCard";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  ink: t.ink,
  ink3: t.ink3,
  accent: t.accent,
  onAccent: t.onAccent,
  button: t.button,
  onButton: t.onButton,
}));

const DURATION = 120;

export default defineMotion<EndCardProps>({
  slug: "end-card",
  name: "Launch End Card",
  description: "A calm end card that stages in an accent mark, the brand name, the URL and a black call-to-action pill.",
  category: "logo",
  tags: ["logo", "end-card", "cta", "outro", "launch"],
  addedAt: "2026-10-15",
  durationInFrames: DURATION,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: EndCard,
  defaultProps: {
    ...palettes[0].values,
    monogram: "L",
    name: "Lumen",
    url: "lumen.app",
    cta: "Get early access",
    rise: 24,
    ease: "enter",
  } as EndCardProps,
  palettes,
  controls: [
    { type: "text", key: "monogram", label: "Monogram", maxLength: 2 },
    { type: "text", key: "name", label: "Brand name", maxLength: 14 },
    { type: "text", key: "url", label: "URL", maxLength: 28 },
    { type: "text", key: "cta", label: "Button", maxLength: 22 },
    { type: "color", key: "accent", label: "Mark" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "rise", label: "Rise", min: 12, max: 40, step: 4, unit: "px" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const u = Math.min(c.width, c.height) / 1080;
    const vertical = c.height > c.width;
    const S = sizesFor(p, c.width, c.height, u);
    const r = (n: number) => Math.round(n / u);
    const end = elementStart(3) + CARD.enter;
    const B = CARD.button;
    return [
      targetLine(c.target, `a calm launch end card for "${p.name}": an accent mark, the name, the URL and a "${p.cta}" button, staged in`, c.width, c.height, c.seconds),
      `Background: flat ${p.background}, nothing else. Sizes are px at 1080 on the short side. No gradients, sheens, glows or shadows anywhere.`,
      `Type: brand name "${p.name}" in Inter ${CARD.name.weight}, ${r(S.name)}px, tracking ${CARD.name.tracking}em, ${p.ink}. URL "${p.url}" in Geist Mono 400, ${r(S.url)}px, +0.02em, ${p.ink3}. Button label "${p.cta}" in Inter 500, ${B.font}px, ${p.onButton}.`,
      `Geometry, one centred column: a ${r(S.mark)}×${r(S.mark)}px mark, radius ${RADIUS.card}px, flat ${p.accent}, with the monogram "${p.monogram}" in Inter 600, -0.04em, ${p.onAccent}, at ${p.monogram.length > 1 ? 40 : 50}% of the tile; the name ${vertical ? 56 : 48}px below; the URL 14px below that; then, ${vertical ? 72 : 56}px lower, a ${B.h}px pill button (radius 999) in ${p.button}, padding ${B.padL}px left / ${B.padR}px right, a ${B.icon}px right arrow drawn with a ${STROKE.ring}px round-capped stroke in ${p.onButton}, 14px after the label.`,
      "",
      `Motion: four entrances ${CARD.gap} frames apart from frame ${CARD.start}, each ${CARD.enter} frames on ${p.ease} ${bezierText(p.ease)}:`,
      `- the mark scales 0.88 → 1 and fades in (frames ${elementStart(0)}–${elementStart(0) + CARD.enter});`,
      `- the name, the URL and the button each rise ${p.rise}px and fade in (from frames ${elementStart(1)}, ${elementStart(2)} and ${elementStart(3)}).`,
      `Everything has landed by frame ${end}. Frames ${CARD.nudge[0]}–${CARD.nudge[1]}: the arrow nudges 6px right and back on travel ${bezierText("travel")}.`,
      `Then hold the finished card perfectly still to frame ${DURATION} (at least the last ${FINAL_HOLD} frames).`,
    ].join("\n");
  },
});
