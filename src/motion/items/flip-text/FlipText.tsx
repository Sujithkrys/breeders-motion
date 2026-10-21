import React from "react";
import { AbsoluteFill, interpolateColors, spring, useCurrentFrame } from "remotion";
import { FONT_SANS, STROKE, mix, progress, useLayout } from "../../kit";

export type FlipTextProps = {
  background: string;
  ink: string; // the word
  ink2: string; // a character's shade as it turns edge-on
  line: string; // inactive step marks
  accent: string; // the full stop
  word1: string;
  word2: string;
  word3: string;
  wave: number; // frames between neighbouring characters
};

// Timing in frames on the 180-frame loop: three flips (1 → 2, 2 → 3, 3 → 1), each a wave from left to right.
export const FLIP = {
  at: [8, 68, 128], // the first character of each flip starts
  half: 7, // the old character turns away, 0° → 90° (exit)
  roll: 14, // the new character turns in, 90° → 0°, on a spring with a small overshoot
  doneBy: 168, // the last character settles here; the final 12 frames hold
  spring: { damping: 11, mass: 0.6, stiffness: 160 },
  tracking: -0.04,
  base: { wide: 200, square: 180, vertical: 170 },
  perspective: 4, // em
} as const;

// Inter 400 advance widths at display optical size (opsz 32), per 1000 em. Slot widths come from these so the word
// keeps its natural spacing and re-flows smoothly while characters change.
const GLYPHS = " abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:-'!?&/@_#%+$";
const ADV = [
  250, 518, 565, 523, 565, 536, 306, 565, 547, 206, 206, 507, 206, 839, 547, 549, 565, 565, 322, 475, 311, 547, 512, 752, 507, 512, 479, 653, 638, 722,
  689, 580, 554, 730, 708, 232, 535, 634, 535, 857, 710, 749, 612, 749, 632, 614, 610, 703, 653, 949, 646, 643, 613, 613, 362, 561, 599, 618, 577, 584,
  516, 582, 584, 220, 220, 220, 429, 254, 220, 524, 608, 325, 974, 454, 600, 844, 628, 614,
];
const adv = (c: string) => (GLYPHS.indexOf(c) < 0 ? 0.56 : ADV[GLYPHS.indexOf(c)] / 1000);
// A slot's width in em; padding beyond the word's length takes no room.
export const slotEm = (word: string, i: number) => (i < word.length ? adv(word[i]) + FLIP.tracking : 0);
export const wordEm = (word: string) => [...word].reduce((a, c) => a + adv(c) + FLIP.tracking, 0);

export const wordsOf = (p: FlipTextProps) => [p.word1, p.word2, p.word3].map((w) => String(w ?? ""));
export const slotsOf = (words: string[]) => Math.max(1, ...words.map((w) => w.length));
// Stagger between characters, tightened for long words so the last flip lands before the final hold.
export const waveOf = (wave: number, slots: number) => {
  const room = FLIP.doneBy - FLIP.at[FLIP.at.length - 1] - FLIP.half - FLIP.roll;
  return Math.max(0, Math.min(Number(wave) || 0, slots > 1 ? room / (slots - 1) : room));
};
export const sizeFor = (words: string[], width: number, u: number, ratio: string) => {
  const base = (ratio === "16:9" ? FLIP.base.wide : ratio === "1:1" ? FLIP.base.square : FLIP.base.vertical) * u;
  const widest = Math.max(0.5, ...words.map(wordEm)) + adv(".");
  const safe = ratio === "16:9" ? 96 * u : width * 0.08;
  return Math.min(base, (width - 2 * safe) / widest);
};

type Slot = { ch: string; angle: number; width: number };

const slotAt = (frame: number, fps: number, i: number, words: string[], wave: number): Slot => {
  let k = -1; // the last flip this character has started
  FLIP.at.forEach((at, j) => {
    if (frame >= at + i * wave) k = j;
  });
  const pad = (w: string) => (i < w.length ? w[i] : " ");
  if (k < 0) return { ch: pad(words[0]), angle: 0, width: slotEm(words[0], i) };
  const from = words[k % 3];
  const to = words[(k + 1) % 3];
  const local = frame - (FLIP.at[k] + i * wave);
  const width = mix(slotEm(from, i), slotEm(to, i), progress(local, 0, FLIP.half + FLIP.roll, "travel"));
  if (local < FLIP.half) return { ch: pad(from), angle: -90 * progress(local, 0, FLIP.half, "exit"), width };
  const s = spring({ frame: local - FLIP.half, fps, config: FLIP.spring, durationInFrames: FLIP.roll });
  return { ch: pad(to), angle: 90 * (1 - s), width };
};

export const FlipText: React.FC<FlipTextProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, width, fps, ratio } = useLayout();
  const words = wordsOf(p);
  const slots = slotsOf(words);
  const wave = waveOf(p.wave, slots);
  const size = sizeFor(words, width, u, ratio);

  // Step marks: the active one follows the middle of each wave.
  const mid = (j: number) => FLIP.at[j] + ((slots - 1) * wave) / 2 + FLIP.half;
  const [t0, t1, t2] = [0, 1, 2].map((j) => progress(frame, mid(j) - 4, mid(j) + 8, "travel"));
  const steps = [1 - t0 + t2, t0 - t1, t1 - t2];
  const markW = 56 * u;
  const markGap = 12 * u;
  const markH = STROKE.bar * u;

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 64 * u }}>
        <div style={{ display: "flex", alignItems: "baseline", fontSize: size, fontWeight: 400, letterSpacing: `${FLIP.tracking}em`, lineHeight: 1.2, color: p.ink, whiteSpace: "pre" }}>
          {Array.from({ length: slots }, (_, i) => {
            const s = slotAt(frame, fps, i, words, wave);
            const shade = Math.min(1, Math.abs(Math.sin((s.angle * Math.PI) / 180)));
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  width: `${s.width.toFixed(4)}em`,
                  textAlign: "center",
                  transform: `perspective(${(FLIP.perspective * size).toFixed(1)}px) rotateX(${s.angle.toFixed(2)}deg)`,
                  transformOrigin: "50% 58%",
                  color: interpolateColors(shade, [0, 1], [p.ink, p.ink2]),
                }}
              >
                {s.ch}
              </span>
            );
          })}
          <span style={{ display: "inline-block", color: p.accent }}>.</span>
        </div>
        <svg width={3 * markW + 2 * markGap} height={markH} style={{ display: "block" }}>
          {steps.map((v, j) => (
            <rect key={j} x={j * (markW + markGap)} y={0} width={markW} height={markH} rx={markH / 2} fill={interpolateColors(Math.max(0, Math.min(1, v)), [0, 1], [p.line, p.ink])} />
          ))}
        </svg>
      </div>
    </AbsoluteFill>
  );
};
