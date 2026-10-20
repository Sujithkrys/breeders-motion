import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, STAGGER, progress, useLayout } from "../../kit";

export type MaskedWordRiseProps = {
  background: string;
  ink: string; // line 1
  ink2: string; // line 2, the quiet half of the two-tone headline
  ink3: string; // the tiny mono label
  accent: string; // the label's dot, the only accent in the frame
  label: string;
  line1: string;
  line2: string;
  stagger: number; // frames between line 1 and line 2
  ease: string;
};

// Shared with the prompt so the copy always quotes the real timings and sizes.
export const RISE = {
  start: 8, // first word of line 1 starts rising
  wordGap: STAGGER, // frames between words
  wordDur: 22, // one word's entrance
  labelDur: 18,
  blur: 6, // px at 1080, gone as the word lands
  weight: 400,
  tracking: -0.045, // em
  lineHeight: 1.06,
  base: { wide: 156, square: 136, vertical: 128 },
  labelSize: 22,
} as const;

// Inter 400 at -0.045em averages ~0.5em per character; 0.54 keeps a margin so nothing clips.
const EM_PER_CHAR = 0.54;

// Safe area: 96/80px at 16:9 (1080 tall), 8% / 7% of the frame in the other ratios.
export const safeArea = (width: number, height: number, u: number) =>
  width > height ? { x: 96 * u, y: 80 * u } : { x: width * 0.08, y: height * 0.07 };

// Outside 16:9 a long line breaks into two balanced rows so the type stays large.
export const rowsFor = (line: string, wide: boolean): string[][] => {
  const words = line.trim().split(/\s+/).filter(Boolean);
  if (wide || words.length < 2 || line.trim().length <= 12) return words.length ? [words] : [];
  let best = 1;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ").length;
    const b = words.slice(i).join(" ").length;
    const cur = Math.max(words.slice(0, best).join(" ").length, words.slice(best).join(" ").length);
    if (Math.max(a, b) < cur) best = i;
  }
  return [words.slice(0, best), words.slice(best)];
};

export const fitSize = (rows: string[][], maxW: number, base: number) => {
  const longest = Math.max(1, ...rows.map((r) => r.join(" ").length));
  return Math.min(base, maxW / (longest * EM_PER_CHAR));
};

type Row = { words: string[]; color: string; start: number };

const MaskRow: React.FC<{ row: Row; frame: number; ease: string; u: number; size: number }> = ({ row, frame, ease, u, size }) => (
  // The mask: padding keeps descenders inside the clip, the negative margin gives the space back.
  <div style={{ overflow: "hidden", padding: "0.04em 0.08em 0.18em", margin: "0 0 -0.14em" }}>
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "0.24em",
        whiteSpace: "nowrap",
        fontSize: size,
        fontWeight: RISE.weight,
        letterSpacing: `${RISE.tracking}em`,
        lineHeight: RISE.lineHeight,
        color: row.color,
      }}
    >
      {row.words.map((w, i) => {
        const s = row.start + i * RISE.wordGap;
        const p = progress(frame, s, s + RISE.wordDur, ease);
        const b = Math.max(0, 1 - p) * RISE.blur * u;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              transform: `translateY(${((1 - p) * 110).toFixed(3)}%)`,
              opacity: interpolate(p, [0, 0.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              filter: b > 0.05 ? `blur(${b.toFixed(2)}px)` : undefined,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  </div>
);

export const MaskedWordRise: React.FC<MaskedWordRiseProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, width, height, ratio } = useLayout();
  const wide = ratio === "16:9";
  const safe = safeArea(width, height, u);
  const rows1 = rowsFor(p.line1, wide);
  const rows2 = rowsFor(p.line2, wide);
  const base = (wide ? RISE.base.wide : ratio === "1:1" ? RISE.base.square : RISE.base.vertical) * u;
  const size = fitSize([...rows1, ...rows2], width - 2 * safe.x, base);

  // Words keep one running stagger across the rows of a line; line 2 starts `stagger` frames after line 1.
  const rows: Row[] = [];
  let k = 0;
  rows1.forEach((words) => {
    rows.push({ words, color: p.ink, start: RISE.start + k * RISE.wordGap });
    k += words.length;
  });
  k = 0;
  rows2.forEach((words) => {
    rows.push({ words, color: p.ink2, start: RISE.start + p.stagger + k * RISE.wordGap });
    k += words.length;
  });

  const labelIn = progress(frame, 0, RISE.labelDur, p.ease);

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {p.label.trim() !== "" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14 * u,
              marginBottom: 40 * u,
              fontFamily: FONT_MONO,
              fontSize: RISE.labelSize * u,
              fontWeight: 400,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              lineHeight: 1,
              whiteSpace: "nowrap",
              color: p.ink3,
              opacity: labelIn,
              transform: `translateY(${((1 - labelIn) * 12 * u).toFixed(2)}px)`,
            }}
          >
            <span style={{ width: 10 * u, height: 10 * u, borderRadius: 999, background: p.accent }} />
            {p.label}
          </div>
        )}
        {rows.map((row, i) => (
          <MaskRow key={i} row={row} frame={frame} ease={p.ease} u={u} size={size} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
