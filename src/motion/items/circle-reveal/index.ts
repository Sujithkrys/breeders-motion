import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { CircleReveal, REVEAL_DUR, REVEAL_START, RING_GAP, type CircleRevealProps } from "./CircleReveal";

const palettes = [
  {
    name: "Lime",
    swatch: ["#0F140C", "#C8F35A", "#E9FFB0"],
    values: { background: "#0F140C", inkA: "#E8F3DC", sceneB: "#C8F35A", inkB: "#10160A", ring: "#E9FFB0" },
  },
  {
    name: "Coral",
    swatch: ["#1A0E0C", "#FF6B57", "#FFC2B4"],
    values: { background: "#1A0E0C", inkA: "#FFE9E2", sceneB: "#FF6B57", inkB: "#1E0B08", ring: "#FFC2B4" },
  },
  {
    name: "Lilac",
    swatch: ["#F4F0FA", "#6D4AFF", "#2A1E3D"],
    values: { background: "#F4F0FA", inkA: "#2A1E3D", sceneB: "#6D4AFF", inkB: "#FFFFFF", ring: "#6D4AFF" },
  },
  {
    name: "Sky",
    swatch: ["#07111F", "#6CB8FF", "#CFE7FF"],
    values: { background: "#07111F", inkA: "#DCEBFF", sceneB: "#6CB8FF", inkB: "#061427", ring: "#CFE7FF" },
  },
  {
    name: "Sand",
    swatch: ["#F3EDE2", "#C7A56A", "#1D1A16"],
    values: { background: "#F3EDE2", inkA: "#2B241B", sceneB: "#1D1A16", inkB: "#F3EDE2", ring: "#C7A56A" },
  },
];

const ORIGIN_WORDS: Record<string, string> = {
  center: "the centre",
  "top-left": "the top-left corner",
  "top-right": "the top-right corner",
  "bottom-left": "the bottom-left corner",
  "bottom-right": "the bottom-right corner",
};

export default defineMotion<CircleRevealProps>({
  slug: "circle-reveal",
  name: "Circle Reveal",
  description: "A circle grows from a point to reveal the next title card, led by a thin ring.",
  category: "transitions",
  tags: ["reveal", "circle", "iris", "scene", "title"],
  addedAt: "2026-10-17",
  durationInFrames: 75,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: CircleReveal,
  defaultProps: {
    ...palettes[0].values,
    titleA: "Lights off",
    titleB: "Lights on",
    origin: "center",
    ringWidth: 3,
    ease: "smooth",
  } as CircleRevealProps,
  palettes,
  controls: [
    { type: "text", key: "titleA", label: "Scene A title", maxLength: 28 },
    { type: "text", key: "titleB", label: "Scene B title", maxLength: 28 },
    { type: "color", key: "background", label: "Scene A" },
    { type: "color", key: "sceneB", label: "Scene B" },
    {
      type: "select",
      key: "origin",
      label: "Origin",
      options: [
        { label: "Center", value: "center" },
        { label: "Top left", value: "top-left" },
        { label: "Top right", value: "top-right" },
        { label: "Bottom left", value: "bottom-left" },
        { label: "Bottom right", value: "bottom-right" },
      ],
    },
    { type: "number", key: "ringWidth", label: "Ring", min: 0, max: 10, step: 1, unit: "px" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const end = REVEAL_START + REVEAL_DUR;
    return [
      targetLine(c.target, "a circular reveal from one title card to the next", c.width, c.height, c.seconds),
      `Scene A: solid ${p.background} with the title "${p.titleA}" in ${p.inkA}. Scene B: solid ${p.sceneB} with "${p.titleB}" in ${p.inkB}.`,
      "Titles: Geist weight 650, 168px (128px in 9:16), -0.04em tracking, line-height 1.02, centred, max width 84%.",
      "",
      `Scene B sits on top, clipped by clip-path: circle(r at origin) where the origin is ${ORIGIN_WORDS[p.origin] ?? "the centre"} of the frame.`,
      `From frame ${REVEAL_START} to ${end} (${secs(REVEAL_START, c.fps)} → ${secs(end, c.fps)}) r grows from 0 past the farthest corner, ease ${p.ease} ${bezierText(p.ease)}.`,
      p.ringWidth > 0
        ? `A ${p.ringWidth}px ${p.ring} ring rides ${RING_GAP}px outside the circle's edge, with a soft ${p.ringWidth * 6}px-wide halo at 12% and a ${p.ringWidth / 2}px echo ring ${Math.round(RING_GAP * 2.8)}px out at 35%. Both fade in over the first 10% of the reveal.`
        : "No ring: the circle's edge is the only line.",
      "As the circle grows, Scene A's title scales 1 → 0.94 and fades to 45%; Scene B's title scales 1.1 → 1.",
      `Scene B fully covers the frame by ${secs(end, c.fps)}; hold it to the end.`,
    ].join("\n");
  },
});
