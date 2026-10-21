import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONT_SANS, progress, useLayout } from "../../kit";

export type BlurRevealProps = {
  background: string;
  ink: string; // line 1
  ink2: string; // line 2, the quiet half
  accent: string; // the accent word
  line1: string;
  line2: string;
  accentWord: string;
  stagger: number; // frames between words of line 1
  ease: string;
};

// Timing in frames on the 150-frame loop. Frame 0 is the finished statement: it holds, blurs out, then reveals again
// and holds through the end, so the loop point and the poster are both the sharp statement.
export const BLUR = {
  outAt: 16, // the blur-out starts
  outDur: 14, // one unit leaving (exit)
  outWord: 2, // frames between line-1 words leaving
  outChar: 0.8, // frames between line-2 characters leaving
  inAt: 62, // the reveal starts
  wordDur: 22, // one word arriving
  charDur: 18, // one character arriving
  char: 1.2, // frames between characters of line 2
  lineGap: 4, // frames between the last word of line 1 starting and line 2 starting
  settleBy: 138, // everything is sharp by here; the last 12 frames hold
  blur: 12, // px at 1080
  rise: 12, // px at 1080
  tracking: -0.04,
  lineHeight: 1.08,
  base: { wide: 150, square: 128, vertical: 120 },
} as const;

const clean = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
export const isAccent = (word: string, accentWord: string) => clean(accentWord) !== "" && clean(word) === clean(accentWord);

const splitWords = (s: string) => s.trim().split(/\s+/).filter(Boolean);

// Outside 16:9 a long line breaks into two balanced rows so the type stays large.
export const rowsFor = (line: string, wide: boolean): string[][] => {
  const words = splitWords(line);
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
  return Math.min(base, maxW / (longest * 0.54));
};

// Start frames of every unit on the way in, squeezed if a long statement would run into the final hold.
export const schedule = (line1: string, line2: string, stagger: number) => {
  const n1 = splitWords(line1).length;
  const n2 = splitWords(line2).join("").length;
  const st = Math.max(1, Math.min(8, Number(stagger) || 5));
  const natural = Math.max(0, n1 - 1) * st + BLUR.lineGap + Math.max(0, n2 - 1) * BLUR.char + BLUR.charDur;
  const k = Math.min(1, (BLUR.settleBy - BLUR.inAt) / Math.max(1, natural));
  return { word: st * k, line2At: BLUR.inAt + (Math.max(0, n1 - 1) * st + BLUR.lineGap) * k, char: BLUR.char * k, n1, n2, end: BLUR.inAt + natural * k };
};

export const BlurReveal: React.FC<BlurRevealProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, width, ratio } = useLayout();
  const wide = ratio === "16:9";
  const safeX = wide ? 96 * u : width * 0.08;
  const rows1 = rowsFor(p.line1, wide);
  const rows2 = rowsFor(p.line2, wide);
  const base = (wide ? BLUR.base.wide : ratio === "1:1" ? BLUR.base.square : BLUR.base.vertical) * u;
  const size = fitSize([...rows1, ...rows2], width - 2 * safeX, base);
  const sc = schedule(p.line1, p.line2, p.stagger);

  // v: 1 = sharp and in place, 0 = blurred, transparent, 12px low.
  const unit = (outAt: number, inAt: number, inDur: number): React.CSSProperties => {
    const v = frame < BLUR.inAt ? 1 - progress(frame, outAt, outAt + BLUR.outDur, "exit") : progress(frame, inAt, inAt + inDur, p.ease);
    const b = (1 - Math.min(1, Math.max(0, v))) * BLUR.blur * u;
    return {
      display: "inline-block",
      opacity: interpolate(v, [0, 0.7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      transform: `translateY(${((1 - v) * BLUR.rise * u).toFixed(3)}px)`,
      filter: b > 0.05 ? `blur(${b.toFixed(2)}px)` : undefined,
    };
  };

  const rowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    gap: "0.24em",
    whiteSpace: "pre",
    fontSize: size,
    fontWeight: 400,
    letterSpacing: `${BLUR.tracking}em`,
    lineHeight: BLUR.lineHeight,
  };

  let w = 0; // running word index across line 1
  let c = 0; // running character index across line 2
  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {rows1.map((row, r) => (
          <div key={`a${r}`} style={{ ...rowStyle, color: p.ink }}>
            {row.map((word) => {
              const i = w++;
              return (
                <span key={i} style={{ ...unit(BLUR.outAt + i * BLUR.outWord, BLUR.inAt + i * sc.word, BLUR.wordDur), color: isAccent(word, p.accentWord) ? p.accent : undefined }}>
                  {word}
                </span>
              );
            })}
          </div>
        ))}
        {rows2.map((row, r) => (
          <div key={`b${r}`} style={{ ...rowStyle, color: p.ink2 }}>
            {row.map((word, wi) => (
              <span key={wi} style={{ display: "inline-flex", color: isAccent(word, p.accentWord) ? p.accent : undefined }}>
                {[...word].map((ch) => {
                  const j = c++;
                  return (
                    <span key={j} style={unit(BLUR.outAt + 4 + j * BLUR.outChar, sc.line2At + j * sc.char, BLUR.charDur)}>
                      {ch}
                    </span>
                  );
                })}
              </span>
            ))}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
