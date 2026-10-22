import { ACCENT, CANVAS, FINAL_HOLD, bezierText, systemPalettes, targetLine } from "../../kit";
import { SAMPLE } from "../../film";
import { defineMotion } from "../../types";
import { KW, KineticWordmark, charsOf, lastStartOf, sizesFor, type KineticWordmarkProps } from "./KineticWordmark";

const colours = (t: { bg: string; ink: string; ink2: string; accent: string }) => ({
  background: t.bg,
  ink: t.ink,
  ink2: t.ink2,
  accent: t.accent,
});
const palettes = [
  ...systemPalettes(colours),
  {
    name: "Black",
    swatch: ["#000000", CANVAS.ink.ink, ACCENT.orange],
    values: colours({ ...CANVAS.ink, bg: "#000000", accent: ACCENT.orange }),
  },
];

const DURATION = 120;
export default defineMotion<KineticWordmarkProps>({
  slug: "logo-kinetic-wordmark",
  name: "Kinetic Wordmark",
  description: "A huge wordmark weaves in letter by letter through masks, the logo spins in as its leading glyph, and the lockup settles.",
  category: "logo",
  tags: ["logo", "wordmark", "kinetic type", "mask", "reveal"],
  addedAt: "2026-10-22",
  durationInFrames: DURATION,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: KineticWordmark,
  defaultProps: {
    ...palettes[0].values,
    logo: SAMPLE.logo,
    brand: SAMPLE.brand,
    tagline: "Clarity for every team",
    stagger: 3,
  } as KineticWordmarkProps,
  palettes,
  controls: [
    { type: "image", key: "logo", label: "Logo", hint: "PNG or SVG, square mark works best" },
    { type: "text", key: "brand", label: "Brand name", maxLength: 14 },
    { type: "text", key: "tagline", label: "Tagline", maxLength: 32 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "number", key: "stagger", label: "Stagger", min: 2, max: 6, step: 1, unit: "f" },
  ],
  prompt: (p, c) => {
    const u = Math.min(c.width, c.height) / 1080;
    const vertical = c.height > c.width;
    const S = sizesFor(p.brand, c.width, c.height, u);
    const r = (n: number) => Math.round(n / u);
    const chars = charsOf(p.brand);
    const st = lastStartOf(p.stagger, chars.length);
    const stText = Number.isInteger(st) ? `${st}` : st.toFixed(1);
    const lastLand = Math.round(KW.letters + (chars.length - 1) * st + KW.letterDur);
    const tag = String(p.tagline ?? "").trim();
    const end = tag ? KW.tag[1] : Math.max(KW.settle[1], lastLand);
    return [
      targetLine(c.target, `a kinetic wordmark logo reveal for "${p.brand}": the letters weave in through masks, the user's logo rotates in as the leading glyph and the lockup settles`, c.width, c.height, c.seconds),
      `Background: flat ${p.background}, nothing else. Sizes are px at 1080 on the short side. No gradients, glows or shadows.`,
      `Wordmark: "${p.brand}" in Inter ${KW.weight}, ${r(S.size)}px (220px at 16:9, shrunk so the lockup fits the width), tracking ${KW.tracking}em, ${p.ink}. Every letter is its own span with one text node, inside its own overflow-hidden mask one line box tall (line-height 1.2); give each mask ${KW.pad}em side padding cancelled by equal negative margins, so glyph overhangs are never clipped.`,
      vertical
        ? `Mark: the user's logo file in a ${r(S.mark)}×${r(S.mark)}px square box (object-fit: contain), ${KW.stackMark}× the cap height, centred above the wordmark, ${KW.stackGap}em above the cap line.`
        : `Mark: the user's logo file in a ${r(S.mark)}×${r(S.mark)}px square box (object-fit: contain) = the cap height (0.7275em), standing on the baseline as the leading glyph, ${KW.markGap}em (${r(KW.markGap * S.size)}px) before the first letter.`,
      tag
        ? `Tagline: "${tag.toUpperCase()}" in Geist Mono 400, ${r(S.tag)}px, +0.12em tracking, ${p.ink2}, after a ${KW.dot}px ${p.accent} dot with a ${KW.dotGap}px gap; centred under the lockup, its top ${KW.tagTop}em of the wordmark size below the baseline. The dot is the only accent.`
        : "No tagline and no accent.",
      "",
      `Frames 0–${KW.settle[0]}: the whole lockup sits at scale ${KW.scaleFrom} about its centre; frames ${KW.settle[0]}–${KW.settle[1]} it scales to 1 on travel ${bezierText("travel")}.`,
      `Frames ${KW.mark[0]}–${KW.mark[1]}: the mark rotates −90° → 0° and scales 0.6 → 1 on ${bezierText("spring")}, fading in over its first ${KW.markFade} frames.`,
      `Letters: letter i starts at frame ${KW.letters} + i × ${stText} and slides one full mask height into place over ${KW.letterDur} frames on the same spring. The 1st, 3rd, 5th… rise from below; the 2nd, 4th… drop from above, so the word weaves. The last letter lands at frame ${lastLand}.`,
      ...(tag ? [`Frames ${KW.tag[0]}–${KW.tag[1]}: the tagline fades in and rises ${KW.tagRise}px on enter ${bezierText("enter")}.`] : []),
      `Everything has landed by frame ${end}; hold the finished lockup perfectly still to frame ${DURATION} (at least the last ${FINAL_HOLD} frames).`,
    ].join("\n");
  },
});
