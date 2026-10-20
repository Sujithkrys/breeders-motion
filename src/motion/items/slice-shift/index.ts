import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { SEAM, SHIFT_DUR, SHIFT_START, SliceShift, type SliceShiftProps } from "./SliceShift";

const palettes = [
  {
    name: "Teal",
    swatch: ["#071C1B", "#19C3B0", "#8FF5E4"],
    values: { background: "#071C1B", inkA: "#D3FBF3", sceneB: "#19C3B0", inkB: "#03201D", accent: "#8FF5E4" },
  },
  {
    name: "Tangerine",
    swatch: ["#1A0F06", "#FF8A2A", "#FFD3A8"],
    values: { background: "#1A0F06", inkA: "#FFE8D2", sceneB: "#FF8A2A", inkB: "#1F0C00", accent: "#FFD3A8" },
  },
  {
    name: "Rose",
    swatch: ["#1C0A12", "#FF5C8A", "#FFC2D3"],
    values: { background: "#1C0A12", inkA: "#FFE3EC", sceneB: "#FF5C8A", inkB: "#24040F", accent: "#FFC2D3" },
  },
  {
    name: "Cream",
    swatch: ["#F7F3EA", "#1B1A17", "#E2B43B"],
    values: { background: "#F7F3EA", inkA: "#1B1A17", sceneB: "#1B1A17", inkB: "#F7F3EA", accent: "#E2B43B" },
  },
  {
    name: "Cobalt",
    swatch: ["#070C1E", "#3D6BFF", "#A9BEFF"],
    values: { background: "#070C1E", inkA: "#DCE4FF", sceneB: "#3D6BFF", inkB: "#FFFFFF", accent: "#A9BEFF" },
  },
];

export default defineMotion<SliceShiftProps>({
  slug: "slice-shift",
  name: "Slice Shift",
  description: "Horizontal slices slide in alternating directions, one after another, swapping one title card for the next.",
  category: "transitions",
  tags: ["slices", "shift", "scene", "title", "stagger"],
  addedAt: "2026-09-26",
  durationInFrames: 75,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: SliceShift,
  defaultProps: {
    ...palettes[0].values,
    titleA: "Before",
    titleB: "After",
    slices: 6,
    stagger: 1.5,
    ease: "snappy",
  } as SliceShiftProps,
  palettes,
  controls: [
    { type: "text", key: "titleA", label: "Scene A title", maxLength: 28 },
    { type: "text", key: "titleB", label: "Scene B title", maxLength: 28 },
    { type: "color", key: "background", label: "Scene A" },
    { type: "color", key: "sceneB", label: "Scene B" },
    { type: "number", key: "slices", label: "Slices", min: 4, max: 10, step: 1 },
    { type: "number", key: "stagger", label: "Offset", min: 0.5, max: 2.5, step: 0.5, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const n = Math.round(p.slices);
    const end = SHIFT_START + (n - 1) * p.stagger + SHIFT_DUR;
    return [
      targetLine(c.target, "a sliced push transition from one title card to the next", c.width, c.height, c.seconds),
      `Scene A: solid ${p.background} with the title "${p.titleA}" in ${p.inkA}. Scene B: solid ${p.sceneB} with "${p.titleB}" in ${p.inkB}.`,
      "Titles: Geist weight 650, 168px (128px in 9:16), -0.04em tracking, line-height 1.02, centred, 8% side padding.",
      "",
      `Cut the frame into ${n} equal horizontal slices (overflow hidden). Each slice holds full-frame copies of both scenes, offset up so the slices line up.`,
      `Inside each slice Scene A slides out by one full frame width while Scene B pushes in right behind it. Slice 1 moves left, slice 2 right, and so on, alternating.`,
      `Slice i starts at frame ${SHIFT_START} + i × ${p.stagger} and takes ${SHIFT_DUR} frames (${secs(SHIFT_DUR, c.fps)}), ease ${p.ease} ${bezierText(p.ease)}.`,
      `A ${SEAM}px ${p.accent} seam rides the joint between the two scenes in each slice while it moves, and disappears when the slice lands.`,
      `The last slice lands at frame ${end} (${secs(end, c.fps)}); hold Scene B to the end.`,
    ].join("\n");
  },
});
