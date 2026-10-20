import { CANVAS, EASE_OPTIONS, RADIUS, STROKE, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { CARD_H, CARD_W, PILL_H, PillToCard, SCALE, T, isDark, pillWidth, type PillToCardProps } from "./PillToCard";

// The card is the `button` surface (black; white on Ink), so its text greys come from the opposite canvas.
const palettes = systemPalettes((t) => {
  const onInk = t.bg === CANVAS.ink.bg;
  const opp = onInk ? CANVAS.paper : CANVAS.ink;
  return {
    background: t.bg,
    button: t.button,
    onButton: t.onButton,
    sub: opp.ink2,
    faint: opp.ink3,
    cardLine: opp.line,
    ink: t.ink,
    success: t.success,
    accent: t.accent,
  };
});

export default defineMotion<PillToCardProps>({
  slug: "pill-to-card",
  name: "Pill to Card",
  description: "A small \"Track my flight\" pill opens into a flight card with a live route arc, then folds back into the pill.",
  category: "ui",
  tags: ["morph", "pill", "card", "flight", "cursor"],
  addedAt: "2026-10-20",
  durationInFrames: 150,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: PillToCard,
  defaultProps: {
    ...palettes[0].values,
    label: "Track my flight",
    from: "NYC",
    to: "LON",
    eta: "Landing in 24 min",
    duration: "1h 30min",
    flown: 62,
    ease: "spring",
  } as PillToCardProps,
  palettes,
  controls: [
    { type: "text", key: "label", label: "Pill label", maxLength: 22 },
    { type: "text", key: "from", label: "From", maxLength: 3 },
    { type: "text", key: "to", label: "To", maxLength: 3 },
    { type: "text", key: "eta", label: "Status line", maxLength: 22 },
    { type: "color", key: "background", label: "Canvas" },
    { type: "color", key: "accent", label: "Route" },
    { type: "number", key: "flown", label: "Route flown", min: 20, max: 85, step: 1, unit: "%" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const k = SCALE[ratio];
    const px = (n: number) => `${Math.round(n * k)}px`;
    const s = (f: number) => secs(f, c.fps);
    const canvasDark = isDark(p.background);
    const flown = Math.min(85, Math.max(20, Number(p.flown) || 62));
    return [
      targetLine(c.target, `a "${p.label}" pill that morphs into a flight-status card and folds back`, c.width, c.height, c.seconds),
      `Canvas ${p.background}, nothing else on it. Sizes are px at 1080 on the short side. Inter (400/500, sentence case); Geist Mono only for the tiny flight-number labels, in capitals with +0.1em tracking. No gradients or glows.`,
      `Pill: ${px(pillWidth(p.label))} × ${px(PILL_H)}, ${p.button}, radius ${RADIUS.hero}px${canvasDark ? "" : ", shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)"}, label "${p.label}" ${px(15)}/500 ${p.onButton}, centred in the frame.`,
      `Card (same element, same radius): ${px(CARD_W)} × ${px(CARD_H)}. Header "${p.label}" top-left and a ${px(26)} round close button (${p.cardLine}, × in ${p.sub}). Row: "MI765" and "SKYFLY" mono ${px(10.5)} ${p.faint}, "Sky Wing" ${px(12)} ${p.sub} centred.`,
      `Route: "${p.from}" left and "${p.to}" right, ${px(40)}/500, -0.04em, ${p.onButton}, with "3:30 pm" / "5:00 pm" ${px(12)} ${p.sub} below. Between them a quadratic arc: dashed ${STROKE.hair}px ${p.faint} for the whole route, a solid ${STROKE.ring}px ${p.accent} stroke over the flown part (the only accent), a filled origin dot, a ringed destination dot, and a small plane glyph riding the arc's tangent. "Direct flight" ${px(11)} ${p.faint} under it.`,
      `Footer below a 1px ${p.cardLine} rule: "On time" ${px(12)}/500 in ${p.success} with a dot, then "${p.eta}" ${px(16)}/500; right-aligned "Duration" ${p.faint} over "${p.duration}" ${px(16)}/500.`,
      `${s(T.mv1A)}–${s(T.mv1B)}: an arrow cursor glides to the pill (travel ${bezierText("travel")}) and clicks at ${s(T.click1)} (pill scales to 0.96). ${s(T.openA)}–${s(T.openB)}: the pill grows from its centre into the card (${p.ease} ${bezierText(p.ease)}); the label slides from centred to the header position and stays sharp.`,
      `From ${s(T.contentA)} the card's four rows come into focus top to bottom, staggered 3 frames, each over ${T.contentLen} frames on enter ${bezierText("enter")}: opacity 0→1 and blur ${px(5)}→0. ${s(T.arcA)}–${s(T.arcB)}: the accent stroke draws along the arc to ${flown}% (stroke-dashoffset) with the plane riding its tip.`,
      `${s(T.mv2A)}–${s(T.click2)}: the cursor clicks the close button. Contents blur out over 12 frames on exit ${bezierText("exit")}, then ${s(T.closeA)}–${s(T.closeB)} the card shrinks back into the pill while the cursor returns to its start. Hold the last 12 frames; the ${c.seconds}s loop is seamless.`,
    ].join("\n");
  },
});
