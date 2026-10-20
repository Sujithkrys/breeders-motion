import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONT_SANS, alpha, progress, useLayout } from "../../kit";

export type HighlightSweepProps = {
  background: string;
  ink: string;
  markInk: string; // text colour once a highlight has passed over it
  mark1Color: string;
  mark2Color: string;
  text: string; // lines separated by "/"
  mark1: string;
  mark2: string;
  sweep: number; // frames per highlight sweep
  ease: string;
};

export const SWEEP = { lineGap: 5, lineDur: 26, first: 36, pause: 8, base: 112, baseVertical: 96 } as const;

export const splitLines = (text: string) =>
  text
    .split("/")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 3);

export type Mark = { line: number; start: number; end: number; slot: 0 | 1 };

// Finds mark1, then mark2 after it (falling back to anywhere that doesn't overlap). Marks never span a line break.
export const findMarks = (lines: string[], m1: string, m2: string): Mark[] => {
  const find = (needle: string, slot: 0 | 1, fromLine: number, fromIdx: number): Mark | null => {
    const n = needle.trim().toLowerCase();
    if (!n) return null;
    for (let l = fromLine; l < lines.length; l++) {
      const idx = lines[l].toLowerCase().indexOf(n, l === fromLine ? fromIdx : 0);
      if (idx >= 0) return { line: l, start: idx, end: idx + n.length, slot };
    }
    return null;
  };
  const out: Mark[] = [];
  const a = find(m1, 0, 0, 0);
  if (a) out.push(a);
  const b = (a ? find(m2, 1, a.line, a.end) : null) ?? find(m2, 1, 0, 0);
  if (b && !(a && a.line === b.line && b.start < a.end && b.end > a.start)) out.push(b);
  return out;
};

const Highlight: React.FC<{ text: string; s: number; color: string; ink: string; markInk: string }> = ({ text, s, color, ink, markInk }) => {
  const reveal = Math.min(1, Math.max(0, s));
  return (
    <span style={{ position: "relative", display: "inline-block", padding: "0 0.1em", margin: "0 -0.1em", whiteSpace: "pre" }}>
      <span
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "0.2em",
          bottom: "0.05em",
          borderRadius: "0.12em",
          background: `linear-gradient(90deg, ${alpha(color, 0.82)}, ${color} 40%, ${color})`,
          transform: `rotate(-1.2deg) scaleX(${Math.max(0, s)})`,
          transformOrigin: "left center",
        }}
      />
      <span style={{ position: "relative", color: ink }}>{text}</span>
      {/* A second copy in markInk, clipped to the swept part, so the text flips colour exactly under the marker. */}
      <span style={{ position: "absolute", inset: 0, padding: "0 0.1em", color: markInk, clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)` }}>{text}</span>
    </span>
  );
};

export const HighlightSweep: React.FC<HighlightSweepProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, width, isVertical } = useLayout();
  const lines = splitLines(p.text);
  const marks = findMarks(lines, p.mark1, p.mark2);
  const longest = Math.max(1, ...lines.map((l) => l.length));
  const fs = Math.min((isVertical ? SWEEP.baseVertical : SWEEP.base) * u, (width * (isVertical ? 0.86 : 0.8)) / (longest * 0.52));
  const sweepStart = (slot: 0 | 1) => SWEEP.first + slot * (p.sweep + SWEEP.pause);
  const colors = [p.mark1Color, p.mark2Color];

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", fontSize: fs, fontWeight: 600, letterSpacing: "-0.035em", lineHeight: 1.14, color: p.ink }}>
        {lines.map((line, li) => {
          const t = progress(frame, li * SWEEP.lineGap, li * SWEEP.lineGap + SWEEP.lineDur, p.ease);
          const own = marks.filter((m) => m.line === li).sort((a, b) => a.start - b.start);
          const parts: React.ReactNode[] = [];
          let cursor = 0;
          own.forEach((m, k) => {
            if (m.start > cursor) parts.push(<span key={`t${k}`}>{line.slice(cursor, m.start)}</span>);
            const s = progress(frame, sweepStart(m.slot), sweepStart(m.slot) + p.sweep, p.ease);
            parts.push(<Highlight key={`m${k}`} text={line.slice(m.start, m.end)} s={s} color={colors[m.slot]} ink={p.ink} markInk={p.markInk} />);
            cursor = m.end;
          });
          if (cursor < line.length) parts.push(<span key="tail">{line.slice(cursor)}</span>);
          return (
            <div
              key={li}
              style={{
                whiteSpace: "pre",
                opacity: interpolate(t, [0, 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                transform: `translateY(${(1 - t) * 36 * u}px)`,
                filter: `blur(${Math.max(0, 1 - t) * 6 * u}px)`,
              }}
            >
              {parts}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
