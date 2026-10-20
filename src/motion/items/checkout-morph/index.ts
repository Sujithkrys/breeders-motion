import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { BTN, CLICK_AT, CheckoutMorph, MORPH_AT, SPIN_AT, type CheckoutMorphProps } from "./CheckoutMorph";

const palettes = [
  { name: "Coral", swatch: ["#F6F1EA", "#FF5A36", "#1FA971"], values: { background: "#F6F1EA", button: "#FF5A36", buttonText: "#FFFFFF", success: "#1FA971", text: "#1A1512" } },
  { name: "Plum", swatch: ["#0F0A12", "#B04BFF", "#2ED18A"], values: { background: "#0F0A12", button: "#B04BFF", buttonText: "#FFFFFF", success: "#2ED18A", text: "#F4EEF8" } },
  { name: "Lime", swatch: ["#0B0F0A", "#E2FF5C", "#2FD39A"], values: { background: "#0B0F0A", button: "#E2FF5C", buttonText: "#0B1206", success: "#2FD39A", text: "#EEF3EA" } },
  { name: "Cobalt", swatch: ["#080B18", "#4F6BFF", "#22C55E"], values: { background: "#080B18", button: "#4F6BFF", buttonText: "#FFFFFF", success: "#22C55E", text: "#EEF0FA" } },
  { name: "Ink", swatch: ["#F4F4F2", "#111113", "#16A34A"], values: { background: "#F4F4F2", button: "#111113", buttonText: "#FFFFFF", success: "#16A34A", text: "#111113" } },
];

export default defineMotion<CheckoutMorphProps>({
  slug: "checkout-morph",
  name: "Checkout Morph",
  description: "A pay button is clicked, morphs into a spinner, then lands on a success check with a confirmation line.",
  category: "ui",
  tags: ["checkout", "payment", "button", "morph", "success"],
  addedAt: "2026-09-12",
  durationInFrames: 170,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: CheckoutMorph,
  defaultProps: {
    ...palettes[0].values,
    label: "Pay $49",
    done: "Payment complete",
    detail: "Receipt sent to your inbox",
    spin: 36,
    ease: "enter",
  } as CheckoutMorphProps,
  palettes,
  controls: [
    { type: "text", key: "label", label: "Button", maxLength: 16 },
    { type: "text", key: "done", label: "Success line", maxLength: 28 },
    { type: "text", key: "detail", label: "Detail", maxLength: 40 },
    { type: "color", key: "button", label: "Button" },
    { type: "color", key: "success", label: "Success" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "spin", label: "Spinner time", min: 24, max: 48, step: 2, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const ok = SPIN_AT + p.spin;
    return [
      targetLine(c.target, "a pay button that morphs into a spinner and then a success check", c.width, c.height, c.seconds),
      `Background ${p.background}. Font Geist. Centred column with a 64px gap; the whole thing rises 24px and fades in over 0.5s.`,
      `Button: ${BTN.w}×${BTN.h} pill, vertical gradient of ${p.button} (88% → 100%), 1.5px inner top highlight, soft ${p.button} shadow (56px blur). Content: a lock icon and "${p.label}" at 44px weight 600, -0.03em, ${p.buttonText}.`,
      `A black arrow cursor with a white outline glides in from the lower right and clicks at ${secs(CLICK_AT, c.fps)}: the button presses to 0.95 and back over 0.33s.`,
      `At ${secs(MORPH_AT, c.fps)} the label fades and shrinks while the pill narrows to a ${BTN.h}px circle over 0.6s (ease ${p.ease} ${bezierText(p.ease)}). A 60px spinner fades in: 22px-radius ring at 25% ${p.buttonText} with a round-capped arc rotating 12°/frame.`,
      `At ${secs(ok, c.fps)} the circle crossfades to ${p.success}, pops to 1.1× and back, the spinner fades, and a ${p.buttonText} check stroke draws on over 0.4s. A 3px ${p.success} ring expands to 1.9× and fades.`,
      `Then "${p.done}" (52px, weight 650, -0.04em, ${p.text}) and "${p.detail}" (28px, 55%) rise 22px and fade in below. Hold to the end.`,
    ].join("\n");
  },
});
