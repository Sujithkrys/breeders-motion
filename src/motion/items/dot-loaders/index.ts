import { EASE_OPTIONS, RADIUS, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion, type Ratio } from "../../types";
import { DotLoaders, GRID, LOADERS, PERIODS, type DotLoadersProps } from "./DotLoaders";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  line: t.line,
  ink: t.ink,
  ink2: t.ink2,
  ink3: t.ink3,
  accent: t.accent,
}));

export default defineMotion<DotLoadersProps>({
  slug: "dot-loaders",
  name: "Dot Loaders",
  description: "Eight tiles of tiny dot-matrix loaders, each with its own pattern, under a two-tone title; one tile carries the accent.",
  category: "ui",
  tags: ["loader", "spinner", "dot-matrix", "grid", "loop"],
  addedAt: "2026-10-20",
  durationInFrames: 150,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: DotLoaders,
  defaultProps: {
    ...palettes[0].values,
    title1: "Loading.",
    title2: "Made beautiful.",
    accentTile: 5,
    ease: "travel",
  } as DotLoadersProps,
  palettes,
  controls: [
    { type: "text", key: "title1", label: "Title", maxLength: 18 },
    { type: "text", key: "title2", label: "Title, second tone", maxLength: 24 },
    { type: "number", key: "accentTile", label: "Accent tile", min: 1, max: 8, step: 1 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Canvas" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const ratio: Ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const g = GRID[ratio];
    const rows = Math.ceil(LOADERS.length / g.cols);
    const acc = Math.min(8, Math.max(1, Math.round(Number(p.accentTile) || 5)));
    return [
      targetLine(c.target, `a grid of ${LOADERS.length} dot-matrix loader tiles, each animating a different pattern, under a two-tone title`, c.width, c.height, c.seconds),
      `Canvas ${p.background}, flat. Sizes are px at 1080 on the short side. No gradients, no glows.`,
      `Grid: ${g.cols}×${rows} tiles, ${g.tile}px square, ${g.gap}px gaps, centred. Each tile is a ${p.card} card, radius ${RADIUS.card}px, 1px ${p.line} border, shadow 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06) (none on a dark canvas). Top-left of each tile, 24px in: a Geist Mono 15px index "01"–"08" in ${p.ink3}, +0.1em tracking.`,
      `Each loader is an SVG in a 100-unit viewBox at 46% of the tile, centred, drawn in ${p.ink}; resting dots sit at 12% opacity. Tile ${acc} (${LOADERS[acc - 1]}) draws in the accent ${p.accent} instead.`,
      `Loaders: 1 Typing — three 6.5u dots hop 10u in turn, 5 frames apart, every 30 frames. 2 Snake — a 3×3 matrix whose lit head steps clockwise round the 8 outer dots (8 steps per 25 frames) with a 55% and 25% tail. 3 Wave — a diagonal swell across a 3×3 (radius 4→7.5u, opacity 20→100%) on a 30-frame sine.`,
      `4 Equaliser — five columns of four dots; each column lights 1–4 dots, following a 30-frame sine offset 1.15 rad per column. 5 Ring — twelve dots on a 30u circle; a comet of light runs round once per 30 frames, fading over 6 dots. 6 Merge — two dots orbit the centre, close to one 9.5u dot and part again every 50 frames.`,
      `7 Twinkle — each 3×3 dot glints on a sin² curve with its own random phase, period 30 frames. 8 Pulse — a wave expands from the centre dot to the edges then corners every 30 frames (radius 3.5→7u).`,
      `Every period (${Array.from(new Set(PERIODS)).join(", ")} frames) divides the ${c.seconds}s loop, so it is seamless; dot moves are shaped by ${p.ease} ${bezierText(p.ease)}.`,
      `Title ${g.titleGap}px below the grid, centred, Inter ${g.title}px/400, -0.04em tracking: "${p.title1}" in ${p.ink} followed by "${p.title2}" in ${p.ink2}.`,
    ].join("\n");
  },
});
