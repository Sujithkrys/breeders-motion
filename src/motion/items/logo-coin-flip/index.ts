import { FINAL_HOLD, RADIUS, STROKE, bezierText, systemPalettes, targetLine } from "../../kit";
import { SAMPLE } from "../../film";
import { defineMotion } from "../../types";
import { COIN, CoinFlip, ON_ACCENT, coinLayout, coinTokensFor, edgeColourFor, isDarkBg, type CoinFlipProps } from "./CoinFlip";

const palettes = systemPalettes((t) => ({ background: t.bg, accent: t.accent }));

export default defineMotion<CoinFlipProps>({
  slug: "logo-coin-flip",
  name: "Coin Flip",
  description: "Your mark spins in on a thick coin, shows its accent back mid-flip, lands flat and slides the wordmark out.",
  category: "logo",
  tags: ["logo", "coin", "flip", "3d", "spring"],
  addedAt: "2026-10-22",
  durationInFrames: COIN.duration,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: CoinFlip,
  defaultProps: {
    ...palettes[0].values,
    logo: SAMPLE.logo,
    brand: SAMPLE.brand,
    tagline: "Light for focused teams",
    flips: 1.5,
    shape: "coin",
  } as CoinFlipProps,
  palettes,
  controls: [
    { type: "image", key: "logo", label: "Logo", hint: "PNG or SVG, square mark works best" },
    { type: "text", key: "brand", label: "Brand", maxLength: 14 },
    { type: "text", key: "tagline", label: "Tagline", maxLength: 36 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "flips", label: "Flips", min: 1, max: 3, step: 0.5, unit: "turns" },
    {
      type: "select",
      key: "shape",
      label: "Shape",
      options: [
        { label: "Coin", value: "coin" },
        { label: "Tile", value: "tile" },
      ],
    },
  ],
  prompt: (p, c) => {
    const u = Math.min(c.width, c.height) / 1080;
    const L = coinLayout(p.brand, p.tagline, c.width, c.height, u);
    const t = coinTokensFor(p.background);
    const r = (n: number) => Math.round(n / u);
    const tile = p.shape === "tile";
    const deg = Math.round(Math.max(1, p.flips) * 360);
    const thick = Math.round((COIN.thickness * L.D) / u);
    const hasTag = p.tagline.trim().length > 0;
    const startsOnBack = Math.round((deg / 180) % 2) === 1;
    const lines: (string | null)[] = [
      targetLine(c.target, `a logo reveal for "${p.brand}": the mark spins in on a thick ${tile ? "rounded tile" : "coin"}, lands flat, and the wordmark slides out from behind it`, c.width, c.height, c.seconds),
      `Background: flat ${p.background}. Sizes are px at 1080 on the short side. No gradients, glows or sheens; the only shadow is a soft contact shadow.`,
      `The ${tile ? "tile" : "coin"}: ${r(L.D)}×${r(L.D)}px, ${tile ? `radius ${RADIUS.hero}px` : "fully round"}. Front face ${t.card} with a ${STROKE.hair}px ${t.line} hairline, the user's logo file centred in a ${Math.round(r(L.D) * (tile ? COIN.logoOnTile : COIN.logoOnCoin))}px box (object-fit: contain). Back face flat ${p.accent} with "${p.brand.trim().charAt(0).toUpperCase()}" in Inter 600 at ${Math.round(r(L.D) * 0.44)}px, -0.04em, ${ON_ACCENT}.`,
      `Thickness ${thick}px, faked with ${COIN.layers} edge layers of the same shape in ${edgeColourFor(p.background)} spaced evenly between the faces on translateZ, plus a ${thick}px-wide band at rotateY(90°) for the edge-on silhouette. Give each layer its own transform (perspective(${COIN.perspective}px) translateZ(lift) rotateY(θ) translateZ(z)), no preserve-3d, and paint them far-to-near by the sign of cos θ.`,
      `Wordmark "${p.brand}" in Inter 500, ${r(L.word)}px, tracking -0.03em, ${t.ink}, ${L.vertical ? `centred ${r(L.gap)}px below the ${tile ? "tile" : "coin"}` : `${r(L.gap)}px to the right of the ${tile ? "tile" : "coin"}, the text block vertically centred on it`}. The whole lockup is centred in the frame.`,
      hasTag ? `Tagline "${p.tagline}" in Inter 400, ${r(L.tag)}px, -0.01em, ${t.ink2}, ${r(L.tagTop - L.wordTop - L.wordH)}px under the wordmark, ${L.vertical ? "centred" : "left-aligned with it"}.` : null,
      "",
      `Frames 0–${COIN.flip}: one spring (${bezierText("spring")}, settled by frame ${COIN.flip}) drives the spin, rotateY ${deg}° → 0° (${p.flips} turns${startsOnBack ? ", so it opens on the accent back" : ""}), and the drop: translateZ ${COIN.lift}px → 0 toward the camera. It fades in over frames ${COIN.fade[0]}–${COIN.fade[1]} on enter.`,
      `Contact shadow under it: the ${tile ? "tile's" : "coin's"} footprint (width × max(|cos θ|, ${COIN.thickness})), ${isDarkBg(p.background) ? "black at 0.04 → 0.5" : "black at 0.04 → 0.14"} opacity, blur 24px → 10px, offset 56px → 14px down and 110% → 96% size as it lands, all on the same spring.`,
      `Frames ${COIN.word[0]}–${COIN.word[1]}: the wordmark slides out from behind the ${tile ? "tile" : "coin"} ${L.vertical ? "downward" : "to the right"} on enter ${bezierText("enter")}, clipped at the ${tile ? "tile's" : "coin's"} centre line so it only ever appears from under it${L.vertical ? "; it also fades in over the first half" : ""}.`,
      hasTag ? `Frames ${COIN.tag[0]}–${COIN.tag[1]}: the tagline fades in and rises 12px on enter.` : null,
      `Frames ${hasTag ? COIN.tag[1] : COIN.word[1]}–${COIN.duration}: hold the finished lockup perfectly still (at least the last ${FINAL_HOLD} frames).`,
    ];
    return lines.filter((l): l is string => l !== null).join("\n");
  },
});
