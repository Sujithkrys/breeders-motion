import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_SANS, STROKE, mix, progress, useLayout } from "../../kit";

export type ProgressRingProps = {
  background: string;
  card: string;
  line: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  label: string;
  caption: string;
  target: number; // %
  fillTime: number; // frames
  ease: string;
};

export const FILL_AT = 10;
export const ENTER = 20;
export const CAPTION_IN = 20;
// Ring diameter in px at 1080: larger at 16:9, where the label and caption sit to its right.
export const ringSize = (wide: boolean) => (wide ? 680 : 600);

export const ProgressRing: React.FC<ProgressRingProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, ratio } = useLayout();
  const wide = ratio === "16:9";
  const RING = ringSize(wide);
  const enter = progress(frame, 0, ENTER, "enter");
  const t = progress(frame, FILL_AT, FILL_AT + p.fillTime, p.ease);
  const v = Math.min(Math.max(p.target * t, 0), 100);
  const capFrom = FILL_AT + p.fillTime - 6;
  const cap = progress(frame, capFrom, capFrom + CAPTION_IN, "enter");
  const sw = STROKE.bar;
  const c = RING / 2;
  const R = (RING - sw) / 2 - 4;
  const C = 2 * Math.PI * R;
  const dash = `${(C * v) / 100} ${C}`;
  const arcOn = v > 0.3 ? 1 : 0;
  const icon = 26 * u;

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS, color: p.ink }}>
      <div
        style={{
          display: "flex",
          flexDirection: wide ? "row" : "column",
          alignItems: "center",
          gap: (wide ? 104 : 52) * u,
          opacity: enter,
          transform: `scale(${mix(0.96, 1, enter)})`,
        }}
      >
        <div style={{ position: "relative", width: RING * u, height: RING * u, flexShrink: 0 }}>
          <svg width={RING * u} height={RING * u} viewBox={`0 0 ${RING} ${RING}`} style={{ position: "absolute", inset: 0 }}>
            <circle cx={c} cy={c} r={R} fill="none" stroke={p.line} strokeWidth={sw} />
            <g transform={`rotate(-90 ${c} ${c})`} opacity={arcOn}>
              <circle cx={c} cy={c} r={R} fill="none" stroke={p.accent} strokeWidth={sw} strokeLinecap="round" strokeDasharray={dash} />
            </g>
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "baseline", fontVariantNumeric: "tabular-nums", marginLeft: 20 * u }}>
              <span style={{ fontSize: (wide ? 200 : 176) * u, fontWeight: 600, letterSpacing: "-0.045em", lineHeight: 1, color: p.ink }}>{Math.round(v)}</span>
              <span style={{ fontSize: (wide ? 72 : 64) * u, fontWeight: 400, letterSpacing: "-0.035em", marginLeft: 6 * u, color: p.ink3 }}>%</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: wide ? "flex-start" : "center", gap: 28 * u }}>
          <div style={{ fontSize: (wide ? 56 : 46) * u, fontWeight: 400, letterSpacing: "-0.035em", lineHeight: 1.1, color: p.ink, whiteSpace: "nowrap" }}>{p.label}</div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12 * u,
              height: 60 * u,
              padding: `0 ${26 * u}px 0 ${22 * u}px`,
              borderRadius: 999,
              background: p.card,
              border: `${STROKE.hair * u}px solid ${p.line}`,
              boxSizing: "border-box",
              fontSize: 25 * u,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              color: p.ink2,
              whiteSpace: "nowrap",
              opacity: cap,
              transform: `translateY(${(1 - cap) * 16 * u}px)`,
            }}
          >
            <svg
              width={icon}
              height={icon}
              viewBox="0 0 24 24"
              fill="none"
              stroke={p.accent}
              strokeWidth={(STROKE.ring * u * 24) / icon}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ display: "block" }}
            >
              <path d="M4 16l5-5 4 4 7-7M15 8h5v5" />
            </svg>
            {p.caption}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
