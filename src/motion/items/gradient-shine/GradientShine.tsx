import React, { useId } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONT_SANS, progress, useLayout } from "../../kit";

export type GradientShineProps = {
  background: string;
  g1: string;
  g2: string;
  g3: string;
  shine: string;
  quiet: string;
  word: string;
  subline: string;
  bandWidth: number; // % of the word's width
  angle: number; // degrees the light band leans
  ease: string;
};

export const SHINE = { reveal: 30, sweepStart: 36, sweepDur: 50, base: 300, baseVertical: 230, charWidth: 0.58 } as const;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const GradientShine: React.FC<GradientShineProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, width, durationInFrames, isVertical } = useLayout();
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const word = p.word.trim() || "Radiant";
  const fs = Math.min((isVertical ? SHINE.baseVertical : SHINE.base) * u, (width * 0.86) / (word.length * 0.6));
  const H = fs * 1.3;
  const cx = width / 2;
  // SVG text can't be measured during render, so the gradients span an estimate of the word's width.
  const est = word.length * SHINE.charWidth * fs;
  const left = cx - est / 2;
  const band = (est * p.bandWidth) / 100;

  const r = progress(frame, 0, SHINE.reveal, p.ease);
  const sweep = progress(frame, SHINE.sweepStart, SHINE.sweepStart + SHINE.sweepDur, p.ease);
  const bandX = interpolate(sweep, [0, 1], [left - band * 1.2, left + est + band * 1.2]);
  const shineOpacity = interpolate(frame, [SHINE.sweepStart - 4, SHINE.sweepStart + 4], [0, 1], clamp);
  // A slow drift keeps the fill alive through the hold without looking like a second effect.
  const drift = interpolate(frame, [0, durationInFrames], [-0.06, 0.06]) * est;
  const sub = progress(frame, 20, 48, p.ease);

  const textProps = {
    x: cx,
    y: fs * 0.98,
    textAnchor: "middle" as const,
    fontSize: fs,
    fontWeight: 700,
    style: { fontFamily: FONT_SANS, letterSpacing: "-0.045em" },
  };

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id={`gs-glow${id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={p.g2} stopOpacity={0.22} />
            <stop offset="100%" stopColor={p.g2} stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx="50" cy="50" rx="40" ry="26" fill={`url(#gs-glow${id})`} opacity={r} />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width, height: H, overflow: "hidden" }}>
          <svg
            width={width}
            height={H}
            viewBox={`0 0 ${width} ${H}`}
            style={{
              display: "block",
              transform: `translateY(${(1 - r) * 34}%)`,
              opacity: interpolate(r, [0, 0.5], [0, 1], clamp),
              filter: `blur(${(Math.max(0, 1 - r) * 10 * u).toFixed(2)}px)`,
            }}
          >
            <defs>
              <linearGradient id={`gs-fill${id}`} gradientUnits="userSpaceOnUse" x1={left + drift} y1={0} x2={left + est + drift} y2={H * 0.6}>
                <stop offset="0%" stopColor={p.g1} />
                <stop offset="55%" stopColor={p.g2} />
                <stop offset="100%" stopColor={p.g3} />
              </linearGradient>
              <linearGradient
                id={`gs-band${id}`}
                gradientUnits="userSpaceOnUse"
                x1={bandX - band / 2}
                y1={H / 2}
                x2={bandX + band / 2}
                y2={H / 2}
                gradientTransform={`rotate(${p.angle} ${bandX} ${H / 2})`}
              >
                <stop offset="0%" stopColor={p.shine} stopOpacity={0} />
                <stop offset="32%" stopColor={p.shine} stopOpacity={0.22} />
                <stop offset="50%" stopColor={p.shine} stopOpacity={0.92} />
                <stop offset="68%" stopColor={p.shine} stopOpacity={0.22} />
                <stop offset="100%" stopColor={p.shine} stopOpacity={0} />
              </linearGradient>
            </defs>
            <text {...textProps} fill={`url(#gs-fill${id})`}>
              {word}
            </text>
            {/* The same word again, filled only by the light band, so the shine stays inside the letterforms. */}
            <text {...textProps} fill={`url(#gs-band${id})`} opacity={shineOpacity}>
              {word}
            </text>
          </svg>
        </div>
        {p.subline.trim() !== "" && (
          <div
            style={{
              marginTop: 6 * u,
              fontSize: 42 * u,
              fontWeight: 400,
              letterSpacing: "-0.012em",
              color: p.quiet,
              opacity: sub,
              transform: `translateY(${(1 - sub) * 18 * u}px)`,
            }}
          >
            {p.subline}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
