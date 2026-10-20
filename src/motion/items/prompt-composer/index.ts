import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { PromptComposer, TYPE_AT, composerTimeline, type PromptComposerProps } from "./PromptComposer";

const palettes = [
  { name: "Lavender", swatch: ["#EEEBF5", "#7C4DFF", "#1B1726"], values: { background: "#EEEBF5", surface: "#FFFFFF", accent: "#7C4DFF", text: "#1B1726" } },
  { name: "Tangerine", swatch: ["#110C08", "#FF8A3D", "#F7F0E8"], values: { background: "#110C08", surface: "#1B1510", accent: "#FF8A3D", text: "#F7F0E8" } },
  { name: "Jade", swatch: ["#07110E", "#21C89A", "#E9F4F0"], values: { background: "#07110E", surface: "#0F1B17", accent: "#21C89A", text: "#E9F4F0" } },
  { name: "Rose", swatch: ["#F7ECEE", "#E0336B", "#2A1419"], values: { background: "#F7ECEE", surface: "#FFFFFF", accent: "#E0336B", text: "#2A1419" } },
  { name: "Night", swatch: ["#0A0E16", "#5EA8FF", "#EAF0FA"], values: { background: "#0A0E16", surface: "#121826", accent: "#5EA8FF", text: "#EAF0FA" } },
];

export default defineMotion<PromptComposerProps>({
  slug: "prompt-composer",
  name: "Prompt Composer",
  description: "An AI prompt box types out a request, its send button pulses and is pressed, and a shimmering response skeleton slides in below.",
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
    ease: "smooth",
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
    const cps = Math.round(p.prompt.length / Math.max((typeEnd - TYPE_AT) / c.fps, 0.1));
    return [
      targetLine(c.target, "an AI prompt composer that types a request, sends it, and shows a loading response", c.width, c.height, c.seconds),
      `Background ${p.background}. Font Geist. Composer 1120px wide (900 in 9:16 and 1:1), padding 36/36/28, radius 40, fill ${p.surface}, 1.5px border of ${p.text} at 9%, large soft shadow. It rises 28px and scales 0.97 → 1 over 0.5s.`,
      `Text area: 36px, line-height 1.4, -0.015em, ${p.text}, two lines tall. Before typing it shows a ${p.accent} caret (3.5px wide, 1.15em) and the placeholder "${p.placeholder}" at 38%; the caret blinks every 0.5s when idle and stays solid while typing.`,
      `From ${secs(TYPE_AT, c.fps)} to ${secs(typeEnd, c.fps)} type "${p.prompt}" at ${cps} characters per second (linear), caret following the last character.`,
      `Toolbar: 64px round "+" button with a 14% border, a 64px ${p.accent}-tinted pill (12% fill) with a globe icon and "${p.mode}" at 24px, and on the right a 72px round send button. It turns ${p.accent} when typing starts, with an up-arrow in ${p.surface}.`,
      `When typing ends the send button breathes (scale up to 1.06) while a 3px ${p.accent} ring expands to 1.7× and fades over 0.5s. At ${secs(press, c.fps)} it is pressed (scale 1 → 0.86 → 1 over 0.4s), the arrow becomes a rounded stop square, and the prompt text dims to 60%.`,
      `At ${secs(reply, c.fps)} a response skeleton slides in 44px below, rising 20px, while the whole stack shifts up to stay centred: a 48px ${p.accent} gradient avatar that gently pulses, and four 22px bars (92%, 100%, 84%, 58% wide, 20px gap) in ${p.text} at 8%, staggered 4 frames. A 45%-wide ${p.accent} shimmer band at 35% sweeps across each bar, offset per bar so it reads diagonal.`,
      `Ease ${p.ease} ${bezierText(p.ease)}. Hold the loading state to the end.`,
    ].join("\n");
  },
});
