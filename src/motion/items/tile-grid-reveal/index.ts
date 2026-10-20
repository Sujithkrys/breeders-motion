import { EASE_OPTIONS, bezierText, secs, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { GRID, RADIUS, TileGridReveal, timeline, type TileGridRevealProps } from "./TileGridReveal";

const palettes = [
  { name: "Violet", swatch: ["#A78BFA", "#7C3AED", "#0C0716"], values: { background: "#0C0716", tileA: "#A78BFA", tileB: "#7C3AED", monogramColor: "#FFFFFF", nameColor: "#F1EBFF" } },
  { name: "Tangerine", swatch: ["#FFB547", "#FF6A1A", "#140B04"], values: { background: "#140B04", tileA: "#FFB547", tileB: "#FF6A1A", monogramColor: "#1A0E04", nameColor: "#FFF3E6" } },
  { name: "Jade", swatch: ["#6EE7A8", "#059669", "#04120C"], values: { background: "#04120C", tileA: "#6EE7A8", tileB: "#059669", monogramColor: "#022C1C", nameColor: "#E7FBF1" } },
  { name: "Blush", swatch: ["#FBF1F1", "#FF8FA3", "#E8456B"], values: { background: "#FBF1F1", tileA: "#FF8FA3", tileB: "#E8456B", monogramColor: "#FFFFFF", nameColor: "#2A1218" } },
  { name: "Steel", swatch: ["#9AA4B2", "#3A4250", "#0D0F12"], values: { background: "#0D0F12", tileA: "#9AA4B2", tileB: "#3A4250", monogramColor: "#FFFFFF", nameColor: "#EEF1F5" } },
];

export default defineMotion<TileGridRevealProps>({
  slug: "tile-grid-reveal",
  name: "Tile Grid Reveal",
  description: "A 5×5 grid of tiles flips over in a diagonal 3D wave to form a monogram mark, then the wordmark slides out.",
  category: "logo",
  tags: ["logo", "3d", "tiles", "flip", "reveal"],
  addedAt: "2026-09-23",
  durationInFrames: 120,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: TileGridReveal,
  defaultProps: {
    ...palettes[0].values,
    monogram: "V",
    name: "Vantage",
    stagger: 2.5,
    flip: 110,
    ease: "smooth",
  } as TileGridRevealProps,
  palettes,
  controls: [
    { type: "text", key: "monogram", label: "Monogram", maxLength: 2 },
    { type: "text", key: "name", label: "Brand name", maxLength: 14 },
    { type: "color", key: "tileA", label: "Tiles" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "stagger", label: "Wave stagger", min: 1, max: 4, step: 0.5, unit: "f" },
    { type: "number", key: "flip", label: "Flip angle", min: 60, max: 150, step: 5, unit: "°" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const D = Math.round(c.seconds * c.fps);
    const vertical = c.height > c.width;
    const tl = timeline(D, p.stagger);
    const S = vertical ? 360 : 300;
    const s = (f: number) => secs(f, c.fps);
    return [
      targetLine(c.target, `a logo reveal where a ${GRID}×${GRID} tile grid flips in a diagonal 3D wave to form the monogram "${p.monogram}", then "${p.name}" slides out`, c.width, c.height, c.seconds),
      `Background ${p.background}. Font Geist only.`,
      "",
      `Mark: ${S}×${S}px, radius ${Math.round(S * RADIUS)}px, 135° gradient ${p.tileA} → ${p.tileB}, monogram "${p.monogram}" centred in Geist 700, -0.045em, ${p.monogramColor}.`,
      `Slice the mark into ${GRID}×${GRID} tiles of ${S / GRID}px; each tile shows its own slice of the gradient and of the letter (background-position and an offset copy of the letter inside overflow:hidden), so together they read as one mark.`,
      `Tiles start with a 6px gap and 8px radius, opacity 0, scale 0.55, and rotate3d(1, -1, 0, ${p.flip}°) with 900px perspective, darkened 50%.`,
      `Each tile flips flat over ${s(tl.dur)}, starting ${s(D * 0.04)} + (row + column) × ${p.stagger} frames, so a diagonal wave runs top-left to bottom-right.`,
      `${s(tl.fuse[0])}–${s(tl.fuse[1])}: the gaps close, the outer corners round to ${Math.round(S * RADIUS)}px, a solid copy fades over the seams with a top gloss, the mark pulses 3% and a ${p.tileB} glow appears below it.`,
      vertical
        ? `${s(tl.name[0])}–${s(tl.name[1])}: the mark rises while "${p.name}" slides down out from under it, ${Math.round(S * 0.2)}px below, ending centred as a stack.`
        : `${s(tl.name[0])}–${s(tl.name[1])}: the mark moves left while "${p.name}" slides out from under its right edge, ${Math.round(S * 0.2)}px away, ending as a centred lockup.`,
      `Name: Geist 650, ${vertical ? 116 : 120}px, -0.04em, ${p.nameColor}; shrink to fit long names.`,
      `Ease ${p.ease} ${bezierText(p.ease)}. Hold the lockup to the end.`,
    ].join("\n");
  },
});
