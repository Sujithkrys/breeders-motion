import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { FIRST_DIGIT, OtpCode, codeOf, type OtpCodeProps } from "./OtpCode";

const palettes = [
  { name: "Sky", swatch: ["#06101C", "#4CA7FF", "#3DDC97"], values: { background: "#06101C", card: "#0E1A2B", ink: "#EEF5FF", accent: "#4CA7FF", success: "#3DDC97" } },
  { name: "Amber", swatch: ["#FAF5EC", "#E8930C", "#16A34A"], values: { background: "#FAF5EC", card: "#FFFFFF", ink: "#1E1A12", accent: "#E8930C", success: "#16A34A" } },
  { name: "Magenta", swatch: ["#12060F", "#F0479B", "#4ADE80"], values: { background: "#12060F", card: "#1F0F1B", ink: "#FFEEF8", accent: "#F0479B", success: "#4ADE80" } },
  { name: "Mint", swatch: ["#07120E", "#34D399", "#D9F99D"], values: { background: "#07120E", card: "#10201A", ink: "#EAFFF4", accent: "#34D399", success: "#BEF264" } },
  { name: "Graphite", swatch: ["#0B0B0C", "#D4D4D8", "#4ADE80"], values: { background: "#0B0B0C", card: "#18181B", ink: "#F4F4F5", accent: "#D4D4D8", success: "#4ADE80" } },
];

export default defineMotion<OtpCodeProps>({
  slug: "otp-code",
  name: "OTP Code",
  description: "Six verification boxes fill one by one behind a gliding caret, then pulse green and confirm Verified.",
  category: "ui",
  tags: ["otp", "verification", "input", "auth", "success"],
  addedAt: "2026-09-14",
  durationInFrames: 165,
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
    { type: "color", key: "success", label: "Success" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "speed", label: "Frames per digit", min: 4, max: 10, step: 1, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const done = (FIRST_DIGIT + 6 * p.speed + 4) / c.fps;
    return [
      targetLine(c.target, "a six-digit verification code input that fills in and confirms", c.width, c.height, c.seconds),
      `Background ${p.background}. Card ${p.card}, radius 44, padding 56px, 1.5px ${p.ink} border at 8%, deep soft shadow. Font Geist; digits in Geist Mono 60px weight 500.`,
      `Header: a 72px rounded tile (${p.accent} at 14%) with a ${p.accent} padlock line icon, "${p.title}" at 40px weight 650 (-0.035em), and "We sent a 6-digit code to •••• 2048" at 22px, ${p.ink} at 56%.`,
      `Six 108×132 boxes, radius 24, 16px apart, split 3 + 3 by a small dash. Empty boxes: ${p.ink} at 3.5% fill with a 1.5px ${p.ink} ring at 14%.`,
      `Below: "Didn’t get it? Resend in 0:24" with the link in ${p.accent}.`,
      "",
      `0–0.67s: the card fades up 30px from 97%. A 3×60px ${p.accent} caret blinks in box 1.`,
      `From ${secs(FIRST_DIGIT, c.fps)}, the digits "${codeOf(p.code)}" land one every ${secs(p.speed, c.fps)}: each pops up 16px from 60% scale with a bouncy ease, and the caret glides to the next box over 5 frames (${p.ease} ${bezierText(p.ease)}). The focused box gets a 2.5px ${p.accent} ring and a 5px ${p.accent} halo at 18%.`,
      `At ${done.toFixed(1)}s: every ring turns ${p.success}, digits tint to ${p.success}, the card gains a faint ${p.success} glow, and the boxes pulse to 106% and back left to right, 3 frames apart. No shaking.`,
      `Then the resend line cross-fades to a ${p.success} check circle (the tick draws on) and "Verified" at 28px weight 600. Hold to ${c.seconds}s.`,
    ].join("\n");
  },
});
