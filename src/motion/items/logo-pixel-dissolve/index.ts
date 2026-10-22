import { ACCENT, FINAL_HOLD, STROKE, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { FILM, SAMPLE } from "../../film";
import { defineMotion } from "../../types";
import {
  PixelDissolve,
  T,
  caretGone,
  cellFrames,
  cellsOf,
  inkFor,
  settled,
  sizesFor,
  typeEnd,
  typeInterval,
  type PixelDissolveProps,
} from "./PixelDissolve";

// The four standard looks plus Black: pure black canvas, white type, orange accent (suits the digital reveal).
const palettes = [
  ...systemPalettes((t) => ({ background: t.bg, accent: t.accent })),
  { name: "Black", swatch: [FILM.black, FILM.white, ACCENT.orange], values: { background: FILM.black, accent: ACCENT.orange } },
];

const DURATION = 150;

export default defineMotion<PixelDissolveProps>({
  slug: "logo-pixel-dissolve",
  name: "Pixel Dissolve",
  description: "The logo resolves cell by cell through a square grid with an accent flash and one scanline, then the wordmark types in behind a block caret.",
  category: "logo",
  tags: ["logo", "pixel", "grid", "typing", "digital"],
  addedAt: "2026-10-22",
  durationInFrames: DURATION,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: PixelDissolve,
  defaultProps: {
    ...palettes[0].values,
    logo: SAMPLE.logo,
    brand: SAMPLE.brand,
    tagline: "Light for every launch",
    cells: 12,
    speed: 1,
  } as PixelDissolveProps,
  palettes,
  controls: [
    { type: "image", key: "logo", label: "Logo", hint: "PNG or SVG, square mark works best" },
    { type: "text", key: "brand", label: "Brand name", maxLength: 14 },
    { type: "text", key: "tagline", label: "Tagline", maxLength: 32 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "cells", label: "Cells per side", min: 8, max: 12, step: 1 },
    { type: "number", key: "speed", label: "Speed", min: 0.85, max: 1.3, step: 0.05, unit: "×" },
  ],
  prompt: (p, c) => {
    const u = Math.min(c.width, c.height) / 1080;
    const S = sizesFor(p.brand, p.tagline, c.width, c.height, u);
    const r = (n: number) => Math.round(n / u);
    const N = cellsOf(p);
    const cs = r(S.mark / N);
    const tok = inkFor(p.background);
    const sp = Math.max(0.5, p.speed);
    // Frames at the current speed.
    const at = (n: number) => Math.round(n / sp);
    const f = (a: number, b: number) => `frames ${at(a)}–${at(b)} (${secs(at(a), c.fps)}–${secs(at(b), c.fps)})`;
    const iv = typeInterval(p.brand);
    const end = typeEnd(p.brand);
    const gone = caretGone(p.brand);
    const done = settled(p.brand);
    const layout = S.vertical
      ? `stacked and centred: the mark on top, the wordmark ${r(S.gap)}px below it, the tagline ${r(S.tagGap)}px below that`
      : `in one centred row: the mark, a ${r(S.gap)}px gap, then a left-aligned column of the wordmark and, ${r(S.tagGap)}px below, the tagline`;
    return [
      targetLine(c.target, `a pixel-dissolve logo reveal for "${p.brand}": the user's logo file resolves through a ${N}×${N} grid of cells, then the wordmark types in behind a block caret`, c.width, c.height, c.seconds),
      `Canvas: flat ${p.background}; type colour ${tok.ink} (picked from the background); one accent, ${p.accent}, used only for the cell flashes, the scanline and the caret. Sizes are px at 1080 on the short side. No gradients, glows or blur.`,
      `Final lockup, ${layout}. Mark: a ${r(S.mark)}×${r(S.mark)}px box with the user's logo file drawn at object-fit: contain. Wordmark "${p.brand}": Inter 500, ${r(S.word)}px, tracking -0.03em, ${tok.ink}, each letter its own span.${p.tagline ? ` Tagline "${p.tagline.toUpperCase()}": Geist Mono 400, ${r(S.tag)}px, +0.1em, ${tok.ink} at 60% opacity.` : ""}`,
      `Cells: draw the logo once, then lay ${N * N} cover cells of ${cs}px over it, one div each. A cell is covered by a border in the background colour; its hole (the content box) is the visible slice of the logo, centred in the cell. Overlap neighbouring covers by 1px so no seam shows. No CSS masks.`,
      "",
      `Shot 1, ${f(T.cellsFrom, T.cellsFrom + T.window + cellFrames())}: the mark builds at the centre of the frame (${r(S.startShift)}px ${S.vertical ? "below" : "right of"} its final spot). Give each cell a seeded random key; its rank sets its start within a ${at(T.window)}-frame window, quantised to a ${T.beat}-frame beat. When a cell starts, its hole snaps to ${T.steps.map((s) => `${Math.round(s * 100)}%`).join(", ")} of the cell on consecutive frames, filled flat with ${p.accent}; it holds full-size accent for ${T.flashHold} more frame, then turns clear so the slice shows. Hard cuts, no easing.`,
      `${f(T.scan[0], T.scan[1])}: a ${STROKE.ring}px ${p.accent} scanline, the mark's width, sweeps once top to bottom (linear) as the last cells land, then fades over ${T.scanFade} frames.`,
      `Shot 2, ${f(T.slide[0], T.slide[1])}: the mark travels to its lockup spot on travel ${bezierText("travel")}.`,
      `Shot 3: at frame ${at(T.caret)} a block caret (0.42em × 0.74em, sitting on the baseline, flat ${p.accent}) appears where the wordmark starts. From frame ${at(T.type)} one letter appears every ${(iv / sp).toFixed(1)} frames, no fade, and the caret jumps after it; hidden letters keep their space so nothing shifts. Typing ends at frame ${at(end)}; the caret holds ${T.blinkHold} frames, blinks twice (off ${T.blink}, on ${T.blink}, off ${T.blink}, on ${T.blink} frames) and is gone from frame ${at(gone)}.`,
      p.tagline ? `${f(end + T.tagDelay, end + T.tagDelay + T.tagLen)}: the tagline fades to 60% and rises ${T.tagRise}px on enter ${bezierText("enter")}.` : `No tagline.`,
      `Everything has landed by frame ${at(done)}; hold the finished lockup perfectly still to frame ${DURATION} (the last ${DURATION - at(done)} frames, at least ${FINAL_HOLD}).`,
    ].join("\n");
  },
});
