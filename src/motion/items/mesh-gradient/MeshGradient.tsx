import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_SANS, useLayout } from "../../kit";

export type MeshGradientProps = {
  background: string;
  c1: string;
  c2: string;
  c3: string;
  c4: string;
  c5: string;
  ink: string;
  title: string; // empty hides it
  drift: number; // % of the frame each blob wanders
  grain: number; // % opacity of the noise layer
};

const TAU = Math.PI * 2;

// Base position (fraction of frame), radius (fraction of the long side), whole-number Lissajous frequencies so the
// loop closes exactly, and phase offsets in turns.
export const BLOBS = [
  { x: 0.2, y: 0.25, r: 0.55, fx: 1, fy: 2, px: 0, py: 0.25 },
  { x: 0.8, y: 0.28, r: 0.5, fx: 2, fy: 1, px: 0.33, py: 0.1 },
  { x: 0.72, y: 0.8, r: 0.58, fx: 1, fy: 1, px: 0.6, py: 0.85 },
  { x: 0.22, y: 0.82, r: 0.46, fx: 1, fy: 2, px: 0.15, py: 0.55 },
  { x: 0.5, y: 0.5, r: 0.38, fx: 2, fy: 1, px: 0.75, py: 0.4 },
];

export const MeshGradient: React.FC<MeshGradientProps> = (p) => {
  const frame = useCurrentFrame();
  const { width: w, height: h, durationInFrames, u, isVertical } = useLayout();
  // Several players share one page, so gradient and filter ids must be unique per instance.
  const id = "mg" + React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const t = frame / durationInFrames;
  const big = Math.max(w, h);
  const amp = p.drift / 100;
  const colors = [p.c1, p.c2, p.c3, p.c4, p.c5];

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          {BLOBS.map((_, i) => (
            <radialGradient key={i} id={`${id}b${i}`}>
              <stop offset="0" stopColor={colors[i]} stopOpacity={0.95} />
              <stop offset="0.45" stopColor={colors[i]} stopOpacity={0.55} />
              <stop offset="1" stopColor={colors[i]} stopOpacity={0} />
            </radialGradient>
          ))}
          <filter id={`${id}n`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency={0.85 / u} numOctaves={2} seed={11} stitchTiles="stitch" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1" />
          </filter>
        </defs>
        {BLOBS.map((b, i) => {
          const cx = w * (b.x + amp * Math.sin(TAU * (b.fx * t + b.px)));
          const cy = h * (b.y + amp * Math.sin(TAU * (b.fy * t + b.py)));
          const r = b.r * big * (1 + 0.08 * Math.sin(TAU * (t + b.px)));
          return <circle key={i} cx={cx} cy={cy} r={r} fill={`url(#${id}b${i})`} />;
        })}
        {p.grain > 0 ? <rect x={0} y={0} width={w} height={h} filter={`url(#${id}n)`} opacity={p.grain / 100} /> : null}
      </svg>
      {p.title.trim() ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              color: p.ink,
              fontSize: (isVertical ? 120 : 156) * u,
              fontWeight: 650,
              letterSpacing: "-0.04em",
              lineHeight: 1.02,
              textAlign: "center",
              maxWidth: "84%",
            }}
          >
            {p.title}
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
