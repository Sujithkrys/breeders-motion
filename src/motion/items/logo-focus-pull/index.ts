import { ACCENT, FINAL_HOLD, bezierText, systemPalettes, targetLine } from "../../kit";
import { FILM, SAMPLE } from "../../film";
import { defineMotion } from "../../types";
import { FOCUS, FocusPull, focusLayout, inkTokensFor, type FocusPullProps } from "./FocusPull";

const palettes = [
  ...systemPalettes((t) => ({ background: t.bg, accent: t.accent })),
  { name: "Black", swatch: [FILM.black, FILM.white, ACCENT.orange], values: { background: FILM.black, accent: ACCENT.orange } },
];

export default defineMotion<FocusPullProps>({
  slug: "logo-focus-pull",
  name: "Focus Pull",
  description: "The camera pulls back from a soft macro view of your mark as the lens racks into focus, then the wordmark rises.",
  category: "logo",
  tags: ["logo", "camera", "focus", "blur", "intro"],
  addedAt: "2026-10-22",
  durationInFrames: FOCUS.duration,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: FocusPull,
  defaultProps: {
    ...palettes[0].values,
    logo: SAMPLE.logo,
    brand: SAMPLE.brand,
    tagline: "Light for focused teams",
    zoom: 7,
    blur: 18,
  } as FocusPullProps,
  palettes,
  controls: [
    { type: "image", key: "logo", label: "Logo", hint: "PNG or SVG, square mark works best" },
    { type: "text", key: "brand", label: "Brand", maxLength: 14 },
    { type: "text", key: "tagline", label: "Tagline", maxLength: 32 },
    { type: "color", key: "background", label: "Background" },
    { type: "color", key: "accent", label: "Accent" },
    { type: "number", key: "zoom", label: "Start zoom", min: 3, max: 10, step: 0.5, unit: "×" },
    { type: "number", key: "blur", label: "Start blur", min: 0, max: 30, step: 2, unit: "px" },
  ],
  prompt: (p, c) => {
    const u = Math.min(c.width, c.height) / 1080;
    const L = focusLayout(p.brand, p.tagline, c.width, c.height, u);
    const t = inkTokensFor(p.background);
    const r = (n: number) => Math.round(n / u);
    const end = FOCUS.duration;
    const hasTag = p.tagline.trim().length > 0;
    return [
      targetLine(c.target, `a logo reveal for "${p.brand}": the camera pulls back from a blurred macro view of the mark while the lens racks into focus, then the wordmark rises`, c.width, c.height, c.seconds),
      `Background: flat ${p.background}, nothing else. Sizes are px at 1080 on the short side. No gradients, glows, flares or shadows.`,
      `Final lockup, centred in the frame: the user's logo file in a ${r(L.M)}×${r(L.M)}px box (object-fit: contain), ${L.vertical ? `with the wordmark centred ${r(L.gap)}px below it` : `with the wordmark ${r(L.gap)}px to its right, vertically centred on the mark`}. Wordmark "${p.brand}" in Inter 600, ${r(L.word)}px, tracking -0.03em, ${t.ink}.`,
      hasTag
        ? `Tagline "${p.tagline.toUpperCase()}" in Geist Mono 400, ${r(L.tag)}px, tracking +0.12em, ${t.ink2}, centred ${r(L.tagTop - (L.vertical ? L.wordTop + L.wordH : L.markY + L.M / 2))}px under the lockup, led by a 10px ${p.accent} dot 14px before the text.`
        : "No tagline.",
      "",
      `Frames 0–${FOCUS.pull[0]}: macro shot. The whole lockup is scaled ${p.zoom}× and framed on a point just past the mark's right edge, ${Math.round(Math.abs(FOCUS.focus.y) * 100)}% of the mark above its centre, so only a soft abstract edge of the logo fills the frame. The layer has filter: blur(${p.blur}px) (blur in screen space, outside the scale).`,
      `Frames ${FOCUS.pull[0]}–${FOCUS.pull[1]}: pull back to 1× on travel ${bezierText("travel")}. Interpolate scale in log space: scale = exp(ln(${p.zoom}) × (1 − t)). Zoom about a fixed pivot P = F × ${p.zoom} / ${p.zoom - 1}, where F is the macro focus point in frame-centred coordinates, so it is a pure dolly. The blur falls from ${p.blur}px to 0 on the same eased t, like a lens racking focus.`,
      `Frames ${FOCUS.word[0]}–${FOCUS.word[1]}: as the mark comes sharp, the wordmark rises out of a line mask (overflow: hidden, line-height 1.2) from 100% of its height to 0 on enter ${bezierText("enter")}.`,
      hasTag ? `Frames ${FOCUS.tag[0]}–${FOCUS.tag[1]}: the tagline row fades in on enter.` : null,
      `Frames ${FOCUS.push[0]}–${FOCUS.push[1]}: a subtle linear push-in on the whole lockup, scale 1 → ${FOCUS.pushTo}, around the frame centre.`,
      `Frames ${FOCUS.push[1]}–${end}: hold the finished lockup perfectly still (the last ${end - FOCUS.push[1]} frames, at least ${FINAL_HOLD}).`,
    ]
      .filter((l): l is string => l !== null)
      .join("\n");
  },
});
