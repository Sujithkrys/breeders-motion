import { SAMPLE } from "../../film";
import { FINAL_HOLD, RADIUS, SPRING_CONFIG, STROKE, alpha, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import {
  LOGO_BOX,
  LayeredPlates,
  MIDDLE_ALPHA,
  MISREG,
  PLATES,
  T,
  TAG_GAP,
  TRACKING,
  geometry,
  landedAt,
  letterStart,
  sizesFor,
  tagStart,
  type LayeredPlatesProps,
} from "./LayeredPlates";

const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  line: t.line,
  ink: t.ink,
  ink2: t.ink2,
  accent: t.accent,
}));

const springText = (len: number) =>
  `a spring (damping ${SPRING_CONFIG.damping}, mass ${SPRING_CONFIG.mass}, stiffness ${SPRING_CONFIG.stiffness}) stretched to ${len} frames, no overshoot`;

export default defineMotion<LayeredPlatesProps>({
  slug: "logo-layered-plates",
  name: "Layered Plates",
  description: "Three flat plates slide in misregistered like print layers, snap into register under your logo, and leave a quiet offset stack beside the wordmark.",
  category: "logo",
  tags: ["logo", "print", "registration", "layers", "reveal"],
  addedAt: "2026-10-22",
  durationInFrames: T.total,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: LayeredPlates,
  defaultProps: {
    ...palettes[0].values,
    logo: SAMPLE.logo,
    brand: SAMPLE.brand,
    tagline: "Built for focus",
    offset: 6,
    spread: 40,
  } as LayeredPlatesProps,
  palettes,
  controls: [
    { type: "image", key: "logo", label: "Logo", hint: "PNG or SVG, square mark works best" },
    { type: "text", key: "brand", label: "Brand name", maxLength: 14 },
    { type: "text", key: "tagline", label: "Tagline", maxLength: 32 },
    { type: "color", key: "accent", label: "Accent plate" },
    { type: "number", key: "offset", label: "Plate offset", min: 0, max: 12, step: 1, unit: "px" },
    { type: "number", key: "spread", label: "Misregistration", min: 16, max: 72, step: 4, unit: "px" },
  ],
  prompt: (p, c) => {
    const u = Math.min(c.width, c.height) / 1080;
    const vertical = c.height > c.width;
    const S = sizesFor(p.brand, p.tagline, c.width, c.height, u);
    const G = geometry(S, c.width, c.height, vertical);
    const r = (n: number) => Math.round(n / u);
    const plate = r(S.plate);
    const n = Array.from(p.brand).length;
    const order = PLATES.map((pl, i) => `${pl.name} from the ${pl.from} (starts frame ${i * T.stagger})`).join(", ");
    return [
      targetLine(c.target, `a print-registration logo reveal for "${p.brand}": three flat plates slide in misregistered, snap into register under the logo, then the wordmark rises letter by letter`, c.width, c.height, c.seconds),
      `Canvas: flat ${p.background}. Sizes are px at 1080 on the short side. No gradients, glows, blur or bounce.`,
      `Plates: three ${plate}×${plate}px rounded squares, radius ${RADIUS.hero}px, bottom to top: ${p.accent} (accent); ${p.ink} at ${MIDDLE_ALPHA * 100}% (${alpha(p.ink, MIDDLE_ALPHA)}, so overlaps darken like overprinted ink); ${p.card} with a ${STROKE.hair}px ${p.line} inner hairline. The top plate holds the user's logo file, object-fit contain in a ${r(LOGO_BOX * S.plate)}px square at its centre.`,
      `Frames 0–${2 * T.stagger + T.enter}: the plates slide in along diagonals, ${order}, each travelling ${T.travel}px on ${springText(T.enter)} and fading in over its first ${T.fadeIn} frames. They land misregistered, each ${Math.round(p.spread * MISREG)}px out along its own diagonal (about ${p.spread}px apart).`,
      `Frames ${T.register[0]}–${T.register[0] + T.register[1]}: one ${springText(T.register[1])} pulls all three into perfect register at the centre of the frame.`,
      vertical
        ? `Frames ${T.slide[0]}–${T.slide[0] + T.slide[1]} (${springText(T.slide[1])}): the stack rises to centre y ${r(G.to.y)}px to make room for the wordmark, centred ${r(S.gap)}px below it.`
        : `Frames ${T.slide[0]}–${T.slide[0] + T.slide[1]} (${springText(T.slide[1])}): the stack slides left to centre x ${r(G.to.x)}px; the wordmark sits ${r(S.gap)}px to its right, its text block vertically centred on the plates.`,
      `Frames ${T.step[0]}–${T.step[0] + T.step[1]} (${springText(T.step[1])}): the two lower plates step out down-right into a shadow stack, the middle plate ${p.offset}px and the accent plate ${2 * p.offset}px on both axes. They stay there as the signature.`,
      `Wordmark "${p.brand}": Inter 500, ${r(S.font)}px, tracking ${TRACKING}em, ${p.ink}. Each letter is its own inline-block span; from frame ${letterStart(0)} they rise ${T.rise}px and fade in, ${T.letterDur} frames each on enter ${bezierText("enter")}, ${T.letterStagger} frames apart (last letter starts frame ${letterStart(n - 1)}).`,
      p.tagline
        ? `Tagline "${p.tagline}": Inter 400, ${r(S.tag)}px, tracking -0.01em, ${p.ink2}, ${Math.round(TAG_GAP * 100)}% of the wordmark size below it; frames ${tagStart(p.brand)}–${tagStart(p.brand) + T.letterDur} it rises ${T.rise / 2}px and fades in on enter.`
        : "No tagline.",
      `Everything has landed by frame ${landedAt(p.brand, p.tagline)}; hold the finished lockup perfectly still to frame ${T.total} (at least the last ${FINAL_HOLD} frames). The last frame is the poster.`,
    ].join("\n");
  },
});
