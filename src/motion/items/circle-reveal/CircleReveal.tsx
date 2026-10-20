import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_SANS, mix, progress, useLayout } from "../../kit";

export type CircleRevealProps = {
  background: string; // Scene A
  inkA: string;
  sceneB: string;
  inkB: string;
  ring: string;
  titleA: string;
  titleB: string;
  origin: string; // center | top-left | top-right | bottom-left | bottom-right
  ringWidth: number; // px at 1080 short side; 0 hides the ring
  ease: string;
};

export const REVEAL_START = 8;
export const REVEAL_DUR = 36;
export const RING_GAP = 22; // px between the circle's edge and the leading ring

export const ORIGINS: Record<string, [number, number]> = {
  center: [0.5, 0.5],
  "top-left": [0, 0],
  "top-right": [1, 0],
  "bottom-left": [0, 1],
  "bottom-right": [1, 1],
};

const Title: React.FC<{ text: string; color: string; size: number; scale: number; opacity: number }> = ({ text, color, size, scale, opacity }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <div
      style={{
        color,
        opacity,
        fontSize: size,
        fontWeight: 650,
        letterSpacing: "-0.04em",
        lineHeight: 1.02,
        textAlign: "center",
        maxWidth: "84%",
        transform: `scale(${scale})`,
      }}
    >
      {text}
    </div>
  </AbsoluteFill>
);

export const CircleReveal: React.FC<CircleRevealProps> = (p) => {
  const frame = useCurrentFrame();
  const { width: w, height: h, u, isVertical } = useLayout();
  const [fx, fy] = ORIGINS[p.origin] ?? ORIGINS.center;
  const ox = fx * w;
  const oy = fy * h;
  const gap = RING_GAP * u;
  const rw = p.ringWidth * u;
  const far = Math.max(Math.hypot(ox, oy), Math.hypot(w - ox, oy), Math.hypot(ox, h - oy), Math.hypot(w - ox, h - oy));

  const t = progress(frame, REVEAL_START, REVEAL_START + REVEAL_DUR, p.ease);
  // Overshoot the far corner so both rings have left the frame by the time the reveal lands.
  const r = Math.max(0, t * (far + gap * 4 + rw * 4));
  const ringOpacity = Math.min(1, t * 10);
  const size = (isVertical ? 128 : 168) * u;

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS }}>
      <Title text={p.titleA} color={p.inkA} size={size} scale={mix(1, 0.94, t)} opacity={mix(1, 0.45, t)} />
      <AbsoluteFill style={{ background: p.sceneB, clipPath: `circle(${r}px at ${ox}px ${oy}px)` }}>
        <Title text={p.titleB} color={p.inkB} size={size} scale={mix(1.1, 1, t)} opacity={1} />
      </AbsoluteFill>
      {rw > 0 && t > 0 ? (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: 0, top: 0 }}>
          <circle cx={ox} cy={oy} r={r + gap} fill="none" stroke={p.ring} strokeWidth={rw * 6} strokeOpacity={0.12 * ringOpacity} />
          <circle cx={ox} cy={oy} r={r + gap} fill="none" stroke={p.ring} strokeWidth={rw} strokeOpacity={ringOpacity} />
          <circle cx={ox} cy={oy} r={r + gap * 2.8} fill="none" stroke={p.ring} strokeWidth={rw * 0.5} strokeOpacity={0.35 * ringOpacity} />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};
