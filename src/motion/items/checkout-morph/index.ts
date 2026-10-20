import { EASE_OPTIONS, RADIUS, STROKE, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { BTN_H, CARD, CLICK_AT, CheckoutMorph, ENTER, MORPH, MORPH_AT, SPIN_AT, checkoutTimeline, type CheckoutMorphProps } from "./CheckoutMorph";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  line: t.line,
  ink: t.ink,
  ink2: t.ink2,
  ink3: t.ink3,
  button: t.button,
  onButton: t.onButton,
  accent: t.accent,
  success: t.success,
  onSuccess: t.onAccent,
}));

export default defineMotion<CheckoutMorphProps>({
  slug: "checkout-morph",
  name: "Checkout Morph",
  description: "A pay button is clicked, morphs into a spinner, then lands on a success check with a confirmation line.",
  category: "ui",
  tags: ["checkout", "payment", "button", "morph", "success"],
  addedAt: "2026-09-12",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: CheckoutMorph,
  defaultProps: {
    ...palettes[0].values,
    item: "Breeders Pro, annual",
    price: "$49.00",
    label: "Pay $49",
    done: "Payment complete",
    detail: "Receipt sent to your inbox",
    spin: 36,
    ease: "enter",
  } as CheckoutMorphProps,
  palettes,
  controls: [
    { type: "text", key: "item", label: "Item", maxLength: 32 },
    { type: "text", key: "price", label: "Price", maxLength: 12 },
    { type: "text", key: "label", label: "Button", maxLength: 16 },
    { type: "text", key: "done", label: "Success line", maxLength: 28 },
    { type: "text", key: "detail", label: "Detail", maxLength: 40 },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "spin", label: "Spinner time", min: 24, max: 48, step: 2, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const { ok, lineAt } = checkoutTimeline(p.spin);
    return [
      targetLine(c.target, "a checkout card whose pay button morphs into a spinner and then a success check", c.width, c.height, c.seconds),
      `Background: flat ${p.background}, no gradient or glow. One accent, ${p.accent}, used only on the spinner arc; ${p.success} only for the success state.`,
      `Type: Inter. Geist Mono label "ORDER SUMMARY" 18px, +0.12em, ${p.ink3}. Rows at 30px, -0.015em: "${p.item}" and "${p.price}" in ${p.ink2}; "Total" weight 500 and "${p.price}" weight 600 in ${p.ink}. Button label "${p.label}" 32px weight 500 in ${p.onButton}. Below the card, "${p.done}" 34px weight 500, -0.025em, ${p.ink} and "${p.detail}" 24px ${p.ink2}.`,
      `Card: ${CARD.wide}px wide at 16:9 (${CARD.narrow} in 9:16 and 1:1), padding ${CARD.pad}, radius ${RADIUS.card}, fill ${p.card}, 1px ${p.line} border, shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06) (none on a dark canvas). A ${STROKE.hair}px ${p.line} divider sits between the item and total rows.`,
      `Pay button: full card width, ${BTN_H}px tall, pill, flat ${p.button}, with a ${STROKE.ring}px lock icon. No gradient, highlight or coloured shadow.`,
      `Motion: frames 0–${ENTER} the card fades in and rises 24px (${p.ease}, ${bezierText(p.ease)}).`,
      `Frames 6–${CLICK_AT - 2}: a ${p.ink} arrow cursor with a ${p.card} outline glides in from the lower right (travel ${bezierText("travel")}). Frame ${CLICK_AT}: click; the button presses 1 → 0.97 → 1 over 10 frames.`,
      `Frame ${MORPH_AT}: the label fades and shrinks to 0.9 over 12 frames (exit ${bezierText("exit")}) while the pill narrows to a ${BTN_H}px circle over ${MORPH} frames (${p.ease}). The cursor fades out over 12 frames (exit).`,
      `Frame ${SPIN_AT}–${SPIN_AT + 18}: a 52px spinner fades in (enter ${bezierText("enter")}): 20px radius, ${STROKE.ring}px ${p.onButton} track at 25% and a ${p.accent} round-capped arc rotating 12°/frame (linear).`,
      `Frame ${ok}: the circle crossfades to ${p.success} over 12 frames (travel) and pops 1 → 1.04 → 1; a ${STROKE.bar}px ${p.onSuccess} check draws on over 18 frames (enter); a ${STROKE.ring}px ${p.success} ring at 30% expands to 1.6× and fades.`,
      `Frame ${lineAt}–${lineAt + 20}: the success lines fade in and rise 16px, 48px below the card, while the stack shifts up to stay centred (${p.ease}). Hold completely still to the end.`,
    ].join("\n");
  },
});
