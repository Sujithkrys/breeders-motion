import { EASE_OPTIONS, FINAL_HOLD, RADIUS, STAGGER, STROKE, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { CARET_GLIDE, DIGIT_IN, ENTER, FIRST_DIGIT, OtpCode, codeOf, doneFrame, zoomFor, type OtpCodeProps } from "./OtpCode";

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
}));

const DURATION = 150;

export default defineMotion<OtpCodeProps>({
  slug: "otp-code",
  name: "OTP Code",
  description: "Six verification boxes fill one by one behind a gliding caret, then confirm with a Verified state.",
  category: "ui",
  tags: ["otp", "verification", "input", "auth", "success"],
  addedAt: "2026-09-14",
  durationInFrames: DURATION,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: OtpCode,
  defaultProps: {
    ...palettes[0].values,
    title: "Enter verification code",
    code: "482913",
    speed: 7,
    ease: "enter",
  } as OtpCodeProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title", maxLength: 28 },
    { type: "text", key: "code", label: "Code", maxLength: 6 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "speed", label: "Frames per digit", min: 4, max: 10, step: 1, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const k = zoomFor(c.width > c.height);
    const px = (n: number) => Math.round(n * k);
    const done = doneFrame(p.speed);
    return [
      targetLine(c.target, "a six-digit verification code input that fills in and confirms", c.width, c.height, c.seconds),
      `Background: flat ${p.background}. One card: ${p.card} fill, 1px ${p.line} border, radius ${px(RADIUS.card)}, padding ${px(56)}px, shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06) (none on a dark canvas).`,
      `Type: Inter, sentence case, hierarchy by grey. "${p.title}" ${px(40)}px weight 500, -0.035em, ${p.ink}; "We sent a 6-digit code to •••• 2048" ${px(22)}px 400 ${p.ink2}; digits ${px(60)}px weight 500, tabular figures, ${p.ink}; "Didn’t get it?" ${px(22)}px ${p.ink3} with "Resend in 0:24" in ${p.ink} weight 500.`,
      `Geometry: a ${px(72)}px ${p.fill} tile (radius ${px(RADIUS.button)}) with a ${p.ink2} padlock line icon (${STROKE.ring}px stroke). Six ${px(108)}×${px(132)} boxes, radius ${px(RADIUS.button)}, ${px(16)}px apart, split 3 + 3 by a ${px(16)}px ${p.ink3} dash; each box ${p.fill} with a ${STROKE.hair}px ${p.line} inset ring.`,
      `The focused box turns ${p.card} with a ${STROKE.ring}px ${p.accent} inset ring; the caret is ${STROKE.ring}×${px(60)}px ${p.accent}. ${p.accent} is the only accent; ${p.success} appears only in the verified state. No gradients or glows.`,
      `Motion: frames 0–${ENTER} the card fades up ${px(24)}px (${p.ease} ${bezierText(p.ease)}); the caret blinks every 12 frames in box 1.`,
      `From frame ${FIRST_DIGIT} (${secs(FIRST_DIGIT, c.fps)}) the digits "${codeOf(p.code)}" land one every ${p.speed} frames: each fades up 16px over ${DIGIT_IN} frames (enter ${bezierText("enter")}), and the caret and focus ring glide to the next box over ${CARET_GLIDE} frames (travel ${bezierText("travel")}).`,
      `Frame ${done}: every box gains a ${STROKE.ring}px ${p.success} ring over ${DIGIT_IN} frames and the boxes pulse to 104% and back, left to right, ${STAGGER} frames apart (travel). No shaking.`,
      `Frames ${done + 14}–${done + 14 + ENTER}: the resend line cross-fades to a ${p.success} check circle (the ${p.card} tick draws on) and "Verified" 26px weight 500 in ${p.ink}. Frames ${DURATION - FINAL_HOLD}–${DURATION}: completely still.`,
    ].join("\n");
  },
});
