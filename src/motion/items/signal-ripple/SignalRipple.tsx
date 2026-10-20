import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_SANS, mix, useLayout } from "../../kit";

export type SignalRippleProps = {
  background: string;
  ring: string;
  core: string;
  grid: string;
  ink: string;
  title: string; // empty hides it
  rings: number; // ripples alive at once
  speed: number; // whole ripple cycles per loop
  thickness: number; // px at 1080 short side
};

const TAU = Math.PI * 2;
export const CELL = 72; // grid spacing, px at 1080 short side

export const SignalRipple: React.FC<SignalRippleProps> = (p) => {
  const frame = useCurrentFrame();
  const { width: w, height: h, durationInFrames, u, isVertical } = useLayout();
  const id = "sr" + React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const t = frame / durationInFrames;
  const n = Math.max(1, Math.round(p.rings));
  const sp = Math.max(1, Math.round(p.speed));
  const cx = w / 2;
  const cy = h / 2;
  const r0 = 30 * u;
  const rMax = Math.hypot(w, h) / 2;
  // Peaks each time a ripple is born; sp × n is a whole number, so the pulse closes the loop too.
  const pulse = 0.5 + 0.5 * Math.cos(TAU * sp * n * t);

  // All grid lines in one path keeps the DOM small and avoids <pattern>.
  const cell = CELL * u;
  let d = "";
  for (let x = cx - Math.ceil(cx / cell) * cell; x <= w; x += cell) d += `M${x} 0V${h}`;
  for (let y = cy - Math.ceil(cy / cell) * cell; y <= h; y += cell) d += `M0 ${y}H${w}`;

  const ripples = Array.from({ length: n }, (_, i) => {
    const q = (((sp * t + i / n) % 1) + 1) % 1;
    const r = r0 + (rMax - r0) * (1 - Math.pow(1 - q, 1.7));
    const op = Math.min(1, q / 0.06) * Math.pow(1 - q, 1.3);
    const sw = p.thickness * u * (1 + q * 1.2);
    return { r, op, sw };
  });

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <radialGradient id={`${id}v`} cx={cx} cy={cy} r={rMax} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={p.background} stopOpacity={0} />
            <stop offset="0.55" stopColor={p.background} stopOpacity={0.55} />
            <stop offset="1" stopColor={p.background} stopOpacity={1} />
          </radialGradient>
          <radialGradient id={`${id}c`}>
            <stop offset="0" stopColor={p.core} stopOpacity={0.6} />
            <stop offset="0.3" stopColor={p.ring} stopOpacity={0.22} />
            <stop offset="1" stopColor={p.ring} stopOpacity={0} />
          </radialGradient>
        </defs>
        <path d={d} stroke={p.grid} strokeWidth={1.25 * u} strokeOpacity={0.16} fill="none" />
        {/* Fades the grid into the background towards the edges. */}
        <rect x={0} y={0} width={w} height={h} fill={`url(#${id}v)`} />
        {ripples.map((rp, i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r={rp.r} fill="none" stroke={p.ring} strokeWidth={rp.sw * 7} strokeOpacity={0.1 * rp.op} />
            <circle cx={cx} cy={cy} r={rp.r} fill="none" stroke={p.ring} strokeWidth={rp.sw} strokeOpacity={rp.op} />
          </g>
        ))}
        <circle cx={cx} cy={cy} r={260 * u * (1 + 0.12 * pulse)} fill={`url(#${id}c)`} opacity={mix(0.7, 1, pulse)} />
        <circle cx={cx} cy={cy} r={11 * u * (1 + 0.3 * pulse)} fill={p.core} />
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
