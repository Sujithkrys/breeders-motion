import { EASE_OPTIONS, RADIUS, STAGGER, STROKE, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { BARS, COMPOSER_W, ENTER, PromptComposer, TYPE_AT, composerTimeline, type PromptComposerProps } from "./PromptComposer";

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
}));

export default defineMotion<PromptComposerProps>({
  slug: "prompt-composer",
  name: "Prompt Composer",
  description: "An AI prompt box types out a request, its send button is pressed, and a quiet response skeleton slides in below.",
  category: "ui",
  tags: ["ai", "prompt", "input", "typing", "chat"],
  addedAt: "2026-10-19",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: PromptComposer,
  defaultProps: {
    ...palettes[0].values,
    prompt: "Draft a launch post for our budgeting app. Upbeat, clear, under 80 words.",
    placeholder: "Ask anything",
    mode: "Write",
    speed: 40,
    ease: "enter",
  } as PromptComposerProps,
  palettes,
  controls: [
    { type: "text", key: "prompt", label: "Prompt", maxLength: 110 },
    { type: "text", key: "placeholder", label: "Placeholder", maxLength: 30 },
    { type: "text", key: "mode", label: "Mode chip", maxLength: 16 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "speed", label: "Typing speed", min: 14, max: 60, step: 1, unit: "cps" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const { typeEnd, press, reply } = composerTimeline(p.prompt.length, p.speed, c.fps);
    const end = Math.round(typeEnd);
    const cps = Math.round(p.prompt.length / Math.max((typeEnd - TYPE_AT) / c.fps, 0.1));
    return [
      targetLine(c.target, "an AI prompt composer that types a request, sends it, and shows a loading response", c.width, c.height, c.seconds),
      `Background: flat ${p.background}, no gradient or glow. One accent, ${p.accent}, used only on the caret and the small response dot.`,
      `Type: Inter. Prompt text 36px weight 400, line-height 1.4, -0.015em, ${p.ink}; placeholder "${p.placeholder}" in ${p.ink3}. Mode chip "${p.mode}" 24px weight 500 ${p.ink2}.`,
      `Composer card: ${COMPOSER_W.wide}px wide at 16:9 (${COMPOSER_W.narrow} in 9:16 and 1:1), padding 36/36/28, radius ${RADIUS.card}, fill ${p.card}, 1px ${p.line} border, shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06) (none on a dark canvas). Text area is two lines tall.`,
      `Toolbar: a 64px round "+" button with a 1px ${p.line} border and ${STROKE.ring}px ${p.ink2} icon; a 64px pill chip (fill ${p.fill}) with a ${STROKE.hair}px globe icon; on the right a 72px round send button, ${p.fill} with a ${p.ink3} arrow, which crossfades to ${p.button} with a ${p.onButton} arrow when typing starts.`,
      `Caret: ${STROKE.ring}px × 1.15em ${p.accent} pill. It blinks every 15 frames while idle and stays solid while typing.`,
      `Motion: frames 0–${ENTER} the composer fades in and rises 24px (${p.ease}, ${bezierText(p.ease)}).`,
      `Frames ${TYPE_AT}–${end}: type "${p.prompt}" at ${cps} characters per second (linear), caret following. The send button turns ${p.button} over frames ${TYPE_AT}–${TYPE_AT + 8} (travel ${bezierText("travel")}).`,
      `Frames ${end}–${end + 16}: the send button breathes to 1.04 and back (travel). Frame ${press}: it presses 1 → 0.9 → 1 over 12 frames; the arrow crossfades to a 22px ${p.onButton} stop square (radius ${RADIUS.chip}) and the prompt text dims to 55% over 12 frames (travel).`,
      `Frame ${reply}–${reply + 20}: a response skeleton fades in and rises 20px, 44px below the card, while the whole stack shifts up to stay centred (${p.ease}). It has a 48px ${p.fill} avatar with a 16px ${p.accent} dot that gently pulses, and four 22px pill bars (${BARS.join("%, ")}% wide, 20px gap) in ${p.line}, each growing from 60% width over 18 frames, ${STAGGER} frames apart.`,
      `The bars breathe in opacity (50–100%) in a slow wave offset per bar; no shimmer gradients. Hold the loading state; only the bar wave and dot pulse keep moving through the final 12 frames.`,
    ].join("\n");
  },
});
