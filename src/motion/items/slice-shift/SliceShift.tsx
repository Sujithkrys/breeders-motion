import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_SANS, progress, useLayout } from "../../kit";

export type SliceShiftProps = {
  background: string; // Scene A
  inkA: string;
  sceneB: string;
  inkB: string;
  accent: string; // seam line between the two scenes inside each slice
  titleA: string;
  titleB: string;
  slices: number;
  stagger: number; // frames between slices
  ease: string;
};

export const SHIFT_START = 8;
export const SHIFT_DUR = 24;
export const SEAM = 8; // px at 1080 short side

export const SliceShift: React.FC<SliceShiftProps> = (p) => {
  const frame = useCurrentFrame();
  const { width: w, height: h, u, isVertical } = useLayout();
  const n = Math.max(2, Math.round(p.slices));
  const sh = h / n;
  const size = (isVertical ? 128 : 168) * u;
  const scene: React.CSSProperties = {
    position: "absolute",
    left: 0,
    width: w,
    height: h,
    padding: `0 ${w * 0.08}px`,
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    fontSize: size,
    fontWeight: 650,
    letterSpacing: "-0.04em",
    lineHeight: 1.02,
  };
  const seam = SEAM * u;

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS }}>
      {Array.from({ length: n }, (_, i) => {
        const from = SHIFT_START + i * p.stagger;
        const t = progress(frame, from, from + SHIFT_DUR, p.ease);
        const dir = i % 2 === 0 ? -1 : 1;
        // Scene A leaves by a full frame width; Scene B follows it in from the opposite side.
        const xA = dir * t * w;
        const xB = dir * (t - 1) * w;
        const joint = dir < 0 ? xB : xA;
        const live = t > 0.001 && t < 0.999;
        return (
          <div key={i} style={{ position: "absolute", left: 0, top: i * sh, width: w, height: sh + 1, overflow: "hidden" }}>
            <div style={{ ...scene, top: -i * sh, background: p.background, color: p.inkA, transform: `translateX(${xA}px)` }}>{p.titleA}</div>
            <div style={{ ...scene, top: -i * sh, background: p.sceneB, color: p.inkB, transform: `translateX(${xB}px)` }}>{p.titleB}</div>
            {live ? (
              <div style={{ position: "absolute", top: 0, left: joint - seam / 2, width: seam, height: sh + 1, background: p.accent }} />
            ) : null}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
