import { EASE_OPTIONS, FINAL_HOLD, RADIUS, STROKE, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { PRE, WordsPreloader, isDark, timeline, wordSize, type WordsPreloaderProps } from "./WordsPreloader";

// The panel is the inverse of the page: black on Paper and Stone, white on Ink.
const palettes = systemPalettes((t) => ({
  background: t.bg,
  card: t.card,
  line: t.line,
  fill: t.fill,
  ink: t.ink,
  ink3: t.ink3,
  panel: t.ink,
  onPanel: t.bg,
  panelMuted: t.ink3,
  accent: t.accent,
}));

const DURATION = 180;

export default defineMotion<WordsPreloaderProps>({
  slug: "words-preloader",
  name: "Words Preloader",
  description: "A full-frame preloader cycles words through a mask, lands on the brand, then wipes up on a curved edge to reveal the page.",
  category: "text",
  tags: ["preloader", "words", "wipe", "intro", "loop"],
  addedAt: "2026-10-22",
  durationInFrames: DURATION,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: WordsPreloader,
  defaultProps: {
    ...palettes[0].values,
    word1: "Plan",
    word2: "Focus",
    word3: "Build",
    word4: "Ship",
    brand: "Lumen",
    pace: 14,
    ease: "travel",
  } as WordsPreloaderProps,
  palettes,
  controls: [
    { type: "text", key: "word1", label: "Word 1", maxLength: 12 },
    { type: "text", key: "word2", label: "Word 2", maxLength: 12 },
    { type: "text", key: "word3", label: "Word 3", maxLength: 12 },
    { type: "text", key: "word4", label: "Word 4", maxLength: 12 },
    { type: "text", key: "brand", label: "Brand (last word)", maxLength: 12 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "number", key: "pace", label: "Frames per word", min: 10, max: 16, step: 2, unit: "f" },
    { type: "select", key: "ease", label: "Wipe easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const u = Math.min(c.width, c.height) / 1080;
    const ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const size = Math.round(wordSize([p.word1, p.word2, p.word3, p.word4, p.brand], c.width, u, ratio) / u);
    const tl = timeline(p.pace);
    const words = [p.word1, p.word2, p.word3, p.word4, p.brand];
    return [
      targetLine(c.target, "a full-frame preloader that cycles words through a mask, lands on the brand and wipes up on a curved edge to reveal the page", c.width, c.height, c.seconds),
      `Sizes are px at 1080 on the short side; Inter only, Geist Mono for tiny labels. No gradients or glows.`,
      `Panel: one flat SVG path filling the frame in ${p.panel}. Words ${words.map((w) => `"${w}"`).join(", ")} in Inter 400, ${size}px, tracking ${PRE.tracking}em, ${p.onPanel}, centred in one overflow-hidden mask 1.3em tall.`,
      `Each word rises from 110% below the mask over ${PRE.wordIn} frames (enter ${bezierText("enter")}) while the previous word moves up to 110% above in the same window and curve, like one strip, so they never overlap. Words start at frames ${tl.starts.join(", ")}; "${p.brand}" lands at ${tl.land} and holds.`,
      `Loading row, ${ratio === "16:9" ? "96px" : "8% of the width"} from the sides and 64px from the bottom: "${p.brand}" left and a 3-digit counter 000→100 right (Geist Mono 22px, uppercase, +0.12em, ${p.panelMuted}), over a ${STROKE.ring}px line (${p.panelMuted} at 30%) filling in ${p.accent} from frame 0 to ${tl.wipeA - 8} on travel. It fades out over the 8 frames before the wipe.`,
      `Frames ${tl.wipeA}–${tl.wipeB}: the panel's bottom edge travels from the bottom of the frame to the top on ${p.ease} (${bezierText(p.ease)}). The edge is a quadratic curve whose middle sags by sin(π·t) × ${Math.round(PRE.bulge * 100)}% of the frame height, so it is flat at both ends. The brand fades and lifts 120px over the first 40% of the wipe.`,
      `Underneath, a flat ${p.background} page: top nav with a 16px ${p.accent} dot + "${p.brand}" (30px/500) left and a two-line menu icon right; centred hero with a mono label "${[p.word1, p.word2, p.word3, p.word4].join(" · ")}" (22px, ${p.ink3}) over "${p.brand}" in Inter 400 at ~${Math.round(size * 1.15)}px, ${p.ink}; a ${p.card} product card (radius ${RADIUS.card}, 1px ${p.line} border${isDark(p.background) ? "" : ", soft shadow"}) peeking up from the bottom with grey skeleton bars.`,
      `The page rises 40px and fades in over ${PRE.heroIn} frames from frame ${tl.wipeA + 8} on enter.`,
      `Frames ${PRE.ret[0]}–${PRE.ret[1]}: the empty panel rises back from the bottom (its top edge leading with the same curve, enter), the loading row reappears at 000, and the last ${FINAL_HOLD} frames hold the full panel, identical to frame 0, so the ${c.seconds}s loop is seamless.`,
    ].join("\n");
  },
});
