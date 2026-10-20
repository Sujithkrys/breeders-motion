import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { PanelWipe, WIPE_DUR, WIPE_START, asDir, type PanelWipeProps } from "./PanelWipe";

const palettes = [
  {
    name: "Ember",
    swatch: ["#FFC24B", "#FF7A3D", "#E5384F"],
    values: { background: "#15110E", inkA: "#F6EEE3", panel1: "#FFC24B", panel2: "#FF7A3D", panel3: "#E5384F", sceneB: "#FFF3E4", inkB: "#1C130D" },
  },
  {
    name: "Lagoon",
    swatch: ["#9FF2CF", "#2CC8A6", "#0F7C78"],
    values: { background: "#062320", inkA: "#DDFBF1", panel1: "#9FF2CF", panel2: "#2CC8A6", panel3: "#0F7C78", sceneB: "#E9FFF6", inkB: "#062320" },
  },
  {
    name: "Orchid",
    swatch: ["#F9A8D4", "#D946EF", "#7C3AED"],
    values: { background: "#160A1F", inkA: "#F6E9FF", panel1: "#F9A8D4", panel2: "#D946EF", panel3: "#7C3AED", sceneB: "#FDF2FF", inkB: "#2A0B38" },
  },
  {
    name: "Paper",
    swatch: ["#F5F1EA", "#FFD166", "#FF6B4A", "#1F1D1A"],
    values: { background: "#F5F1EA", inkA: "#1F1D1A", panel1: "#FFD166", panel2: "#FF6B4A", panel3: "#1F1D1A", sceneB: "#1F1D1A", inkB: "#F5F1EA" },
  },
  {
    name: "Indigo",
    swatch: ["#A5B4FC", "#6366F1", "#3730A3"],
    values: { background: "#0B0D1C", inkA: "#E7E9FF", panel1: "#A5B4FC", panel2: "#6366F1", panel3: "#3730A3", sceneB: "#EEF0FF", inkB: "#12143A" },
  },
  {
    name: "Graphite",
    swatch: ["#C9C9CE", "#6B6B73", "#0E0E10"],
    values: { background: "#0E0E10", inkA: "#F2F2F0", panel1: "#3A3A40", panel2: "#6B6B73", panel3: "#C9C9CE", sceneB: "#F2F2F0", inkB: "#0E0E10" },
  },
];

const DIR_WORDS: Record<string, string> = { right: "left to right", left: "right to left", down: "top to bottom", up: "bottom to top" };

export default defineMotion<PanelWipeProps>({
  slug: "panel-wipe",
  name: "Panel Wipe",
  description: "Three coloured panels sweep across in a staggered wave and hand off to the next title card.",
  category: "transitions",
  tags: ["wipe", "panels", "scene", "title", "stagger"],
  addedAt: "2026-09-18",
  durationInFrames: 90,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: PanelWipe,
  defaultProps: {
    ...palettes[0].values,
    titleA: "Plan",
    titleB: "Launch",
    direction: "right",
    stagger: 4,
    skew: 12,
    ease: "travel",
  } as PanelWipeProps,
  palettes,
  controls: [
    { type: "text", key: "titleA", label: "Scene A title", maxLength: 28 },
    { type: "text", key: "titleB", label: "Scene B title", maxLength: 28 },
    { type: "color", key: "background", label: "Scene A" },
    { type: "color", key: "sceneB", label: "Scene B" },
    {
      type: "select",
      key: "direction",
      label: "Direction",
      options: [
        { label: "Left to right", value: "right" },
        { label: "Right to left", value: "left" },
        { label: "Top to bottom", value: "down" },
        { label: "Bottom to top", value: "up" },
      ],
    },
    { type: "number", key: "stagger", label: "Stagger", min: 2, max: 8, step: 1, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const done = WIPE_START + 3 * p.stagger + WIPE_DUR;
    return [
      targetLine(c.target, "a staggered three-panel wipe from one title card to the next", c.width, c.height, c.seconds),
      `Scene A: solid ${p.background} with the title "${p.titleA}" in ${p.inkA}. Scene B: solid ${p.sceneB} with "${p.titleB}" in ${p.inkB}.`,
      "Titles: Geist weight 650, 168px (128px in 9:16), -0.04em tracking, line-height 1.02, centred, max width 84%.",
      "",
      `Four full-frame wipes travel ${DIR_WORDS[asDir(p.direction)]}: panels ${p.panel1}, ${p.panel2}, ${p.panel3}, then Scene B. Each later wipe is drawn on top, so the panels read as bands chasing each other.`,
      `Each wipe is a clip-path polygon with a leading edge slanted ${p.skew}°, crossing the whole frame in ${WIPE_DUR} frames (${secs(WIPE_DUR, c.fps)}).`,
      `The first wipe starts at frame ${WIPE_START}; each next one starts ${p.stagger} frames later. Ease ${p.ease} ${bezierText(p.ease)}.`,
      "Scene A's title drifts 70px in the travel direction as the first panel passes; Scene B's title arrives from 70px behind and settles at centre.",
      `Scene B is fully on by frame ${done} (${secs(done, c.fps)}); hold it to the end.`,
    ].join("\n");
  },
});
