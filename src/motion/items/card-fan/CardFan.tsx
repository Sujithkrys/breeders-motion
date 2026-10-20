import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STROKE, alpha, progress, useLayout } from "../../kit";

export type CardFanProps = {
  background: string;
  card: string;
  line: string;
  ink: string;
  ink3: string;
  accent: string;
  onAccent: string;
  label: string;
  last4: string;
  spread: number; // px at 1080 short side
  tilt: number; // degrees
  ease: string;
};

// Frames on the 120-frame loop: hold the stack, fan out, hold, settle back, then hold still for the loop point.
export const FAN = { out: [12, 36] as const, back: [92, 108] as const };
export const CARD_W = 680;

export const isDark = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.4;
};

const Card: React.FC<{ w: number; h: number; r: number; bg: string; border?: string; shadow: string; children?: React.ReactNode; style?: React.CSSProperties }> = ({
  w,
  h,
  r,
  bg,
  border,
  shadow,
  children,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      left: -w / 2,
      top: -h / 2,
      width: w,
      height: h,
      borderRadius: r,
      background: bg,
      border,
      boxSizing: "border-box",
      boxShadow: shadow,
      overflow: "hidden",
      ...style,
    }}
  >
    {children}
  </div>
);

export const CardFan: React.FC<CardFanProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, u, ratio } = useLayout();
  const t = progress(frame, FAN.out[0], FAN.out[1], p.ease) - progress(frame, FAN.back[0], FAN.back[1], "travel");

  const w = (ratio === "16:9" ? CARD_W : 560) * u;
  const h = w * 0.63;
  // Keep the fanned cards inside ~94% of the frame width on every ratio.
  const rad = (Math.abs(p.tilt) * Math.PI) / 180;
  const halfBox = (w * Math.cos(rad) + h * Math.sin(rad)) / 2;
  const factor = ratio === "16:9" ? 1 : ratio === "1:1" ? 0.6 : 0.45;
  const spread = Math.max(0, Math.min(p.spread * u * factor, width * 0.47 - halfBox));

  const shadow = isDark(p.background) ? "none" : `0 ${1 * u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)`;
  const r = RADIUS.card * u;
  const pad = 46 * u;
  const mono: React.CSSProperties = { fontFamily: FONT_MONO, letterSpacing: "0.12em", fontSize: 30 * u, fontWeight: 400 };
  const icon = 44 * u;

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div style={{ position: "relative", width: 0, height: 0 }}>
        <Card w={w} h={h} r={r} bg={p.card} border={`${1 * u}px solid ${p.line}`} shadow={shadow} style={{ transform: `translateX(${-spread * t}px) rotate(${-p.tilt * t}deg)` }}>
          <span style={{ ...mono, position: "absolute", left: pad, bottom: pad, color: p.ink3 }}>•••• 7310</span>
        </Card>
        <Card w={w} h={h} r={r} bg={p.ink} shadow={shadow} style={{ transform: `translateX(${spread * t}px) rotate(${p.tilt * t}deg)` }}>
          <span style={{ ...mono, position: "absolute", right: pad, bottom: pad, color: p.ink3 }}>•••• 0941</span>
        </Card>
        <Card
          w={w}
          h={h}
          r={r}
          bg={p.accent}
          shadow={shadow}
          style={{ transform: `translateY(${-spread * 0.19 * t}px)`, color: p.onAccent, padding: pad, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 34 * u, fontWeight: 500, letterSpacing: "-0.02em" }}>{p.label}</span>
            <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" stroke={p.onAccent} strokeWidth={(STROKE.ring * u * 24) / icon} strokeLinecap="round" style={{ opacity: 0.85 }}>
              <path d="M8.5 8.5a5 5 0 0 1 0 7M12 6a8.5 8.5 0 0 1 0 12M15.5 3.5a12 12 0 0 1 0 17" />
            </svg>
          </div>
          <span style={{ width: 88 * u, height: 66 * u, borderRadius: RADIUS.chip * u, background: alpha(p.onAccent, 0.3) }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <span style={mono}>•••• {p.last4}</span>
            <span style={{ display: "flex" }}>
              <span style={{ width: 52 * u, height: 52 * u, borderRadius: 999, background: alpha(p.onAccent, 0.75) }} />
              <span style={{ width: 52 * u, height: 52 * u, marginLeft: -20 * u, borderRadius: 999, background: alpha(p.onAccent, 0.4) }} />
            </span>
          </div>
        </Card>
      </div>
    </AbsoluteFill>
  );
};
