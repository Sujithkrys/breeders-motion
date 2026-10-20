import { EASE_OPTIONS, FINAL_HOLD, RADIUS, STAGGER, STROKE, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { AmountReceipt, CHIP_TEXT, DATE_TEXT, T, W, fitSize, isDark, layoutFor, type AmountReceiptProps } from "./AmountReceipt";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  line: t.line,
  fill: t.fill,
  ink: t.ink,
  ink2: t.ink2,
  button: t.button,
  onButton: t.onButton,
  accent: t.accent,
  onAccent: t.onAccent,
}));

const ratioOf = (w: number, h: number): Ratio => (w === h ? "1:1" : w > h ? "16:9" : "9:16");

export default defineMotion<AmountReceiptProps>({
  slug: "amount-receipt",
  name: "Amount → Receipt",
  description: "A cursor presses Send and the payment amount travels into the headline of the receipt that unfolds around it.",
  category: "ui",
  tags: ["fintech", "payment", "receipt", "morph", "cursor"],
  addedAt: "2026-10-20",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: AmountReceipt,
  defaultProps: {
    ...palettes[0].values,
    recipient: "Maya Chen",
    initials: "MC",
    currency: "$",
    amount: "3,000.00",
    note: "Studio rent, October",
    buttonLabel: "Send",
    reference: "TXN-8F3K-29QD",
    ease: "enter",
  } as AmountReceiptProps,
  palettes,
  controls: [
    { type: "text", key: "recipient", label: "Recipient", maxLength: 22 },
    { type: "text", key: "initials", label: "Initials", maxLength: 2 },
    { type: "text", key: "currency", label: "Currency", maxLength: 2 },
    { type: "text", key: "amount", label: "Amount", maxLength: 12 },
    { type: "text", key: "note", label: "Note", maxLength: 26 },
    { type: "text", key: "buttonLabel", label: "Button", maxLength: 14 },
    { type: "text", key: "reference", label: "Reference ID", maxLength: 16 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Background" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const { S, R, sheet, receipt } = layoutFor(ratioOf(c.width, c.height));
    const dark = isDark(p.background);
    const amount = `${p.currency}${p.amount}`;
    const sSize = Math.round(fitSize(amount, S.amount.size, S.amount.maxW));
    const rSize = Math.round(fitSize(amount, R.amount.size, R.amount.maxW));
    const M = (n: number) => T.morph + n;
    const B = (n: number) => T.back + n;
    const end = c.seconds * c.fps;
    return [
      targetLine(c.target, "a payment sheet whose amount morphs into the headline of its own receipt", c.width, c.height, c.seconds),
      `Background: flat ${p.background}. One ${p.card} card, radius ${RADIUS.hero}, 1px ${p.line} border${dark ? ", no shadow on this dark canvas" : ", shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)"}. Fields, chip, close button and avatar in ${p.fill}; ${STROKE.hair}px ${p.line} dividers. No gradients, glows or blur.`,
      `Accent ${p.accent} only on the receipt's check circle (${STROKE.ring}px ${p.onAccent} check). The pill button is ${p.button} with ${p.onButton} text.`,
      `Type: Inter; the reference in Geist Mono. Text ${p.ink}, secondary ${p.ink2}. The amount "${amount}" is weight 400, -0.045em, tabular: ${sSize}px centred on the sheet, ${rSize}px left-aligned as the receipt headline. Titles, names and buttons weight 500; the Total value weight 600.`,
      `Sheet ${S.w}×${S.h}px (at 1080 on the short side), padding ${S.p}: "Send money" (${sheet.header.size}px) with a ${sheet.header.close}px round close button; a ${S.avatar.d}px avatar "${p.initials}" with a "To" label and "${p.recipient}" (${S.name.size}px); a divider; the amount; a "${CHIP_TEXT}" pill; a note field (radius ${RADIUS.button}) holding "${p.note}"; a full-width ${S.button.h}px pill button "${p.buttonLabel}".`,
      `Receipt ${R.w}×${R.h}px: ${receipt.split !== null ? `two columns split by a vertical divider at ${receipt.split}px; left: ` : ""}a ${receipt.check.d}px check circle, "Sent" (${receipt.sent.size}px) and "Just now"; the avatar (${R.avatar.d}px) and name (${R.name.size}px); the amount headline;${receipt.split !== null ? ` a "Share receipt" pill at the bottom; right: "Details" and` : ""} ${receipt.rows.rh}px rows with dividers: Date "${DATE_TEXT}", Reference "${p.reference}", Note "${p.note}", Fee "${p.currency}0.00", Total "${amount}"${receipt.split !== null ? "" : `; a full-width "Share receipt" pill with a share icon`}.`,
      "",
      `Frames ${T.cursorFrom}–${T.press}: a ${p.ink} arrow cursor (${STROKE.hair}px ${p.card} outline) glides from under the button to it on a slight arc on travel, ${bezierText("travel")}. Frame ${T.press}: it presses; the button scales to 0.965 over 3 frames and back over 6.`,
      `Frames ${M(W.out[0])}–${M(W.out[1])}: sheet-only parts fade out and rise 8px on exit, ${bezierText("exit")}. Frames ${M(W.card[0])}–${M(W.card[1])}: the card resizes to the receipt and the amount travels to the headline spot, scaling ×${(rSize / sSize).toFixed(2)} with its anchor sliding from centre to left; avatar, name (${M(W.who[0])}–${M(W.who[1])}) and the note text (${M(W.note[0])}–${M(W.note[1])}, into the Note row) travel too. Ease: ${p.ease}, ${bezierText(p.ease)}.`,
      `Frames ${M(W.sendLabel[0])}–${M(W.shareLabel[1])}: "${p.buttonLabel}" rises out (exit) and "Share receipt" rises in (enter, ${bezierText("enter")}) as the button reshapes.`,
      `Receipt parts enter on enter over 18 frames, fading in and rising 14px: check circle from scale 0.6 (${M(W.check[0])}–${M(W.check[1])}, stroke drawing on ${M(W.draw[0])}–${M(W.draw[1])}), "Sent" and the header (${M(W.head[0])}–${M(W.head[1])}), rows ${STAGGER} frames apart from frame ${M(W.row(0)[0])}.`,
      `Hold the receipt. From frame ${T.back} fold back, last in first out: rows, header and check leave over 14 frames on exit, the anchors travel home (${B(W.card[0])}–${B(W.card[1])}), and the sheet parts and "${p.buttonLabel}" return over 18 frames on enter, done by frame ${B(W.out[3])}. The cursor fades back in at its rest spot (frames ${T.cursorIn[0]}–${T.cursorIn[1]}).`,
      `Frames ${end - FINAL_HOLD}–${end}: hold the sheet still, so the loop is seamless.`,
    ].join("\n");
  },
});
