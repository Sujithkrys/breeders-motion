import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_SANS, alpha, useLayout } from "../../kit";

export type AuroraRibbonsProps = {
  background: string;
  c1: string;
  c2: string;
  c3: string;
  ink: string;
  title: string; // empty hides it
  sway: number; // wave amplitude, px at 1080 short side
  softness: number; // blur, px at 1080 short side
};

const TAU = Math.PI * 2;
const STEPS = 26;

// y: resting height (fraction of frame). k1/k2: spatial frequencies. s1/s2: whole cycles per loop, so it closes.
export const RIBBONS = [
  { y: 0.3, k1: 0.9, k2: 1.9, s1: 1, s2: 2, ph: 0, thick: 1 },
  { y: 0.45, k1: 1.2, k2: 2.4, s1: 1, s2: 1, ph: 0.35, thick: 0.8 },
  { y: 0.6, k1: 0.7, k2: 1.6, s1: 2, s2: 1, ph: 0.7, thick: 0.9 },
];

type Pt = [number, number];

// Quadratic curves through the midpoints: smooth enough under blur and cheap to build every frame.
const curve = (pts: Pt[], start: "M" | "L") => {
  let d = `${start}${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += `Q${pts[i][0]} ${pts[i][1]} ${mx} ${my}`;
  }
  const last = pts[pts.length - 1];
  return `${d}L${last[0]} ${last[1]}`;
};

export const AuroraRibbons: React.FC<AuroraRibbonsProps> = (p) => {
  const frame = useCurrentFrame();
  const { width: w, height: h, durationInFrames, u, isVertical } = useLayout();
  const id = "ar" + React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const t = frame / durationInFrames;
  const colors = [p.c1, p.c2, p.c3];
  const amp = p.sway * u;
  const blur = p.softness * u;
  // Draw past the frame so the blur never fades in from the edges.
  const pad = blur * 3 + amp;
  const T0 = Math.min(w, h) * 0.22 * (isVertical ? 1.3 : 1);

  const shapes = RIBBONS.map((rb, i) => {
    const top: Pt[] = [];
    const bottom: Pt[] = [];
    for (let s = 0; s <= STEPS; s++) {
      const xn = s / STEPS;
      const x = -pad + xn * (w + 2 * pad);
      const y =
        rb.y * h +
        amp * (0.65 * Math.sin(TAU * (rb.k1 * xn + rb.s1 * t + rb.ph)) + 0.35 * Math.sin(TAU * (rb.k2 * xn - rb.s2 * t + rb.ph * 2)));
      const thick = T0 * rb.thick * (0.55 + 0.45 * Math.sin(TAU * (0.8 * xn + t + rb.ph)));
      top.push([x, y]);
      bottom.push([x, y + thick]);
    }
    const body = `${curve(top, "M")}${curve([...bottom].reverse(), "L")}Z`;
    const edge = curve(bottom, "M");
    const glow = 0.75 + 0.25 * Math.sin(TAU * (t + rb.ph));
    return { body, edge, glow, color: colors[i], upper: colors[(i + 1) % 3] };
  });

  const layer = (filter: number): React.CSSProperties => ({
    position: "absolute",
    left: -pad,
    top: -pad,
    width: w + 2 * pad,
    height: h + 2 * pad,
    filter: `blur(${filter}px)`,
  });
  const box = `${-pad} ${-pad} ${w + 2 * pad} ${h + 2 * pad}`;

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS }}>
      <AbsoluteFill style={{ background: `linear-gradient(to top, ${alpha(p.c1, 0.14)}, ${alpha(p.c1, 0)} 55%)` }} />
      <div style={layer(blur)}>
        <svg width={w + 2 * pad} height={h + 2 * pad} viewBox={box}>
          <defs>
            {shapes.map((sh, i) => (
              <linearGradient key={i} id={`${id}g${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={sh.upper} stopOpacity={0} />
                <stop offset="0.55" stopColor={sh.upper} stopOpacity={0.35} />
                <stop offset="1" stopColor={sh.color} stopOpacity={0.95} />
              </linearGradient>
            ))}
          </defs>
          {shapes.map((sh, i) => (
            <path key={i} d={sh.body} fill={`url(#${id}g${i})`} opacity={sh.glow} />
          ))}
        </svg>
      </div>
      <div style={layer(blur * 0.18)}>
        <svg width={w + 2 * pad} height={h + 2 * pad} viewBox={box}>
          {shapes.map((sh, i) => (
            <path key={i} d={sh.edge} fill="none" stroke={sh.color} strokeWidth={3 * u} strokeLinecap="round" strokeOpacity={0.7 * sh.glow} />
          ))}
        </svg>
      </div>
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
