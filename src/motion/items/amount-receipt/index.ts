import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { AmountReceipt, CHIP_TEXT, DATE_TEXT, T, fitSize, layoutFor, tones, type AmountReceiptProps } from "./AmountReceipt";

const palettes = [
  { name: "Cream", swatch: ["#F5F1E8", "#0E0F12", "#0067FC"], values: { background: "#F5F1E8", card: "#0E0F12", accent: "#0067FC" } },
  { name: "White", swatch: ["#FFFFFF", "#E8E8EC", "#0E0F12"], values: { background: "#FFFFFF", card: "#FFFFFF", accent: "#0E0F12" } },
  { name: "Lime", swatch: ["#E3F79C", "#0E0F12"], values: { background: "#E3F79C", card: "#0E0F12", accent: "#E3F79C" } },
  { name: "Ink", swatch: ["#0E0F12", "#16171A", "#FFFFFF"], values: { background: "#0E0F12", card: "#16171A", accent: "#FFFFFF" } },
];

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
    ease: "smooth",
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
    { type: "color", key: "background", label: "Canvas" },
    { type: "color", key: "card", label: "Card" },
    { type: "color", key: "accent", label: "Accent" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const { S, R, sheet, receipt } = layoutFor(ratioOf(c.width, c.height));
    const t = tones(p.card, p.accent, p.background);
    const amount = `${p.currency}${p.amount}`;
    const sSize = Math.round(fitSize(amount, S.amount.size, S.amount.maxW));
    const rSize = Math.round(fitSize(amount, R.amount.size, R.amount.maxW));
    const edge = t.light ? "1px #E8E8EC hairline and a tiny shadow (0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06))" : t.darkCanvas ? "1px rgba(255,255,255,.07) hairline, no shadow" : "no border, a soft shadow (0 1px 2px rgba(0,0,0,.08), 0 14px 36px rgba(0,0,0,.12))";
    const f = (n: number) => secs(n, c.fps);
    return [
      targetLine(c.target, "a payment sheet whose amount morphs into the headline of its own receipt", c.width, c.height, c.seconds),
      `Canvas ${p.background}. One card in ${p.card}, radius ${S.r}px, ${edge}. Accent ${p.accent} only on the button and the check (${t.onAccent} on it). Text ${t.text}, secondary ${t.sub}, hairlines ${t.hair}, field fills ${t.fill}. Geist 400/500, Geist Mono for the reference. No glows.`,
      `Sheet ${S.w}×${S.h}, padding ${S.p}: "Send money" (${sheet.header.size}px/500) with a ${sheet.header.close}px close button; a ${S.avatar.d}px avatar "${p.initials}" with a "To" label and "${p.recipient}" (${S.name.size}px/500); a hairline; the amount "${amount}" centred at ${sSize}px, weight 500, tracking -0.045em; a "${CHIP_TEXT}" chip; a note field "${p.note}"; a full-width ${S.button.h}px pill button "${p.buttonLabel}".`,
      `Receipt ${R.w}×${R.h}: ${receipt.split !== null ? `two columns split by a vertical hairline at ${receipt.split}px; left: ` : ""}a ${receipt.check.d}px accent circle with a check, "Sent" (${receipt.sent.size}px/500) and "Just now"; the avatar (${R.avatar.d}px) and name (${R.name.size}px); below them the amount as the headline at ${rSize}px, left-aligned;${receipt.split !== null ? "a \"Share receipt\" pill at the bottom; right: \"Details\" and " : ""}rows ${receipt.rows.rh}px tall with hairlines: Date "${DATE_TEXT}", Reference "${p.reference}" (Geist Mono), Note "${p.note}", Fee "${p.currency}0.00", Total "${amount}" (600)${receipt.split !== null ? "" : `; a full-width "Share receipt" pill with a share icon`}.`,
      `0–${f(T.press)}: an arrow cursor glides from under the button to it on a slight arc; at ${f(T.press)} it presses (button scales to 0.965 in 3 frames, back in 6).`,
      `From ${f(T.morph)} one ${f(T.len)} morph, around the card's centre: sheet-only parts fade out with a 6px blur in the first 10 frames; the card resizes from ${S.w}×${S.h} to ${R.w}×${R.h} (frames 2–28).`,
      `The amount never disappears: it travels to the headline spot and scales ×${(rSize / sSize).toFixed(2)} (frames 2–28), its anchor sliding from centre to left. Avatar and name (5–31) and the note text (8–34, into the Note row, right-aligned) travel too.`,
      `The button reshapes into "Share receipt" (4–30); its label swaps like a copy confirmation: "${p.buttonLabel}" rises out, "Share receipt" rises in from below, both through a light blur.`,
      `Receipt parts enter after the anchors start: check circle scales 0.6→1 (12–24) and its stroke draws on (16–30); "Sent" and the details rise 14px from a 6px blur; rows stagger every 3 frames from frame 16.`,
      `Hold the receipt; at ${f(T.back)} run the same windows mirrored (last in, first out) back to the sheet, and fade the cursor back in at its rest spot so the loop is seamless.`,
      `Moves ease ${p.ease} ${bezierText(p.ease)}; fades ease soft ${bezierText("soft")}. All motion frame-driven.`,
    ].join("\n");
  },
});
