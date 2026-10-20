import { EASE_OPTIONS, FINAL_HOLD, bezierText, systemPalettes, targetLine } from "../../kit";
import { defineMotion } from "../../types";
import { MaskedWordRise, RISE, fitSize, rowsFor, safeArea, type MaskedWordRiseProps } from "./MaskedWordRise";

const palettes = systemPalettes((t) => ({ background: t.bg, ink: t.ink, ink2: t.ink2, ink3: t.ink3, accent: t.accent }));

const DURATION = 120;

export default defineMotion<MaskedWordRiseProps>({
  slug: "masked-word-rise",
  name: "Masked Word Rise",
  description: "A calm two-tone headline rises word by word out of its masks, losing a light blur as it lands.",
  category: "text",
  tags: ["headline", "mask", "reveal", "blur", "launch"],
  addedAt: "2026-10-16",
  durationInFrames: DURATION,
  fps: 30,
  ratios: ["16:9", "9:16", "1:1"],
  component: MaskedWordRise,
  defaultProps: {
    ...palettes[0].values,
    label: "New in 4.0",
    line1: "Motion that ships.",
    line2: "Built for launch day.",
    stagger: 6,
    ease: "enter",
  } as MaskedWordRiseProps,
  palettes,
  controls: [
    { type: "text", key: "label", label: "Label", maxLength: 24 },
    { type: "text", key: "line1", label: "Line 1", maxLength: 26 },
    { type: "text", key: "line2", label: "Line 2", maxLength: 26 },
    { type: "color", key: "accent", label: "Accent" },
    { type: "color", key: "background", label: "Background" },
    { type: "number", key: "stagger", label: "Line stagger", min: 3, max: 15, step: 3, unit: "f" },
    { type: "select", key: "ease", label: "Easing", options: EASE_OPTIONS },
  ],
  prompt: (p, c) => {
    const u = Math.min(c.width, c.height) / 1080;
    const wide = c.width > c.height;
    const ratio = wide ? "wide" : c.width === c.height ? "square" : "vertical";
    const safe = safeArea(c.width, c.height, u);
    const r1 = rowsFor(p.line1, wide);
    const r2 = rowsFor(p.line2, wide);
    const size = Math.round(fitSize([...r1, ...r2], c.width - 2 * safe.x, RISE.base[ratio] * u) / u);
    const l2 = RISE.start + p.stagger;
    const lastStart = (line: string, start: number) => start + (Math.max(line.trim().split(/\s+/).filter(Boolean).length, 1) - 1) * RISE.wordGap;
    const end = Math.max(lastStart(p.line1, RISE.start), lastStart(p.line2, l2)) + RISE.wordDur;
    const rowsText = (rows: string[][]) => rows.map((r) => `"${r.join(" ")}"`).join(" / ");
    return [
      targetLine(c.target, "a calm two-tone headline whose words rise one by one out of their line masks", c.width, c.height, c.seconds),
      `Background: flat ${p.background}, nothing else on the canvas. Everything centred; sizes are px at 1080 on the short side; keep type inside a ${Math.round(safe.x / u)}px left/right, ${Math.round(safe.y / u)}px top/bottom safe area.`,
      `Type: Inter ${RISE.weight}, sentence case, ${size}px, tracking ${RISE.tracking}em, line height ${RISE.lineHeight}. Line 1 ${rowsText(r1)} in ${p.ink}; line 2 ${rowsText(r2)} in ${p.ink2}, the same size and weight, so the hierarchy is the grey step, not colour or weight.`,
      p.label.trim()
        ? `Above it, 40px gap: a tiny label "${p.label}" in Geist Mono ${RISE.labelSize}px uppercase, +0.12em tracking, ${p.ink3}, led by a flat 10px ${p.accent} dot (the only accent in the frame).`
        : `No label; the frame uses no accent colour.`,
      `Geometry: each row sits in its own overflow-hidden mask with 0.18em padding below for descenders (pulled back with a -0.14em margin). No glows, gradients or shadows.`,
      "",
      `Motion: frames 0–${RISE.labelDur}, the label fades in and rises 12px.`,
      `Every word starts 110% of the line height below its mask, at 0 opacity with a ${RISE.blur}px blur, and rises into place over ${RISE.wordDur} frames; opacity reaches 1 halfway and the blur clears by the end.`,
      `Words stagger ${RISE.wordGap} frames apart. Line 1 starts at frame ${RISE.start}, line 2 at frame ${l2} (${p.stagger}-frame line stagger).`,
      `Ease ${p.ease}: ${bezierText(p.ease)}. The last word lands at frame ${end}; hold the finished headline perfectly still to frame ${DURATION} (at least the final ${FINAL_HOLD} frames).`,
    ].join("\n");
  },
});
