import { EASE_OPTIONS, FINAL_HOLD, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { BLUR, BlurReveal, fitSize, rowsFor, schedule, type BlurRevealProps } from "./BlurReveal";

const palettes = systemPalettes((t) => ({ background: t.bg, ink: t.ink, ink2: t.ink2, accent: t.accent }));

const DURATION = 150;

export default defineMotion<BlurRevealProps>({
  slug: "blur-reveal",
  name: "Blur Reveal Text",
  description: "A two-line statement that sharpens out of a blur, word by word on the first line and letter by letter on the second, then blurs away for the loop.",
  category: "text",
  tags: ["headline", "blur", "reveal", "stagger", "loop"],
  addedAt: "2026-10-22",
  durationInFrames: DURATION,
  fps: 30,
  ratios: ["16:9", "1:1", "9:16"],
  component: BlurReveal,
  defaultProps: {
    ...palettes[0].values,
    line1: "Plans that actually ship.",
    line2: "Calm software for busy teams.",
    accentWord: "ship",
    stagger: 5,
    ease: "enter",
  } as BlurRevealProps,
  palettes,
  controls: [
    { type: "text", key: "line1", label: "Line 1 (by word)", maxLength: 28 },
    { type: "text", key: "line2", label: "Line 2 (by letter)", maxLength: 30 },
    { type: "text", key: "accentWord", label: "Accent word", maxLength: 14 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Canvas" },
    { type: "number", key: "stagger", label: "Word stagger", min: 3, max: 8, step: 1, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const u = Math.min(c.width, c.height) / 1080;
    const wide = c.width > c.height;
    const ratio = wide ? "wide" : c.width === c.height ? "square" : "vertical";
    const safe = wide ? 96 : Math.round((c.width * 0.08) / u);
    const r1 = rowsFor(p.line1, wide);
    const r2 = rowsFor(p.line2, wide);
    const size = Math.round(fitSize([...r1, ...r2], c.width - 2 * safe * u, BLUR.base[ratio] * u) / u);
    const sc = schedule(p.line1, p.line2, p.stagger);
    const rowsText = (rows: string[][]) => rows.map((r) => `"${r.join(" ")}"`).join(" / ");
    const f1 = (n: number) => String(Math.round(n * 10) / 10);
    return [
      targetLine(c.target, "a two-line statement that sharpens out of a blur, word by word then letter by letter, and blurs away for the loop", c.width, c.height, c.seconds),
      `Background: flat ${p.background}; text centred, ${safe}px side safe area, sizes in px at 1080 on the short side. No gradients, glows or shadows.`,
      `Type: Inter 400, ${size}px, tracking ${BLUR.tracking}em, line height ${BLUR.lineHeight}, sentence case. Line 1 ${rowsText(r1)} in ${p.ink}; line 2 ${rowsText(r2)} in ${p.ink2}.${p.accentWord.trim() ? ` The word "${p.accentWord}" is ${p.accent}, the only accent.` : ""}`,
      `Line 1 animates per word (one span each); line 2 per character (one span per letter, words kept together with a 0.24em gap). Each unit goes from blur(${BLUR.blur}px), opacity 0 and +${BLUR.rise}px y to sharp, opaque and in place; opacity is full by 70% of its move. filter: blur only, no masks.`,
      `Frames 0–${BLUR.outAt}: hold the sharp statement. Then everything reverses on exit ${bezierText("exit")}, ${BLUR.outDur} frames per unit: line-1 words ${BLUR.outWord} frames apart, line-2 letters ${BLUR.outChar} frames apart starting 4 frames in.`,
      `From frame ${BLUR.inAt}: line-1 words sharpen over ${BLUR.wordDur} frames, ${f1(sc.word)} frames apart; line-2 letters from frame ${f1(sc.line2At)}, ${BLUR.charDur} frames each, ${f1(sc.char)} frames apart. Ease ${p.ease}: ${bezierText(p.ease)}.`,
      `Everything is sharp by frame ${Math.ceil(sc.end)}; hold still to frame ${DURATION} (at least the last ${FINAL_HOLD} frames), which matches frame 0, so the ${c.seconds}s loop is seamless.`,
    ].join("\n");
  },
});
