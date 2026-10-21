import { FINAL_HOLD, STROKE, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { FLIP, FlipText, sizeFor, slotsOf, waveOf, wordsOf, type FlipTextProps } from "./FlipText";

const palettes = systemPalettes((t) => ({ background: t.bg, ink: t.ink, ink2: t.ink2, line: t.line, accent: t.accent }));

const DURATION = 180;

export default defineMotion<FlipTextProps>({
  slug: "flip-text",
  name: "Flip Text",
  description: "A big word whose letters flip over in a 3D wave, one after another, into the next word.",
  category: "text",
  tags: ["flip", "3d", "letters", "wave", "loop"],
  addedAt: "2026-10-22",
  durationInFrames: DURATION,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: FlipText,
  defaultProps: {
    ...palettes[0].values,
    word1: "Design",
    word2: "Develop",
    word3: "Deploy",
    wave: 3,
  } as FlipTextProps,
  palettes,
  controls: [
    { type: "text", key: "word1", label: "Word 1", maxLength: 10 },
    { type: "text", key: "word2", label: "Word 2", maxLength: 10 },
    { type: "text", key: "word3", label: "Word 3", maxLength: 10 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Canvas" },
    { type: "number", key: "wave", label: "Wave stagger", min: 1, max: 4, step: 1, unit: "f" },
  ],
  prompt: (p, c) => {
    const u = Math.min(c.width, c.height) / 1080;
    const ratio = c.width === c.height ? "1:1" : c.width > c.height ? "16:9" : "9:16";
    const words = wordsOf(p);
    const slots = slotsOf(words);
    const wave = waveOf(p.wave, slots);
    const size = Math.round(sizeFor(words, c.width, u, ratio) / u);
    const w = Math.round(wave * 10) / 10;
    return [
      targetLine(c.target, `a big word whose letters flip over in a 3D wave into the next word: ${words.map((x) => `"${x}"`).join(" → ")} → back to "${words[0]}"`, c.width, c.height, c.seconds),
      `Background: flat ${p.background}. Centred; sizes are px at 1080 on the short side. No gradients, glows or shadows.`,
      `Type: Inter 400, ${size}px, tracking ${FLIP.tracking}em, ${p.ink}, followed by a full stop in ${p.accent} (the only accent).`,
      `Pad every word with spaces to ${slots} characters. Each character is one inline-block span with one text node, its own transform perspective(${FLIP.perspective}em) and transform-origin 50% 58%. Its width is the glyph's Inter advance + tracking (padding spaces are 0 wide), eased between the old and new glyph widths over the flip on travel ${bezierText("travel")}, so the word re-flows and re-centres smoothly.`,
      `Flips start at frames ${FLIP.at.join(", ")}; character i starts ${w} × i frames later. Each one: the old glyph turns rotateX 0° → −90° over ${FLIP.half} frames on exit ${bezierText("exit")}; the span swaps to the new glyph edge-on, which turns 90° → 0° over ${FLIP.roll} frames on a spring (damping ${FLIP.spring.damping}, mass ${FLIP.spring.mass}, stiffness ${FLIP.spring.stiffness}), overshooting slightly.`,
      `Shade each glyph from ${p.ink} toward ${p.ink2} by |sin(angle)|, so it darkens as it turns away.`,
      `64px below: three step marks, 56×${STROKE.bar}px with round ends and 12px gaps, ${p.line}; the current word's mark blends to ${p.ink} over 12 frames around the middle of each wave.`,
      `Every flip lands by frame ${FLIP.doneBy}; the last ${FINAL_HOLD} frames hold "${words[0]}." still, matching frame 0, so the ${c.seconds}s loop is seamless.`,
    ].join("\n");
  },
});
