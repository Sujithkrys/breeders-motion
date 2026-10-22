import { FILM, SAMPLE } from "../../film";
import { ACCENT, FINAL_HOLD, bezierText, secs, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { CurveWipe, WIPE, sizesFor, type CurveWipeProps } from "./CurveWipe";

const palettes = [
  ...systemPalettes((t) => ({ background: t.bg, ink: t.ink, accent: t.accent })),
  { name: "Black", swatch: [FILM.black, FILM.white, ACCENT.orange], values: { background: FILM.black, ink: FILM.white, accent: ACCENT.orange } },
];

const DURATION = 120;

export default defineMotion<CurveWipeProps>({
  slug: "logo-curve-wipe",
  name: "Curve Wipe",
  description: "An accent field and then the background sweep across on soft curved edges, uncovering the logo lockup underneath.",
  category: "logo",
  tags: ["logo", "wipe", "reveal", "curve", "lockup"],
  addedAt: "2026-10-22",
  durationInFrames: DURATION,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: CurveWipe,
  defaultProps: {
    ...palettes[0].values,
    logo: SAMPLE.logo,
    brand: SAMPLE.brand,
    tagline: "Light for focused teams",
    direction: "left",
  } as CurveWipeProps,
  palettes,
  controls: [
    { type: "image", key: "logo", label: "Logo", hint: "PNG or SVG, square mark works best" },
    { type: "text", key: "brand", label: "Brand name", maxLength: 16 },
    { type: "text", key: "tagline", label: "Tagline", maxLength: 40 },
    { type: "color", key: "accent", label: "Wipe" },
    { type: "color", key: "background", label: "Background" },
    {
      type: "select",
      key: "direction",
      label: "Wipe direction",
      options: [
        { label: "Left to right", value: "left" },
        { label: "Bottom to top", value: "up" },
      ],
    },
  ],
  prompt: (p, c) => {
    const u = Math.min(c.width, c.height) / 1080;
    const Z = sizesFor(p, c.width, c.height, u);
    const r = (n: number) => Math.round(n / u);
    const up = p.direction === "up";
    const vertical = Z.regime === "vertical";
    const edgeLen = up ? c.width : c.height;
    const apex = Math.round((WIPE.bow * edgeLen) / u);
    const from = up ? "bottom to top" : "left to right";
    const f = (a: readonly [number, number]) => `frames ${a[0]}–${a[1]} (${secs(a[0], c.fps)}–${secs(a[1], c.fps)})`;
    return [
      targetLine(c.target, `a logo reveal for "${p.brand}": two flat full-frame fields wipe ${from} on soft curved edges and uncover the logo lockup`, c.width, c.height, c.seconds),
      `Colours: background ${p.background}, wipe field ${p.accent}, wordmark ${p.ink}. Flat fills only: no gradients, glows or shadows. Sizes are px at 1080 on the short side.`,
      `Lockup (centred, ${vertical ? "stacked: mark above the wordmark" : "one row: mark left of the wordmark"}): the user's logo file in a ${r(Z.mark)}×${r(Z.mark)}px box with object-fit: contain, ${r(Z.gap)}px gap, then "${p.brand}" in Inter ${WIPE.weight}, ${r(Z.word)}px, tracking ${WIPE.tracking}em, ${p.ink}.${p.tagline ? ` Tagline "${p.tagline}" ${r(Z.tagGap)}px below in Inter 400, ${r(Z.tag)}px, -0.01em, ${p.ink} at 60% opacity.` : ""}`,
      `The lockup sits in its final place on the background from frame 0; the fields cover it, so it is uncovered rather than animated in.`,
      `Edges: each field is one SVG path whose leading edge is a quadratic curve spanning the full ${up ? "width" : "height"}, bowing forward at its middle by ${Math.round(apex * WIPE.bowRest)}px at rest and ${apex}px mid-sweep (bow = ${apex}px × (${WIPE.bowRest} + ${1 - WIPE.bowRest}·sin(π·t)), so it bends with speed). Each edge travels from fully off-screen behind the frame to fully past it.`,
      `Frame 0: plain ${p.background}. Shot 1, ${f(WIPE.accent)}: the ${p.accent} field sweeps ${from} on travel ${bezierText("travel")}, drawn over a background-coloured cover that hides the lockup.`,
      `Shot 2, ${f(WIPE.field)}: the ${p.background} field follows on the same curve and edge, sweeping over the accent; behind its edge the lockup is visible, so it is uncovered along the curve. The two sweeps overlap, so a band of ${p.accent} passes through the frame.`,
      `Parallax, ${f(WIPE.push)}: while it is uncovered the whole lockup pushes ${WIPE.pushPx}px ${up ? "upward (translateY +12 → 0)" : "rightward (translateX −12 → 0)"} on enter ${bezierText("enter")}.`,
      p.tagline ? `Tagline, ${f(WIPE.tagline)}: fades 0 → 60% and rises ${WIPE.rise}px on enter ${bezierText("enter")}.` : `No tagline.`,
      `Everything has landed by frame ${p.tagline ? WIPE.tagline[1] : WIPE.push[1]}; hold the finished lockup perfectly still to frame ${DURATION} (at least the last ${FINAL_HOLD} frames). The poster frame is the finished lockup.`,
    ].join("\n");
  },
});
