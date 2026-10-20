import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { AgentSteps, FIRST_STEP, type AgentStepsProps } from "./AgentSteps";

const palettes = [
  { name: "Amber", swatch: ["#0E0C09", "#FFB224", "#F6F1E7"], values: { background: "#0E0C09", surface: "#17140F", accent: "#FFB224", text: "#F6F1E7" } },
  { name: "Mint", swatch: ["#08110F", "#3DDC97", "#EAF5F0"], values: { background: "#08110F", surface: "#0F1A17", accent: "#3DDC97", text: "#EAF5F0" } },
  { name: "Orchid", swatch: ["#100A14", "#D16BFF", "#F3EEF7"], values: { background: "#100A14", surface: "#1A1220", accent: "#D16BFF", text: "#F3EEF7" } },
  { name: "Paper", swatch: ["#F2EFE9", "#E8590C", "#1A1714"], values: { background: "#F2EFE9", surface: "#FFFFFF", accent: "#E8590C", text: "#1A1714" } },
  { name: "Glacier", swatch: ["#EAF1F7", "#2F7BEA", "#0F1A2A"], values: { background: "#EAF1F7", surface: "#FFFFFF", accent: "#2F7BEA", text: "#0F1A2A" } },
  { name: "Graphite", swatch: ["#0C0C0D", "#E7E7EA", "#5A5A62"], values: { background: "#0C0C0D", surface: "#161618", accent: "#E7E7EA", text: "#F4F4F5" } },
];

export default defineMotion<AgentStepsProps>({
  slug: "agent-steps",
  name: "Agent Steps",
  description: "An AI agent task card works through its steps one by one, each spinner turning into a check, then hands back a result.",
  category: "ui",
  tags: ["ai", "agent", "steps", "progress", "card"],
  addedAt: "2026-10-17",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: AgentSteps,
  defaultProps: {
    ...palettes[0].values,
    task: "Prepare the launch brief",
    step1: "Reading the product spec",
    step2: "Pulling last quarter's metrics",
    step3: "Drafting key messages",
    step4: "Formatting the brief",
    result: "launch-brief.md is ready",
    stagger: 22,
    ease: "smooth",
  } as AgentStepsProps,
  palettes,
  controls: [
    { type: "text", key: "task", label: "Task", maxLength: 34 },
    { type: "text", key: "step1", label: "Step 1", maxLength: 40 },
    { type: "text", key: "step2", label: "Step 2", maxLength: 40 },
    { type: "text", key: "step3", label: "Step 3", maxLength: 40 },
    { type: "text", key: "step4", label: "Step 4", maxLength: 40 },
    { type: "text", key: "result", label: "Result", maxLength: 40 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "stagger", label: "Step time", min: 14, max: 26, step: 1, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const S = p.stagger;
    const allDone = FIRST_STEP + 4 * S - 6;
    return [
      targetLine(c.target, "an AI agent task card that completes its steps one by one", c.width, c.height, c.seconds),
      `Background ${p.background} with a soft ${p.accent} radial glow behind the card. Font Geist; mono labels in Geist Mono.`,
      `Card: 940px wide (880 in 9:16 and 1:1), padding 48, radius 40, fill ${p.surface}, 1.5px border of ${p.text} at 7%, deep soft drop shadow. Rises 30px and scales 0.97 → 1 over the first 0.5s.`,
      `Header: 68px ${p.accent} gradient icon square (radius 20), mono "AGENT TASK" label at 19px/0.14em, title "${p.task}" at 38px weight 600, -0.035em. Right: a ${p.accent} pill reading "Working" with a pulsing dot, which swaps to "Done" when all steps finish.`,
      `Four 78px step rows below a hairline divider: "${p.step1}", "${p.step2}", "${p.step3}", "${p.step4}" at 30px weight 500.`,
      `Step n fades and rises 18px at ${secs(FIRST_STEP, c.fps)} + n × ${secs(S, c.fps)}. While active it shows a 42px spinner (16px radius ring, ${p.accent} arc on a 12% track, rotating 14°/frame) and its label shimmers: dim at 42% with a bright copy revealed by a moving mask band.`,
      `${secs(S - 6, c.fps)} after it starts, the spinner becomes a filled ${p.accent} check circle (scale 0.4 → 1, bouncy ${bezierText("bouncy")}), the check stroke draws on, the label settles at 90%, and a mono duration (1.4s, 2.1s, 0.9s, 3.2s) fades in on the right. A 2px connector line between icons fills with ${p.accent}.`,
      `At ${secs(allDone + 4, c.fps)} a result chip arrives: ${p.accent} at 12% fill with a 35% border, radius 24, file icon, "${p.result}" at 27px, and an arrow. It rises 22px and scales 0.96 → 1.`,
      `Ease ${p.ease} ${bezierText(p.ease)}. Hold the finished card to the end.`,
    ].join("\n");
  },
});
