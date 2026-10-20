import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_SANS, alpha, mix, progress, useLayout } from "../../kit";

export type ProgressRingProps = {
  background: string;
  gradA: string;
  gradB: string;
  text: string;
  label: string;
  caption: string;
  target: number; // %
  thickness: number; // px at 1080
  fillTime: number; // frames
  ease: string;
};

export const FILL_AT = 10;
export const RING = 560;

export const ProgressRing: React.FC<ProgressRingProps> = (p) => {
  const frame = useCurrentFrame();
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const { u } = useLayout();
  const enter = progress(frame, 0, 12, "enter");
  const t = progress(frame, FILL_AT, FILL_AT + p.fillTime, p.ease);
  const v = Math.min(Math.max(p.target * t, 0), 100);
  const cap = progress(frame, FILL_AT + p.fillTime - 6, FILL_AT + p.fillTime + 10, p.ease);
  const sw = p.thickness;
  const c = RING / 2;
  const R = (RING - sw) / 2 - 24;
  const C = 2 * Math.PI * R;
  const dash = `${(C * v) / 100} ${C}`;
  const angle = ((v / 100) * 360 - 90) * (Math.PI / 180);
  const arcOn = v > 0.3 ? 1 : 0;

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS, color: p.text }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 48 * u, opacity: enter, transform: `scale(${mix(0.96, 1, enter)})` }}>
        <div style={{ position: "relative", width: RING * u, height: RING * u }}>
          <svg width={RING * u} height={RING * u} viewBox={`0 0 ${RING} ${RING}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <defs>
              <linearGradient id={`pr-grad-${id}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={p.gradA} />
                <stop offset="100%" stopColor={p.gradB} />
              </linearGradient>
              <filter id={`pr-blur-${id}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation={sw * 0.55} />
              </filter>
            </defs>
            <circle cx={c} cy={c} r={R} fill="none" stroke={alpha(p.text, 0.08)} strokeWidth={sw} />
            <g transform={`rotate(-90 ${c} ${c})`} opacity={arcOn}>
              <circle cx={c} cy={c} r={R} fill="none" stroke={`url(#pr-grad-${id})`} strokeWidth={sw} strokeLinecap="round" strokeDasharray={dash} filter={`url(#pr-blur-${id})`} opacity={0.55} />
              <circle cx={c} cy={c} r={R} fill="none" stroke={`url(#pr-grad-${id})`} strokeWidth={sw} strokeLinecap="round" strokeDasharray={dash} />
            </g>
            <circle cx={c + R * Math.cos(angle)} cy={c + R * Math.sin(angle)} r={sw * 0.16} fill="#FFFFFF" opacity={0.85 * arcOn} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "baseline", fontVariantNumeric: "tabular-nums" }}>
              <span style={{ fontSize: 168 * u, fontWeight: 700, letterSpacing: "-0.05em", lineHeight: 1 }}>{Math.round(v)}</span>
              <span style={{ fontSize: 68 * u, fontWeight: 600, letterSpacing: "-0.03em", marginLeft: 6 * u, color: alpha(p.text, 0.5) }}>%</span>
            </div>
            <div style={{ marginTop: 14 * u, fontSize: 30 * u, fontWeight: 400, color: alpha(p.text, 0.55), letterSpacing: "-0.01em" }}>{p.label}</div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12 * u,
            height: 60 * u,
            padding: `0 ${26 * u}px`,
            borderRadius: 30 * u,
            background: alpha(p.gradA, 0.13),
            border: `${1.5 * u}px solid ${alpha(p.gradA, 0.3)}`,
            fontSize: 26 * u,
            fontWeight: 500,
            opacity: cap,
            transform: `translateY(${(1 - cap) * 18 * u}px)`,
          }}
        >
          <svg width={26 * u} height={26 * u} viewBox="0 0 24 24" fill="none" stroke={p.gradA} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 16l5-5 4 4 7-7M15 8h5v5" />
          </svg>
          {p.caption}
        </div>
      </div>
    </AbsoluteFill>
  );
};
