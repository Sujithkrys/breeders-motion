import { EASE_OPTIONS, RADIUS, STAGGER, STROKE, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { CodeVerify, G, PILL_W, digitsOf, timeline, type CodeVerifyProps } from "./CodeVerify";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  line: t.line,
  fill: t.fill,
  ink: t.ink,
  ink2: t.ink2,
  ink3: t.ink3,
  accent: t.accent,
  success: t.success,
  onSuccess: t.onAccent,
}));

export default defineMotion<CodeVerifyProps>({
  slug: "code-verify",
  name: "Code Verify",
  description: "A six-digit code fills a white pill digit by digit behind a travelling focus ring, then the slots close up and a success check confirms it.",
  category: "ui",
  tags: ["verification", "code", "input", "auth", "success"],
  addedAt: "2026-10-20",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: CodeVerify,
  defaultProps: {
    ...palettes[0].values,
    title: "Enter the code we sent you",
    subtitle: "Six digits, sent to your email",
    code: "482913",
    verified: "Verified",
    pace: 8,
    ease: "enter",
  } as CodeVerifyProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title", maxLength: 36 },
    { type: "text", key: "subtitle", label: "Subtitle", maxLength: 44 },
    { type: "text", key: "code", label: "Code (6 digits)", maxLength: 6 },
    { type: "text", key: "verified", label: "Verified label", maxLength: 20 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "pace", label: "Frames per digit", min: 6, max: 12, step: 1, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const t = timeline(p.pace);
    const f = (n: number) => `f${Math.round(n)}`;
    return [
      targetLine(c.target, "a six-digit verification code that types into one white pill, then verifies", c.width, c.height, c.seconds),
      `Background ${p.background}, flat, no gradient or glow. Sizes are px at 1080 on the short side; scale the group down to 90% of the width on 1:1 and 9:16. Everything is one centred column.`,
      `Type: Inter only, sentence case. Title "${p.title}" ${G.title}px/400, -0.015em, ${p.ink}. Subtitle "${p.subtitle}" ${G.subtitle}px/400 ${p.ink2}, 12px below. Digits Inter ${G.digit}px/600, tabular numerals, -0.02em, ${p.ink}.`,
      `Pill, 56px below the subtitle: ${PILL_W}×${G.slotH + 2 * G.pad}px, ${p.card}, radius ${RADIUS.hero}px, ${STROKE.hair}px ${p.line} border, shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06) (none on a dark canvas). Inside, ${G.pad}px padding and six ${G.slotW}×${G.slotH}px slots, radius ${RADIUS.card}px, fill ${p.fill}, ${G.gap}px apart.`,
      `Focus: a ${STROKE.ring}px ${p.accent} inset ring on the active slot with a ${STROKE.ring}×${G.caretH}px ${p.accent} caret that blinks on a 32-frame cosine. The accent appears nowhere else.`,
      `f0–20: title rises 24px and fades in; subtitle ${STAGGER} frames later; the pill at f${2 * STAGGER}–${2 * STAGGER + 22}, rising 32px. Ease ${p.ease} ${bezierText(p.ease)}.`,
      `${f(t.first)}–${f(t.last + 18)}: the digits "${digitsOf(p.code).join("")}" land one every ${t.pace} frames (${secs(t.pace, c.fps)}): each fades in while dropping 36px into place over 18 frames. As each digit lands the ring travels to the next slot over 8 frames on travel ${bezierText("travel")}.`,
      `${f(t.ringOutA)}–${f(t.ringOutB)}: the ring exits (exit curve). ${f(t.verifyA)}: a 28px spinner (${STROKE.ring}px ${p.line} track, ${p.ink2} 28% arc, 12°/frame) fades in 40px below the pill.`,
      `${f(t.verifiedA)}–${f(t.settleB)}: the slots settle on travel: their ${p.fill} fills fade out and the ${G.gap}px gaps close to 0, the digits slide left together into one number, and a ${G.check}px area opens at the right so the pill keeps its width. A ${G.badge}px ${p.success} circle scales in from 0.6 there and its ${p.onSuccess} check draws on (${STROKE.bar}px stroke at 64px, round caps).`,
      `The spinner exits over 12 frames and "${p.verified}" (${G.status}px/500, ${p.ink}) rises 12px into its place. Hold the verified state still to ${c.seconds}s (the last 12 frames do not move).`,
    ].join("\n");
  },
});
