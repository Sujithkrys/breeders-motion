import React, { useId } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, alpha, progress, useLayout } from "../../kit";

export type MaskedWordRiseProps = {
  background: string;
  ink: string;
  quiet: string;
  accent: string;
  eyebrow: string;
  line1: string;
  line2: string;
  stagger: number; // frames between line 1 and line 2
  ease: string;
};

// Shared with the prompt so the copy always quotes the real timings.
export const RISE = { start: 8, wordGap: 3, wordDur: 24, blur: 8, base: 156, baseVertical: 132 } as const;

// Geist at 600–700 with -0.04em tracking averages ~0.55em per character; used to shrink long lines to fit.
const fitSize = (longest: number, maxW: number, base: number) => Math.min(base, maxW / (Math.max(longest, 1) * 0.55));

const Line: React.FC<{
  text: string;
  start: number;
  frame: number;
  ease: string;
  u: number;
  style: React.CSSProperties;
}> = ({ text, start, frame, ease, u, style }) => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return (
    // The mask: padding keeps descenders inside the clip, the negative margin gives the space back.
    <div style={{ overflow: "hidden", padding: "0.04em 0.06em 0.16em", margin: "0 0 -0.12em" }}>
      <div style={{ display: "flex", justifyContent: "center", gap: "0.24em", whiteSpace: "nowrap", ...style }}>
        {words.map((w, i) => {
          const p = progress(frame, start + i * RISE.wordGap, start + i * RISE.wordGap + RISE.wordDur, ease);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                transform: `translateY(${(1 - p) * 112}%)`,
                filter: `blur(${(Math.max(0, 1 - p) * RISE.blur * u).toFixed(2)}px)`,
                opacity: interpolate(p, [0, 0.55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export const MaskedWordRise: React.FC<MaskedWordRiseProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, width, isVertical } = useLayout();
  const longest = Math.max(p.line1.length, p.line2.length);
  const fs = fitSize(longest, width * (isVertical ? 0.86 : 0.8), (isVertical ? RISE.baseVertical : RISE.base) * u);
  const l2Start = RISE.start + p.stagger;
  const eyebrowIn = progress(frame, 0, 20, p.ease);
  const settle = progress(frame, 0, 96, "travel");
  // Unique per instance: the grid shows many of these at once with different palettes.
  const glowId = `mwr${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }} preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={p.accent} stopOpacity={0.14} />
            <stop offset="100%" stopColor={p.accent} stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx="50" cy="52" rx="42" ry="30" fill={`url(#${glowId})`} />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${0.97 + 0.03 * settle})` }}>
        {p.eyebrow.trim() !== "" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14 * u,
              marginBottom: 34 * u,
              padding: `${10 * u}px ${22 * u}px`,
              borderRadius: 999,
              border: `${1.5 * u}px solid ${alpha(p.ink, 0.16)}`,
              fontFamily: FONT_MONO,
              fontSize: 24 * u,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: p.quiet,
              opacity: eyebrowIn,
              transform: `translateY(${(1 - eyebrowIn) * 16 * u}px)`,
            }}
          >
            <span style={{ width: 12 * u, height: 12 * u, borderRadius: "50%", background: p.accent, boxShadow: `0 0 ${18 * u}px ${alpha(p.accent, 0.7)}` }} />
            {p.eyebrow}
          </div>
        )}
        <Line text={p.line1} start={RISE.start} frame={frame} ease={p.ease} u={u} style={{ fontSize: fs, lineHeight: 1.04, fontWeight: 650, letterSpacing: "-0.042em", color: p.ink }} />
        <Line text={p.line2} start={l2Start} frame={frame} ease={p.ease} u={u} style={{ fontSize: fs, lineHeight: 1.04, fontWeight: 400, letterSpacing: "-0.035em", color: p.quiet }} />
      </div>
    </AbsoluteFill>
  );
};
