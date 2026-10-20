import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { PLANS, PricingCards, yearlyPrice, type PricingCardsProps } from "./PricingCards";

const palettes = [
  { name: "Meadow", swatch: ["#F3F1EA", "#0F9D6B", "#34D399"], values: { background: "#F3F1EA", card: "#FFFFFF", ink: "#15171A", accent: "#0F9D6B", accent2: "#34D399", onAccent: "#FFFFFF" } },
  { name: "Ember", swatch: ["#120D0B", "#FF6A3D", "#FFB547"], values: { background: "#120D0B", card: "#1E1714", ink: "#FFF3EA", accent: "#FF6A3D", accent2: "#FFB547", onAccent: "#1A0E08" } },
  { name: "Iris", swatch: ["#0D0B17", "#7C5CFF", "#C084FC"], values: { background: "#0D0B17", card: "#17142A", ink: "#F1EEFF", accent: "#7C5CFF", accent2: "#C084FC", onAccent: "#FFFFFF" } },
  { name: "Rosewater", swatch: ["#FBEFF1", "#E11D74", "#FB7185"], values: { background: "#FBEFF1", card: "#FFFFFF", ink: "#23131A", accent: "#E11D74", accent2: "#FB7185", onAccent: "#FFFFFF" } },
  { name: "Graphite", swatch: ["#0B0B0C", "#E4E4E7", "#A1A1AA"], values: { background: "#0B0B0C", card: "#18181B", ink: "#F4F4F5", accent: "#E4E4E7", accent2: "#A1A1AA", onAccent: "#0B0B0C" } },
];

export default defineMotion<PricingCardsProps>({
  slug: "pricing-cards",
  name: "Pricing Cards",
  description: "Three pricing tiers rise in, the popular plan glows, and a Monthly/Yearly toggle rolls every price to its yearly value.",
  category: "ui",
  tags: ["pricing", "saas", "toggle", "cards", "numbers"],
  addedAt: "2026-10-06",
  durationInFrames: 165,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: PricingCards,
  defaultProps: {
    ...palettes[0].values,
    badge: "Popular",
    discount: 20,
    stagger: 6,
    ease: "enter",
  } as PricingCardsProps,
  palettes,
  controls: [
    { type: "text", key: "badge", label: "Badge", maxLength: 16 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "discount", label: "Yearly discount", min: 10, max: 40, step: 5, unit: "%" },
    { type: "number", key: "stagger", label: "Stagger", min: 2, max: 12, step: 1, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const tiers = PLANS.map((pl) => `${pl.name} ("${pl.blurb}") $${pl.price} → $${yearlyPrice(pl.price, p.discount)}`).join(", ");
    return [
      targetLine(c.target, "three pricing cards with a Monthly/Yearly toggle that rolls the prices", c.width, c.height, c.seconds),
      `Background ${p.background}, cards ${p.card} with radius 32 and a 1.5px ${p.ink} hairline at 9% opacity. Text ${p.ink}; secondary text the same colour at 56%. Font Geist.`,
      `Tiers left to right: ${tiers} per month. Each card: name 32px weight 600 (-0.03em), blurb 22px, price "$" 44px + digits 92px weight 650 (-0.045em) + "/mo", caption 20px, a 64px CTA button, a divider, and three feature rows with 28px tinted check circles.`,
      `The middle card is highlighted: 2px ${p.accent} border, scale 1.04, a ${p.accent} glow shadow (0 40px 90px at 26%), a gradient ${p.accent} → ${p.accent2} CTA with ${p.onAccent} text, and a "${p.badge}" pill badge centred on its top edge.`,
      `Above the cards, a segmented toggle (two 190×62px segments, sliding ${p.card} knob) reads "Monthly" and "Yearly" with a "−${Math.round(p.discount)}%" ${p.accent} chip. On 9:16, the cards become 880×200 rows stacked vertically.`,
      "",
      `0–0.5s: the toggle fades up 16px. From 0.27s, cards rise 90px and fade in over 0.87s, ${secs(p.stagger, c.fps)} apart; the badge pops in with a bouncy scale.`,
      `2.6s: the knob slides to "Yearly" over 0.47s. From 2.8s, each changed digit rolls up in its own clipped slot (0.53s, 2 frames between digits, 4 frames between cards); "Billed monthly" swaps to "Billed yearly · save $X".`,
      `Ease ${p.ease} ${bezierText(p.ease)}. Hold the yearly state from 3.6s to ${c.seconds}s.`,
    ].join("\n");
  },
});
