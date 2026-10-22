import { FINAL_HOLD, STAGGER, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { SAMPLE } from "../../film";
import { defineMotion } from "../../types";
import { GridAssemble, T, inkFor, lastLanding, sizesFor, tilesOf, type GridAssembleProps } from "./GridAssemble";

const palettes = systemPalettes((t) => ({ background: t.bg, accent: t.accent }));

const DURATION = 150;

export default defineMotion<GridAssembleProps>({
  slug: "logo-grid-assemble",
  name: "Grid Assemble",
  description: "The logo is cut into a grid of tiles that fly home from a scatter and fuse into one clean mark before the wordmark rises beside it.",
  category: "logo",
  tags: ["logo", "tiles", "grid", "assemble", "intro"],
  addedAt: "2026-10-22",
  durationInFrames: DURATION,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: GridAssemble,
  defaultProps: {
    ...palettes[0].values,
    logo: SAMPLE.logo,
    brand: SAMPLE.brand,
    tagline: "Light for every launch",
    tiles: 6,
    scatter: 1,
  } as GridAssembleProps,
  palettes,
  controls: [
    { type: "image", key: "logo", label: "Logo", hint: "PNG or SVG, square mark works best" },
    { type: "text", key: "brand", label: "Brand name", maxLength: 16 },
    { type: "text", key: "tagline", label: "Tagline", maxLength: 36 },
    { type: "color", key: "background", label: "Background" },
    { type: "color", key: "accent", label: "Accent" },
    { type: "number", key: "tiles", label: "Tiles per side", min: 4, max: 8, step: 1 },
    { type: "number", key: "scatter", label: "Scatter", min: 0.6, max: 1.4, step: 0.1, unit: "×" },
  ],
  prompt: (p, c) => {
    const u = Math.min(c.width, c.height) / 1080;
    const S = sizesFor(p.brand, p.tagline, c.width, c.height, u);
    const r = (n: number) => Math.round(n / u);
    const N = tilesOf(p);
    const ts = r(S.mark / N);
    const tok = inkFor(p.background);
    const f = (a: number, b: number) => `frames ${a}–${b} (${secs(a, c.fps)}–${secs(b, c.fps)})`;
    const land = lastLanding();
    const hold = DURATION - T.tag[1];
    const scatter = `${Math.round(T.scatter[0] * p.scatter)}–${Math.round(T.scatter[1] * p.scatter)}px`;
    const layout = S.vertical
      ? `stacked and centred: the mark on top, the wordmark ${r(S.gap)}px below it, the tagline ${r(S.tagGap)}px below that`
      : `in one centred row: the mark, a ${r(S.gap)}px gap, then a left-aligned column of the wordmark and, ${r(S.tagGap)}px below, the tagline`;
    return [
      targetLine(c.target, `a grid-assemble logo reveal for "${p.brand}": the user's logo file is cut into ${N}×${N} tiles that fly home and fuse into one mark, then the wordmark rises beside it`, c.width, c.height, c.seconds),
      `Canvas: flat ${p.background}; type colour ${tok.ink} (picked from the background). Sizes are px at 1080 on the short side. No gradients, glows, shadows or blur; tile edges stay crisp throughout.`,
      `Final lockup, ${layout}. Mark: a ${r(S.mark)}×${r(S.mark)}px box with the user's logo file drawn at object-fit: contain. Wordmark "${p.brand}": Inter 600, ${r(S.word)}px, tracking -0.03em, line-height 1.25, ${tok.ink}.${p.tagline ? ` Tagline: a ${T.square_px}px flat ${p.accent} square, ${T.square_px}px gap, then "${p.tagline}" in Inter 400, ${r(S.tag)}px, ${tok.ink} at 60% opacity.` : ""}`,
      `Slicing: each of the ${N * N} tiles is its own ${ts}×${ts}px overflow-hidden div holding a full ${r(S.mark)}px copy of the logo, offset by (-column × ${ts}px, -row × ${ts}px). No CSS masks.`,
      "",
      `Shot 1, ${f(T.fly, land)}: the mark builds at the centre of the frame (${r(S.startShift)}px ${S.vertical ? "below" : "right of"} its final spot). Each tile starts scattered: pushed ${scatter} out from its home (roughly away from the centre, seeded random), rotated by a random ±${T.rotate}°, scale ${T.scaleFrom}, opacity 0. It flies home on a spring, ${bezierText("spring")}, over ${T.flight} frames, reaching full opacity in the first third. Tiles leave in ${T.rings} rings by distance from the centre, ${STAGGER} frames apart, centre first.`,
      `Shot 2, ${f(T.gap[0], T.gap[1])}: the ${T.gapFrom}px gaps between tiles close to 0 on travel ${bezierText("travel")}. ${f(T.fuse[0], T.fuse[1])}: one full copy of the logo fades in linearly on top so the seams disappear; then the tiles are removed.`,
      `Shot 3, ${f(T.slide[0], T.slide[1])}: the mark travels to its lockup spot on travel ${bezierText("travel")}. ${f(T.word[0], T.word[1])}: the wordmark rises 105% of its line height out of an overflow-hidden line on enter ${bezierText("enter")}.`,
      p.tagline
        ? `Shot 4, ${f(T.square[0], T.square[1])}: the accent square scales 0 → 1 on the spring; ${f(T.tag[0], T.tag[1])}: the tagline fades to 60% and rises ${T.tagRise}px on enter.`
        : `No tagline.`,
      `Everything has landed by frame ${T.tag[1]}; hold the finished lockup perfectly still to frame ${DURATION} (the last ${hold} frames, at least ${FINAL_HOLD}).`,
    ].join("\n");
  },
});
