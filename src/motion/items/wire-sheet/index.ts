import { EASE_OPTIONS, STROKE, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { CAM, HALF_Z, K1, K2, MIN_SWELL, PITCH, WORLD_H, WireSheet, YAW, clampP, rowsFor, type WireSheetProps } from "./WireSheet";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  line: t.line,
  fill: t.fill,
  ink: t.ink,
  ink2: t.ink2,
  ink3: t.ink3,
  accent: t.accent,
}));

const deg = (r: number) => Math.round((r * 180) / Math.PI);

export default defineMotion<WireSheetProps>({
  slug: "wire-sheet",
  name: "Wire Sheet",
  description: "A hairline wireframe sheet rolls with travelling sine waves in perspective while a tiny mono readout tracks the wave height.",
  category: "backgrounds",
  tags: ["wireframe", "mesh", "wave", "background", "loop"],
  addedAt: "2026-10-20",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: WireSheet,
  defaultProps: {
    ...palettes[0].values,
    label: "Wave height",
    waveHeight: 0.42,
    cycles: 2,
    density: 22,
    crest: true,
    ease: "travel",
  } as WireSheetProps,
  palettes,
  controls: [
    { type: "text", key: "label", label: "Readout label", maxLength: 20 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Background" },
    { type: "toggle", key: "crest", label: "Accent crest line" },
    { type: "number", key: "waveHeight", label: "Wave height", min: 0.1, max: 0.8, step: 0.02 },
    { type: "number", key: "cycles", label: "Waves per loop", min: 1, max: 4, step: 1 },
    { type: "number", key: "density", label: "Grid columns", min: 12, max: 30, step: 1 },
    { type: "select", key: "ease", label: "Swell easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const { amp, cycles, cols } = clampP(p);
    const rows = rowsFor(cols);
    return [
      targetLine(c.target, "a seamless background of a wireframe sheet rippling with sine waves, seen in perspective, with a tiny wave-height readout", c.width, c.height, c.seconds),
      `Background ${p.background}, flat; nothing else on the canvas. Draw everything in one SVG of polylines, no fills, no shading, no glow.`,
      `Sheet: x from −1 to 1, z from −${HALF_Z} to ${HALF_Z}, as a grid of ${cols} lines along z and ${rows} lines along x (sample rows at 64 points and columns at 28 so curves stay smooth). Height y = ${WORLD_H}·H·(0.72·sin(2π(${K1.x}x + ${K1.z}z) − φ1) + 0.28·sin(2π(${K2.x}x + ${K2.z}z) + φ2)).`,
      `Camera: yaw ${deg(YAW)}°, pitch ${deg(PITCH)}° down, perspective with the camera ${CAM} units away (scale = ${CAM} / (${CAM} + depth)). Frame the sheet from its tallest bounding box so the scale never changes: about 74% of the width at 16:9 (86% at 9:16), at most 66% of the height, centred 24px above the middle.`,
      `Lines: ${STROKE.hair}px ${p.ink}, interior at 18% opacity and the four edges at 30%, each fading a further 30% with depth.${p.crest ? ` One crest line along x at z = 0 in ${p.accent}, ${STROKE.ring}px, the only accent.` : ""}`,
      `Readout, 72px below the sheet, centred: Geist Mono 18px/400, tabular numerals: "${p.label}" in ${p.ink3}, 14px gap, then the live value H in ${p.ink2} with two decimals (peaks at ${amp.toFixed(2)}).`,
      `Motion (linear time, seamless at ${c.seconds}s): φ1 = 2π·${cycles}·t/T (the main wave travels across ${cycles} whole times), φ2 = 2π·t/T. The wave height H = ${amp.toFixed(2)}·(${MIN_SWELL} + ${1 - MIN_SWELL}·ease(tri)), where tri rises 0→1 over the first half and falls back over the second, eased ${p.ease} ${bezierText(p.ease)}; so the sheet swells to full height mid-loop and calms back to ${(amp * MIN_SWELL).toFixed(2)} at the seam.`,
    ].join("\n");
  },
});
