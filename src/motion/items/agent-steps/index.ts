import { EASE_OPTIONS, RADIUS, STROKE, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { AgentSteps, CARD_W, ENTER, FIRST_STEP, ROW, stepsTimeline, type AgentStepsProps } from "./AgentSteps";

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
    ease: "enter",
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
    const { allDone, chipAt } = stepsTimeline(S);
    return [
      targetLine(c.target, "an AI agent task card that completes its steps one by one", c.width, c.height, c.seconds),
      `Background: flat ${p.background}, no gradient or glow. One accent, ${p.accent}, used only on the active spinner arc and the "Working" dot; ${p.success} only for the "Done" dot.`,
      `Type: Inter throughout. Title "${p.task}" 36px weight 500, -0.025em, ${p.ink}. Mono label "AGENT TASK" in Geist Mono 18px, +0.12em, ${p.ink3}. Step labels 30px weight 400: pending ${p.ink3}, done ${p.ink2}. Durations (1.4s, 2.1s, 0.9s, 3.2s) in Geist Mono 22px ${p.ink3}. Result "${p.result}" 26px weight 500.`,
      `Card: ${CARD_W.wide}px wide at 16:9 (${CARD_W.narrow} in 9:16 and 1:1), padding 56 (48 narrow), radius ${RADIUS.card}, fill ${p.card}, 1px ${p.line} border, shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06) (none on a dark canvas).`,
      `Header: 64px icon tile (radius ${RADIUS.button}, fill ${p.fill}, ${p.ink2} target icon), then the label and title, and on the right a 48px pill (fill ${p.fill}, 22px weight 500 ${p.ink2}) reading "Working" that crossfades to "Done". A ${STROKE.hair}px ${p.line} divider sits below.`,
      `Four ${ROW}px rows: "${p.step1}", "${p.step2}", "${p.step3}", "${p.step4}". Icons are 44px: a spinner (17px radius, ${STROKE.ring}px ${p.line} track, ${p.accent} round-capped arc, rotating 12°/frame, linear) that becomes a filled ${p.ink} circle with a ${STROKE.ring}px ${p.card} check. A ${STROKE.hair}px ${p.line} connector between icons fills with ${p.ink3}.`,
      `Result chip: radius ${RADIUS.button}, fill ${p.fill}, padding 20/24, ${p.ink2} file icon and ${p.ink3} arrow, all strokes ${STROKE.ring}px.`,
      `Motion: frames 0–${ENTER} the card fades in and rises 24px (${p.ease}, ${bezierText(p.ease)}).`,
      `Step n (0–3) fades in and rises 16px over 18 frames from frame ${FIRST_STEP} + n × ${S}. While active, its label shimmers: a ${p.ink} copy revealed by a moving mask band over the ${p.ink3} label.`,
      `${S - 6} frames after it starts, the spinner turns into the check over 12 frames: travel ${bezierText("travel")} for the crossfade and check draw, ${bezierText("spring")} for the scale 0.6 → 1. The duration fades in, and the connector fills on travel.`,
      `Frame ${allDone}: "Working" crossfades to "Done" over 12 frames (travel). Frame ${chipAt}–${chipAt + 20}: the result chip fades in and rises 16px (${p.ease}).`,
      `Hold the finished card still to frame ${c.seconds * c.fps} (${secs(c.seconds * c.fps - chipAt - 20, c.fps)} of hold, at least the final 12 frames).`,
    ].join("\n");
  },
});
