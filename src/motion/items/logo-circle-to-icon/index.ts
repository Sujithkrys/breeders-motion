import { SAMPLE } from "../../film";
import { FINAL_HOLD, SPRING_CONFIG, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import {
  CIRCLE,
  CircleToIcon,
  DOT,
  LANDED,
  LOGO_BOX,
  SAMPLES,
  T,
  TAG_GAP,
  TRACKING,
  geometry,
  sizesFor,
  type CircleToIconProps,
} from "./CircleToIcon";

// The tile takes the ink colour (black on light canvases, white on Ink), like an app icon on a home screen.
const palettes = systemPalettes((t) => ({
  background: t.bg,
  tile: t.ink,
  accent: t.accent,
  ink: t.ink,
  ink2: t.ink2,
}));

const springText = (len: number) =>
  `a spring (damping ${SPRING_CONFIG.damping}, mass ${SPRING_CONFIG.mass}, stiffness ${SPRING_CONFIG.stiffness}) stretched to ${len} frames, no overshoot`;

export default defineMotion<CircleToIconProps>({
  slug: "logo-circle-to-icon",
  name: "Circle to Icon",
  description: "An accent dot grows into a circle, morphs into an app-icon squircle holding your logo, then the wordmark slides out from behind it.",
  category: "logo",
  tags: ["logo", "app-icon", "squircle", "morph", "reveal"],
  addedAt: "2026-10-22",
  durationInFrames: T.total,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: CircleToIcon,
  defaultProps: {
    ...palettes[0].values,
    logo: SAMPLE.logo,
    brand: SAMPLE.brand,
    tagline: "Built for focus",
    corner: 5,
  } as CircleToIconProps,
  palettes,
  controls: [
    { type: "image", key: "logo", label: "Logo", hint: "PNG or SVG, square mark works best" },
    { type: "text", key: "brand", label: "Brand name", maxLength: 14 },
    { type: "text", key: "tagline", label: "Tagline", maxLength: 32 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "tile", label: "Tile" },
    { type: "number", key: "corner", label: "Squareness", min: 3.5, max: 7, step: 0.5 },
  ],
  prompt: (p, c) => {
    const u = Math.min(c.width, c.height) / 1080;
    const vertical = c.height > c.width;
    const S = sizesFor(p.brand, p.tagline, c.width, c.height, u);
    const G = geometry(S, c.width, c.height, vertical);
    const r = (n: number) => Math.round(n / u);
    const tile = r(S.tile);
    return [
      targetLine(c.target, `a logo reveal for "${p.brand}" where an accent dot grows into a circle, morphs into an app-icon squircle that holds the logo, and the wordmark slides out from behind the icon`, c.width, c.height, c.seconds),
      `Canvas: flat ${p.background}, nothing else. Sizes are px at 1080 on the short side. No gradients, glows, shadows or bounce.`,
      `The shape is one SVG path, a superellipse |x/a|^n + |y/a|^n = 1 sampled at ${SAMPLES} points (x = a·sgn(cos t)|cos t|^(2/n), y likewise with sin), so circle and squircle are the same path with different n.`,
      `Frames ${T.dot[0]}–${T.dot[1]}: a ${DOT}px ${p.accent} dot appears in the centre, fading in and scaling 0.5 → 1 on enter ${bezierText("enter")}.`,
      `Frames ${T.grow[0]}–${T.grow[0] + T.grow[1]}: the dot grows into a ${r(CIRCLE * S.tile)}px circle on ${springText(T.grow[1])}.`,
      `Frames ${T.morph[0]}–${T.morph[1]} (travel ${bezierText("travel")}): n goes 2 → ${p.corner}, so the corners tighten into an app-icon squircle; a shrinks to ${tile / 2}px (a ${tile}×${tile}px tile); the fill crossfades ${p.accent} → ${p.tile}.`,
      `Frames ${T.logo[0]}–${T.logo[1]}: the user's logo file, object-fit contain in a ${r(LOGO_BOX * S.tile)}px square centred on the tile, fades in and scales 0.8 → 1 on enter. If the logo has its own square background, match it to the tile colour so only the glyph reads.`,
      vertical
        ? `Frames ${T.slide[0]}–${T.slide[0] + T.slide[1]}, on ${springText(T.slide[1])}: the tile rises from the centre to centre y ${r(G.to.y)}px while the wordmark slides down out from behind it; the wordmark is clipped to the area below the tile's bottom edge, which moves with the tile, and lands centred ${r(S.gap)}px below the tile.`
        : `Frames ${T.slide[0]}–${T.slide[0] + T.slide[1]}, on ${springText(T.slide[1])}: the tile slides left from the centre to centre x ${r(G.to.x)}px while the wordmark slides right out from behind it; the wordmark is clipped to the area right of the tile's right edge, which moves with the tile, and lands ${r(S.gap)}px right of the tile, its text block vertically centred on it.`,
      `Wordmark "${p.brand}": Inter 500, ${r(S.font)}px, tracking ${TRACKING}em, line-height 1.1, ${p.ink}.` +
        (p.tagline
          ? ` Tagline "${p.tagline}": Inter 400, ${r(S.tag)}px, tracking -0.01em, ${p.ink2}, ${Math.round(TAG_GAP * 100)}% of the wordmark size below it; it slides out the same way on its own spring, frames ${T.tag[0]}–${T.tag[0] + T.tag[1]}.`
          : ""),
      `Everything has landed by frame ${LANDED}; hold the finished lockup perfectly still to frame ${T.total} (at least the last ${FINAL_HOLD} frames). The last frame is the poster.`,
    ].join("\n");
  },
});
