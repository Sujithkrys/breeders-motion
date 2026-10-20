import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, alpha, envelope, mix, useLayout } from "../../kit";

export type CardFanProps = {
  background: string;
  front1: string;
  front2: string;
  front3: string;
  backA: string;
  backB: string;
  label: string;
  last4: string;
  spread: number; // px at 1080 short side
  tilt: number; // degrees
  ease: string;
};

const Card: React.FC<{ w: number; h: number; bg: string; shadow: string; children?: React.ReactNode; style?: React.CSSProperties }> = ({ w, h, bg, shadow, children, style }) => (
  <div style={{ position: "absolute", left: -w / 2, top: -h / 2, width: w, height: h, borderRadius: h * 0.11, background: bg, boxShadow: shadow, overflow: "hidden", ...style }}>
    {children}
  </div>
);

export const CardFan: React.FC<CardFanProps> = (p) => {
  const frame = useCurrentFrame();
  const { durationInFrames, u, isVertical } = useLayout();
  const t = envelope(frame, durationInFrames, durationInFrames * 0.38, durationInFrames * 0.8, p.ease);
  const w = (isVertical ? 560 : 680) * u;
  const h = w * 0.63;
  const spread = p.spread * u * (isVertical ? 0.6 : 1);
  const shadow = `0 ${40 * u}px ${80 * u}px rgba(0,0,0,0.35)`;
  const mono: React.CSSProperties = { fontFamily: FONT_MONO, letterSpacing: "0.12em", fontSize: 30 * u };

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div style={{ position: "relative", width: 0, height: 0 }}>
        <Card w={w} h={h} bg={`linear-gradient(135deg, ${p.backA}, ${alpha(p.backA, 0.75)})`} shadow={shadow} style={{ transform: `translateX(${-spread * t}px) rotate(${-p.tilt * t}deg)` }}>
          <span style={{ ...mono, position: "absolute", left: 48 * u, bottom: 44 * u, color: "rgba(15,15,16,0.55)" }}>•••• 7310</span>
        </Card>
        <Card w={w} h={h} bg={`linear-gradient(135deg, ${p.backB}, #101012)`} shadow={shadow} style={{ transform: `translateX(${spread * t}px) rotate(${p.tilt * t}deg)` }}>
          <span style={{ ...mono, position: "absolute", right: 48 * u, bottom: 44 * u, color: "rgba(255,255,255,0.5)" }}>•••• 0941</span>
        </Card>
        <Card
          w={w}
          h={h}
          bg={`linear-gradient(135deg, ${p.front1}, ${p.front2} 55%, ${p.front3})`}
          shadow={`0 ${60 * u}px ${120 * u}px ${alpha(p.front2, mix(0.25, 0.45, t))}`}
          style={{ transform: `translateY(${-spread * 0.19 * t}px)`, color: "#FFFFFF", padding: 46 * u, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 34 * u, fontWeight: 600, letterSpacing: "-0.01em" }}>{p.label}</span>
            <svg width={44 * u} height={44 * u} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" style={{ opacity: 0.85 }}>
              <path d="M8.5 8.5a5 5 0 0 1 0 7M12 6a8.5 8.5 0 0 1 0 12M15.5 3.5a12 12 0 0 1 0 17" />
            </svg>
          </div>
          <span style={{ width: 88 * u, height: 66 * u, borderRadius: 14 * u, background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.35))" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <span style={mono}>•••• {p.last4}</span>
            <span style={{ display: "flex" }}>
              <span style={{ width: 52 * u, height: 52 * u, borderRadius: "50%", background: "rgba(255,255,255,0.75)" }} />
              <span style={{ width: 52 * u, height: 52 * u, marginLeft: -20 * u, borderRadius: "50%", background: "rgba(255,255,255,0.4)" }} />
            </span>
          </div>
        </Card>
      </div>
    </AbsoluteFill>
  );
};
