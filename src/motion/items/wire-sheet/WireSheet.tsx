import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_MONO, STROKE, easing, mix, useLayout } from "../../kit";

export type WireSheetProps = {
  background: string;
  card: string;
  line: string;
  fill: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  label: string;
  waveHeight: number; // peak wave height, 0.1–0.8 (sheet half-width = 1)
  cycles: number; // whole wave cycles per loop
  density: number; // grid columns
  crest: boolean; // accent on the centre line
  ease: string; // shapes the swell of the wave height over the loop
};

// ---------- sheet + camera (sheet units: x ∈ [-1, 1], z ∈ [-HALF_Z, HALF_Z]) ----------
export const HALF_Z = 0.5;
export const YAW = (-26 * Math.PI) / 180;
export const PITCH = (24 * Math.PI) / 180;
export const CAM = 3.5; // camera distance; focal length = CAM so the centre is at scale 1
export const WORLD_H = 0.4; // world height per unit of "wave height"
export const MIN_SWELL = 0.3; // the wave never fully flattens; it swells from 30% to 100% and back
export const K1 = { x: 0.6, z: 0.15 }; // main wave: spatial cycles per unit
export const K2 = { x: -0.2, z: 0.45 }; // cross wave
export const RES = { row: 64, col: 28 }; // samples per polyline

export const clampP = (p: Pick<WireSheetProps, "waveHeight" | "cycles" | "density">) => ({
  amp: Math.min(0.8, Math.max(0.1, Number(p.waveHeight) || 0.42)),
  cycles: Math.min(4, Math.max(1, Math.round(Number(p.cycles) || 2))),
  cols: Math.min(30, Math.max(12, Math.round(Number(p.density) || 22))),
});
export const rowsFor = (cols: number) => Math.round(cols * HALF_Z) + 1;

// 0..1..0 over the loop with the chosen curve, so the swell loops seamlessly.
export const swell = (frame: number, total: number, ease: string) => {
  const t = ((frame % total) + total) % total / total;
  const tri = t < 0.5 ? t * 2 : 2 - t * 2;
  return MIN_SWELL + (1 - MIN_SWELL) * easing(ease)(tri);
};

const TAU = Math.PI * 2;
// phase1 turns `cycles` times per loop, phase2 once, so both waves end where they started.
export const waveAt = (x: number, z: number, phase1: number, phase2: number) =>
  0.72 * Math.sin(TAU * (K1.x * x + K1.z * z) - phase1) + 0.28 * Math.sin(TAU * (K2.x * x + K2.z * z) + phase2);

type Pt = { X: number; Y: number; d: number };
const project = (x: number, y: number, z: number): Pt => {
  const xr = x * Math.cos(YAW) - z * Math.sin(YAW);
  const zr = x * Math.sin(YAW) + z * Math.cos(YAW);
  const yv = y * Math.cos(PITCH) + zr * Math.sin(PITCH);
  const depth = zr * Math.cos(PITCH) - y * Math.sin(PITCH);
  const k = CAM / (CAM + depth);
  return { X: xr * k, Y: -yv * k, d: depth };
};

// Static framing: bounding box of the sheet at its tallest, so the scale never breathes.
const frameBox = (amp: number) => {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const x of [-1, 1]) for (const z of [-HALF_Z, HALF_Z]) for (const y of [-amp * WORLD_H, amp * WORLD_H]) {
    const q = project(x, y, z);
    x0 = Math.min(x0, q.X); x1 = Math.max(x1, q.X); y0 = Math.min(y0, q.Y); y1 = Math.max(y1, q.Y);
  }
  return { x0, x1, y0, y1 };
};

export const WireSheet: React.FC<WireSheetProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames, u, isVertical } = useLayout();
  const { amp, cycles, cols } = clampP(p);
  const rows = rowsFor(cols);
  const box = useMemo(() => frameBox(amp), [amp]);
  const unit = Math.min((width * (isVertical ? 0.86 : 0.74)) / (box.x1 - box.x0), (height * 0.66) / (box.y1 - box.y0));
  const ox = width / 2 - ((box.x0 + box.x1) / 2) * unit;
  const oy = height / 2 - ((box.y0 + box.y1) / 2) * unit - 24 * u;

  const env = swell(frame, durationInFrames, p.ease);
  const phase1 = (TAU * cycles * frame) / durationInFrames;
  const phase2 = (TAU * frame) / durationInFrames;
  const hScale = amp * env * WORLD_H;
  const yAt = (x: number, z: number) => waveAt(x, z, phase1, phase2) * hScale;

  const path = (pts: Pt[]) => pts.map((q, i) => `${i ? "L" : "M"}${(ox + q.X * unit).toFixed(1)} ${(oy + q.Y * unit).toFixed(1)}`).join("");
  const lines: { d: string; edge: boolean; depth: number; key: string }[] = [];
  for (let r = 0; r < rows; r++) {
    const z = -HALF_Z + (2 * HALF_Z * r) / (rows - 1);
    const pts: Pt[] = [];
    for (let i = 0; i <= RES.row; i++) {
      const x = -1 + (2 * i) / RES.row;
      pts.push(project(x, yAt(x, z), z));
    }
    lines.push({ d: path(pts), edge: r === 0 || r === rows - 1, depth: pts[RES.row >> 1].d, key: `r${r}` });
  }
  for (let c = 0; c < cols; c++) {
    const x = -1 + (2 * c) / (cols - 1);
    const pts: Pt[] = [];
    for (let i = 0; i <= RES.col; i++) {
      const z = -HALF_Z + (2 * HALF_Z * i) / RES.col;
      pts.push(project(x, yAt(x, z), z));
    }
    lines.push({ d: path(pts), edge: c === 0 || c === cols - 1, depth: pts[RES.col >> 1].d, key: `c${c}` });
  }
  const dMax = Math.max(...lines.map((l) => Math.abs(l.depth)), 0.001);

  // the accent crest line runs along x through the middle of the sheet
  let crestD = "";
  if (p.crest) {
    const pts: Pt[] = [];
    for (let i = 0; i <= RES.row; i++) {
      const x = -1 + (2 * i) / RES.row;
      pts.push(project(x, yAt(x, 0), 0));
    }
    crestD = path(pts);
  }

  const hair = STROKE.hair * u;
  const readY = oy + box.y1 * unit + 72 * u;
  const value = (amp * env).toFixed(2);

  return (
    <AbsoluteFill style={{ background: p.background }}>
      <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }}>
        {lines.map((l) => (
          <path
            key={l.key}
            d={l.d}
            fill="none"
            stroke={p.ink}
            strokeWidth={hair}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={(l.edge ? 0.3 : 0.18) * mix(1, 0.7, Math.max(0, l.depth) / dMax)}
          />
        ))}
        {crestD ? <path d={crestD} fill="none" stroke={p.accent} strokeWidth={STROKE.ring * u} strokeLinejoin="round" strokeLinecap="round" /> : null}
      </svg>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: readY,
          display: "flex",
          justifyContent: "center",
          gap: 14 * u,
          fontFamily: FONT_MONO,
          fontSize: 18 * u,
          fontWeight: 400,
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ color: p.ink3 }}>{p.label}</span>
        <span style={{ color: p.ink2 }}>{value}</span>
      </div>
    </AbsoluteFill>
  );
};
