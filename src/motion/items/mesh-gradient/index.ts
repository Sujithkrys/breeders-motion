import { targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { BLOBS, MeshGradient, type MeshGradientProps } from "./MeshGradient";

const palettes = [
  {
    name: "Peach",
    swatch: ["#FF8A5B", "#FFC56B", "#FF6F91"],
    values: { background: "#FFF2EA", c1: "#FF8A5B", c2: "#FFC56B", c3: "#FF6F91", c4: "#FFD9C7", c5: "#F9A26C", ink: "#2B140A" },
  },
  {
    name: "Lagoon",
    swatch: ["#13C4A3", "#3FD0E0", "#0A3D4A"],
    values: { background: "#04161A", c1: "#13C4A3", c2: "#0E7C86", c3: "#7CF2C4", c4: "#0A3D4A", c5: "#3FD0E0", ink: "#E6FFF8" },
  },
  {
    name: "Nebula",
    swatch: ["#B14DFF", "#FF4FA3", "#5B2EFF"],
    values: { background: "#0B0614", c1: "#B14DFF", c2: "#FF4FA3", c3: "#5B2EFF", c4: "#2A0F4D", c5: "#FF8A65", ink: "#FFFFFF" },
  },
  {
    name: "Lavender",
    swatch: ["#B9A6FF", "#FFC3E1", "#A8D8FF"],
    values: { background: "#F5F2FF", c1: "#B9A6FF", c2: "#FFC3E1", c3: "#A8D8FF", c4: "#E8E1FF", c5: "#CFF5E7", ink: "#231A3D" },
  },
  {
    name: "Ember",
    swatch: ["#FF5A1F", "#FFB13B", "#C21E3A"],
    values: { background: "#120806", c1: "#FF5A1F", c2: "#FFB13B", c3: "#C21E3A", c4: "#3A0E08", c5: "#FF7A4D", ink: "#FFF3EA" },
  },
  {
    name: "Graphite",
    swatch: ["#9A9AA4", "#6E6E78", "#1E1E24"],
    values: { background: "#0D0D0F", c1: "#3A3A42", c2: "#6E6E78", c3: "#1E1E24", c4: "#9A9AA4", c5: "#2A2A31", ink: "#F4F4F5" },
  },
];

export default defineMotion<MeshGradientProps>({
  slug: "mesh-gradient",
  name: "Mesh Gradient",
  description: "Five soft colour blobs drift on looping paths over a fine grain, made to sit behind a title.",
  category: "backgrounds",
  tags: ["gradient", "mesh", "blobs", "grain", "loop"],
  addedAt: "2026-09-08",
  durationInFrames: 180,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: MeshGradient,
  defaultProps: {
    ...palettes[0].values,
    title: "Made to move",
    drift: 18,
    grain: 6,
  } as MeshGradientProps,
  palettes,
  controls: [
    { type: "text", key: "title", label: "Title (blank hides)", maxLength: 32 },
    { type: "color", key: "background", label: "Background" },
    { type: "color", key: "c1", label: "Colour 1" },
    { type: "color", key: "c2", label: "Colour 2" },
    { type: "color", key: "c3", label: "Colour 3" },
    { type: "number", key: "drift", label: "Drift", min: 6, max: 30, step: 2, unit: "%" },
    { type: "number", key: "grain", label: "Grain", min: 0, max: 12, step: 1, unit: "%" },
  ],
  prompt: (p, c) => {
    const colors = [p.c1, p.c2, p.c3, p.c4, p.c5];
    return [
      targetLine(c.target, "a seamless looping mesh-gradient background", c.width, c.height, c.seconds),
      `Background ${p.background}. Draw everything in one full-frame inline SVG (no CSS radial-gradient).`,
      "",
      "Five circles, each filled with its own SVG radialGradient: colour at 95% opacity at the centre, 55% at 45%, 0% at the edge. Normal blending, drawn in this order:",
      ...BLOBS.map(
        (b, i) =>
          `- ${colors[i]}: centre (${Math.round(b.x * 100)}%, ${Math.round(b.y * 100)}%), radius ${Math.round(b.r * 100)}% of the long side, Lissajous ${b.fx}:${b.fy} with phase (${b.px}, ${b.py}) turns`,
      ),
      `Each centre moves ±${p.drift}% of the frame: x += ${p.drift}% × sin(2π(fx·t + px)), y += ${p.drift}% × sin(2π(fy·t + py)), t = frame / total. Radii breathe ±8% once per loop.`,
      "Whole-number frequencies make frame 0 and the last frame meet with no jump.",
      p.grain > 0
        ? `Grain: a full-frame rect with a static feTurbulence filter (fractalNoise, baseFrequency 0.85, 2 octaves, seed 11) turned grey with feColorMatrix, at ${p.grain}% opacity.`
        : "No grain layer.",
      p.title.trim()
        ? `Centred title "${p.title}" in ${p.ink}: Geist weight 650, 156px (120px in 9:16), -0.04em tracking. It stays still.`
        : "No title.",
      `Loop length ${c.seconds}s.`,
    ].join("\n");
  },
});
