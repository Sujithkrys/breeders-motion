import { EASE_OPTIONS, RADIUS, STROKE, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { AgentStateOrb, CHIP_INSET, CLICKS, CONTROL_H, GEO, MORPH, ORDER, REST_AT, REST_FROM, captionsFor, type AgentStateOrbProps } from "./AgentStateOrb";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  line: t.line,
  fill: t.fill,
  ink: t.ink,
  ink2: t.ink2,
  ink3: t.ink3,
  accent: t.accent,
  error: t.error,
}));

export default defineMotion<AgentStateOrbProps>({
  slug: "agent-state-orb",
  name: "Agent State Orb",
  description: "A dot-matrix orb above a segmented control; a cursor clicks through six agent states and the orb changes its pattern and motion for each.",
  category: "ui",
  tags: ["ai", "agent", "orb", "segmented-control", "states", "loop"],
  addedAt: "2026-10-20",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: AgentStateOrb,
  defaultProps: {
    ...palettes[0].values,
    state1: "Standby",
    state2: "Thinking",
    state3: "Building",
    state4: "Generating",
    state5: "Waiting",
    state6: "Error",
    ease: "travel",
  } as AgentStateOrbProps,
  palettes,
  controls: [
    { type: "text", key: "state1", label: "State 1 (rest)", maxLength: 12 },
    { type: "text", key: "state2", label: "State 2", maxLength: 12 },
    { type: "text", key: "state3", label: "State 3", maxLength: 12 },
    { type: "text", key: "state4", label: "State 4", maxLength: 12 },
    { type: "text", key: "state5", label: "State 5", maxLength: 12 },
    { type: "text", key: "state6", label: "State 6 (error)", maxLength: 12 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Canvas" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const g = GEO[ratio];
    const labels = [p.state1, p.state2, p.state3, p.state4, p.state5, p.state6];
    const caps = captionsFor(labels);
    const clicks = CLICKS.map((f, k) => `"${labels[ORDER[k]]}" at frame ${f}`).join(", ");
    return [
      targetLine(c.target, `an AI agent's state orb: a dot-matrix sphere above a ${labels.length}-option segmented control that a cursor clicks through`, c.width, c.height, c.seconds),
      `Canvas ${p.background}, flat, no gradients or glows. Sizes are px at 1080 on the short side. Inter only: segment labels ${g.font}px/500, caption ${g.caption}px/400, -0.01em tracking, sentence case.`,
      `Orb: a ${g.orb}px circle filled ${p.card} with a 1px ${p.line} border and shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06) (none on a dark canvas). Inside, 700 Fibonacci-sphere dots drawn as SVG circles inside 84% of the radius, tilted -22° on x and turning one full revolution per loop (linear). Hide back-facing dots; front dots are larger and darker.`,
      `Dot colour is a grey ramp from ${p.ink3} to ${p.ink} by intensity × depth, batched into 5 SVG paths, plus 2 accent paths in ${p.accent}. Dot radius 1.1–3.2% of the orb radius, growing with intensity.`,
      `States: ${labels[0]} — quiet dots with a slow wave; ${labels[1]} — a bright accent band sweeps round on a tilted great circle; ${labels[2]} — rows fill from the bottom up, a bright edge rising every 36 frames; ${labels[3]} — stripes flow down with accent highlights on the brightest; ${labels[4]} — calm, even, with a ${STROKE.ring}px ${p.accent} ring 16–22px outside the orb breathing on a 45-frame sine; ${labels[5]} — every dot tints to ${p.error} and the orb shakes ±9px, decaying over ~20 frames.`,
      `Caption 40px below the orb, centred in ${p.ink2}: ${caps.map((s) => `"${s}"`).join(", ")}; captions swap with a 6px blur crossfade and an 8px rise.`,
      `Segmented control 60px below: a ${CONTROL_H}px-tall ${p.fill} pill (radius ${RADIUS.hero}px), slots sized to their labels (${g.pad}px side padding). The active slot gets a ${p.card} chip ${CONTROL_H - 2 * CHIP_INSET}px tall (radius ${RADIUS.card}px, 1px ${p.line} border, 0 1px 2px rgba(0,0,0,.06)); active label ${p.ink}, others ${p.ink2}.`,
      `Timeline at 30fps: starts on "${labels[0]}". A black arrow cursor (30px, ${p.background} outline) clicks ${clicks}. Each click: cursor scales to 0.88 for 8 frames, then the chip slides and resizes to the new slot and the orb morphs between the two states over ${MORPH} frames.`,
      `Cursor glides between slots on ${bezierText("travel")} with a slight bow; from frame ${REST_FROM} it returns to its rest point below the control, still by frame ${REST_AT}. The last 12 frames hold on "${labels[0]}" while the orb keeps turning.`,
      `Chip slide and state morph use ${p.ease} ${bezierText(p.ease)}. Loop ${c.seconds}s, seamless.`,
    ].join("\n");
  },
});
