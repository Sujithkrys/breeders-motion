import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { FLIP_DUR, FLIP_START, GridFlip, PERSPECTIVE, gridSize, type GridFlipProps } from "./GridFlip";

const palettes = [
  {
    name: "Violet",
    swatch: ["#1C1631", "#8E63FF", "#E9E3FF"],
    values: { background: "#07060C", sceneA: "#1C1631", inkA: "#E9E3FF", sceneB: "#8E63FF", inkB: "#FFFFFF" },
  },
  {
    name: "Citrus",
    swatch: ["#26210E", "#FFC93C", "#FFF6D8"],
    values: { background: "#0C0A05", sceneA: "#26210E", inkA: "#FFF6D8", sceneB: "#FFC93C", inkB: "#1D1604" },
  },
  {
    name: "Jade",
    swatch: ["#0E2A22", "#3DD9A0", "#D7F7EA"],
    values: { background: "#04100C", sceneA: "#0E2A22", inkA: "#D7F7EA", sceneB: "#3DD9A0", inkB: "#04140E" },
  },
  {
    name: "Blush",
    swatch: ["#FFF7F2", "#FF8FA3", "#2A1A1F"],
    values: { background: "#E9E2DC", sceneA: "#FFF7F2", inkA: "#2A1A1F", sceneB: "#FF8FA3", inkB: "#2A0C14" },
  },
  {
    name: "Mono",
    swatch: ["#1A1A1C", "#F2F2F0", "#050505"],
    values: { background: "#050505", sceneA: "#1A1A1C", inkA: "#EDEDED", sceneB: "#F2F2F0", inkB: "#111113" },
  },
];

export default defineMotion<GridFlipProps>({
  slug: "grid-flip",
  name: "Grid Flip",
  description: "The frame splits into tiles that flip over in a diagonal wave to show the next title card.",
  category: "transitions",
  tags: ["flip", "tiles", "3d", "scene", "title"],
  addedAt: "2026-10-02",
  durationInFrames: 90,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: GridFlip,
  defaultProps: {
    ...palettes[0].values,
    titleA: "Old way",
    titleB: "New way",
    tiles: 4,
    stagger: 2,
    ease: "soft",
  } as GridFlipProps,
  palettes,
  controls: [
    { type: "text", key: "titleA", label: "Scene A title", maxLength: 28 },
    { type: "text", key: "titleB", label: "Scene B title", maxLength: 28 },
    { type: "color", key: "sceneA", label: "Scene A" },
    { type: "color", key: "sceneB", label: "Scene B" },
    { type: "number", key: "tiles", label: "Tiles", min: 3, max: 5, step: 1 },
    { type: "number", key: "stagger", label: "Stagger", min: 1, max: 3, step: 0.5, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const { cols, rows } = gridSize(p.tiles, c.width, c.height);
    const end = FLIP_START + (cols + rows - 2) * p.stagger + FLIP_DUR;
    return [
      targetLine(c.target, "a tile-flip transition from one title card to the next", c.width, c.height, c.seconds),
      `Stage ${p.background} behind everything. Scene A: ${p.sceneA} with the title "${p.titleA}" in ${p.inkA}. Scene B: ${p.sceneB} with "${p.titleB}" in ${p.inkB}.`,
      "Titles: Geist weight 650, 168px (128px in 9:16), -0.04em tracking, line-height 1.02, centred.",
      "",
      `Cut the frame into a ${cols}×${rows} grid. Each tile clips a full-frame copy of the scene, offset so the tiles line up into one picture.`,
      `Each tile turns 180° around its vertical axis (perspective ${PERSPECTIVE}px) over ${FLIP_DUR} frames, ease ${p.ease} ${bezierText(p.ease)}.`,
      `Tile (row, col) starts at frame ${FLIP_START} + (row + col) × ${p.stagger}, so a diagonal wave runs from the top-left corner.`,
      "Draw Scene A's face until the tile passes 90°, then Scene B's face at (angle − 180°); don't rely on backface-visibility.",
      "While turning, each tile scales down by up to 8% and darkens with a black overlay up to 45%, both following |sin(angle)|.",
      `The last tile lands at frame ${end} (${secs(end, c.fps)}); hold Scene B to the end.`,
    ].join("\n");
  },
});
