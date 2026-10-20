import { EASE_OPTIONS, RADIUS, STAGGER, STROKE, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { PLANS, PT, PricingCards, isDark, yearlyPrice, type PricingCardsProps } from "./PricingCards";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  line: t.line,
  fill: t.fill,
  ink: t.ink,
  ink2: t.ink2,
  ink3: t.ink3,
  button: t.button,
  onButton: t.onButton,
  accent: t.accent,
  onAccent: t.onAccent,
}));

export default defineMotion<PricingCardsProps>({
  slug: "pricing-cards",
  name: "Pricing Cards",
  description: "Three pricing tiers rise in, the popular plan is ringed in the accent, and a Monthly/Yearly toggle rolls every price to its yearly value.",
  category: "ui",
  tags: ["pricing", "saas", "toggle", "cards", "numbers"],
  addedAt: "2026-10-06",
  durationInFrames: 150,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: PricingCards,
  defaultProps: {
    ...palettes[0].values,
    badge: "Popular",
    discount: 20,
    rise: 32,
    ease: "enter",
  } as PricingCardsProps,
  palettes,
  controls: [
    { type: "text", key: "badge", label: "Badge", maxLength: 16 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "discount", label: "Yearly discount", min: 10, max: 40, step: 5, unit: "%" },
    { type: "number", key: "rise", label: "Rise", min: 16, max: 40, step: 4, unit: "px" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const tiers = PLANS.map((pl) => `${pl.name} ("${pl.blurb}") $${pl.price} → $${yearlyPrice(pl.price, p.discount)}`).join(", ");
    const dark = isDark(p.background);
    const end = c.seconds * c.fps;
    const last = PT.roll + 2 * STAGGER + 2 + PT.rollLen;
    return [
      targetLine(c.target, "three pricing cards with a Monthly/Yearly toggle that rolls the prices", c.width, c.height, c.seconds),
      `Background: flat ${p.background}. Cards ${p.card} with a 1px ${p.line} border${dark ? ", no shadow on this dark canvas" : " and shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)"}. No gradients or glows.`,
      `Type: Inter only. Plan name 32px weight 500 (-0.02em) in ${p.ink}; blurb 22px weight 400 in ${p.ink2}; price "$" 44px weight 400 in ${p.ink2}, digits 92px weight 500 (-0.045em, tabular) in ${p.ink}, "/mo" 24px in ${p.ink3}; caption 20px in ${p.ink3}; features 21px in ${p.ink2}; buttons 22px weight 500.`,
      `Tiers left to right: ${tiers} per month. Each card is 400px wide, 40px padding: name, blurb, price, caption, a 64px button, a ${STROKE.hair}px ${p.line} divider and three feature rows with 28px ${p.fill} check circles (${STROKE.ring}px check in ${p.ink}).`,
      `Accent ${p.accent} only on the popular (middle) card: a ${STROKE.ring}px ${p.accent} border, scale 1.03, a "${p.badge}" pill (${p.accent}, ${p.onAccent} text, weight 500) centred on its top edge, its checks, and its "save $X" figure. Its button is ${p.button} with ${p.onButton} text; the others are ${p.fill} with ${p.ink} text.`,
      `Above the cards, a pill toggle: ${p.fill} track with a 1px ${p.line} border, two 190×62px segments, a sliding ${p.card} knob. "Monthly"/"Yearly" 24px weight 500; the active label is ${p.ink}, the other ${p.ink2}. A "−${Math.round(p.discount)}%" chip in ${p.accent} on 12% ${p.accent}.`,
      `Geometry: cards radius ${RADIUS.card}, buttons radius ${RADIUS.button}, chips radius ${RADIUS.chip}, toggle and badge fully round. On 9:16, the cards become 880×200 rows stacked vertically.`,
      "",
      `Frames ${PT.toggle[0]}–${PT.toggle[1]}: the toggle fades up 16px. From frame ${PT.card}, each card fades in and rises ${Math.round(p.rise)}px over ${PT.cardLen} frames, ${STAGGER} frames apart. Ease: ${p.ease}, ${bezierText(p.ease)}.`,
      `Frames ${PT.badge[0]}–${PT.badge[1]}: the badge fades in and scales from 0.8 on spring, ${bezierText("spring")}.`,
      `Frames ${PT.flip[0]}–${PT.flip[1]}: the knob slides to "Yearly" on travel, ${bezierText("travel")}. From frame ${PT.roll}, each changed digit rolls up in its own clipped slot over ${PT.rollLen} frames (2 frames between digits, ${STAGGER} between cards), and "Billed monthly" swaps to "Billed yearly · save $X", all on travel.`,
      `Everything has settled by frame ${last}. Hold the yearly state still to frame ${end}.`,
    ].join("\n");
  },
});
