import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { FONT_SANS, STROKE, progress, useLayout } from "../../kit";
import type { Ratio } from "../../types";

export type SlideToConfirmProps = {
  background: string;
  card: string; // track surface
  line: string;
  ink: string; // cursor
  ink2: string; // track label
  button: string; // thumb
  onButton: string; // arrow on the thumb
  accent: string; // fill behind the thumb
  onAccent: string;
  success: string;
  label: string;
  doneLabel: string;
  speed: number; // % of the default drag speed
  ease: string;
};

// ---------- geometry (px at 1080 on the short side); the track is a true pill, the thumb a circle inside it ----------
export const GEO: Record<Ratio, { w: number; h: number; pad: number; font: number }> = {
  "16:9": { w: 1120, h: 176, pad: 14, font: 46 },
  "1:1": { w: 880, h: 148, pad: 12, font: 40 },
  "9:16": { w: 900, h: 152, pad: 12, font: 40 },
};

// ---------- timeline (150-frame loop) ----------
export const SNAP = 0.92; // the hand drags to 92%, the spring takes the last 8%
export const SNAP_FRAMES = 16;
export const T = { mvA: 6, mvB: 24, grab: 27, dragA: 29, okOutA: 108, okOutB: 120, backA: 114, backB: 136 } as const;
export const clampSpeed = (s: number) => Math.min(150, Math.max(75, Number(s) || 100));
export const dragFrames = (s: number) => Math.round((40 * 100) / clampSpeed(s));
export const timeline = (s: number) => {
  const dragB = T.dragA + dragFrames(s);
  return { dragB, okA: dragB + 2, okB: dragB + 14, paidA: dragB + 6, paidB: dragB + 24, leaveA: dragB + 8, leaveB: dragB + 30 };
};

export const isDark = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  if (Number.isNaN(n)) return false;
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.4;
};
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
type Pt = [number, number];
const glide = (a: Pt, b: Pt, t: number): Pt => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const bow = Math.sin(Math.PI * clamp01(t)) * 0.08;
  return [a[0] + dx * t - dy * bow, a[1] + dy * t + dx * bow];
};

export const SlideToConfirm: React.FC<SlideToConfirmProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, u, ratio } = useLayout();
  const g = GEO[ratio];
  const tl = timeline(p.speed);
  const dark = isDark(p.background);

  const W = g.w * u;
  const H = g.h * u;
  const pad = g.pad * u;
  const d = H - 2 * pad; // thumb diameter
  const travel = W - 2 * pad - d;
  const left0 = (width - W) / 2;
  const top0 = (height - H) / 2;

  // ---- thumb position: the hand drags to SNAP, a spring takes the rest, then it slides home for the loop
  const drag = progress(frame, T.dragA, tl.dragB, p.ease) * SNAP;
  const snap = progress(frame, tl.dragB, tl.dragB + SNAP_FRAMES, "spring") * (1 - SNAP);
  const back = progress(frame, T.backA, T.backB, "travel");
  const pos = (drag + snap) * (1 - back);
  const x = pad + pos * travel; // thumb left, in track coords

  // ---- success state
  const ok = clamp01(progress(frame, tl.okA, tl.okB, "enter") - progress(frame, T.okOutA, T.okOutB, "exit"));
  const paid = frame < T.okOutA ? progress(frame, tl.paidA, tl.paidB, "enter") : 1 - progress(frame, T.okOutA, T.okOutA + 12, "exit");
  const press = interpolate(frame, [T.grab - 3, T.grab, tl.dragB, tl.dragB + 4], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const trackBg = interpolateColors(ok, [0, 1], [p.card, p.success]);
  const fillBg = interpolateColors(ok, [0, 1], [p.accent, p.success]);
  const thumbBg = interpolateColors(ok, [0, 1], [p.button, p.onAccent]);
  const labelO = 1 - clamp01(pos / 0.35);

  // ---- cursor (frame coords): rest → thumb, rides with the thumb, lets go at SNAP, drifts home
  const grabAt = (q: number): Pt => [left0 + pad + q * travel + d * 0.5, top0 + H * 0.5 + 4 * u];
  const R: Pt = [left0 + pad + d * 0.5 + 170 * u, top0 + H + 150 * u];
  let cur: Pt = R;
  if (frame >= tl.leaveA) cur = glide(grabAt(SNAP), R, progress(frame, tl.leaveA, tl.leaveB, "travel"));
  else if (frame >= T.dragA) cur = grabAt(Math.min(drag, SNAP));
  else if (frame >= T.mvA) cur = glide(R, grabAt(0), progress(frame, T.mvA, T.mvB, "travel"));

  const icon = d * 0.4;
  const sw = (STROKE.bar * u * 24) / icon;
  const hair = Math.max(1, u);
  const shadow = dark ? "none" : `0 ${u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)`;
  const thumbShadow = dark ? "none" : `0 ${u}px ${2 * u}px rgba(0,0,0,0.08), 0 ${6 * u}px ${16 * u}px rgba(0,0,0,0.12)`;
  const cw = 30 * u * 1.25;

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS }}>
      {/* track */}
      <div
        style={{
          position: "absolute",
          left: left0,
          top: top0,
          width: W,
          height: H,
          borderRadius: 999,
          background: trackBg,
          border: `${hair}px solid ${interpolateColors(ok, [0, 1], [p.line, p.success])}`,
          boxSizing: "border-box",
          boxShadow: shadow,
          overflow: "hidden",
        }}
      >
        {/* label: centred in the free run of the track, fades and slides ahead of the thumb */}
        <div
          style={{
            position: "absolute",
            left: pad + d,
            right: pad,
            top: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: g.font * u,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: p.ink2,
            whiteSpace: "nowrap",
            opacity: labelO,
            transform: `translateX(${pos * W * 0.18}px)`,
          }}
        >
          {p.label}
        </div>

        {/* accent fill that grows behind the thumb */}
        <div style={{ position: "absolute", left: pad - hair, top: pad - hair, width: x - pad + d, height: d, borderRadius: 999, background: fillBg }} />

        {/* done label, centred in the run left of the parked thumb */}
        <div
          style={{
            position: "absolute",
            left: 0,
            width: W - d - pad,
            top: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: g.font * u,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: p.onAccent,
            whiteSpace: "nowrap",
            opacity: paid,
            transform: `translateY(${(1 - paid) * 18 * u}px)`,
          }}
        >
          {p.doneLabel}
        </div>

        {/* thumb */}
        <div
          style={{
            position: "absolute",
            left: x - hair,
            top: pad - hair,
            width: d,
            height: d,
            borderRadius: 999,
            background: thumbBg,
            boxShadow: thumbShadow,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${1 - 0.04 * press})`,
          }}
        >
          <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: (d - icon) / 2, top: (d - icon) / 2, overflow: "visible" }}>
            <path d="M5 12h14M13 6l6 6-6 6" stroke={p.onButton} strokeWidth={sw} opacity={1 - ok} transform={`translate(${ok * 6} 0)`} />
            <path d="M5 12.5l4.5 4.5L19 7.5" stroke={p.success} strokeWidth={sw} strokeDasharray={21} strokeDashoffset={21 * (1 - ok)} />
          </svg>
        </div>
      </div>

      {/* cursor */}
      <svg
        width={cw}
        height={cw * (41 / 30)}
        viewBox="0 0 16 22"
        style={{ position: "absolute", left: cur[0], top: cur[1], overflow: "visible", transformOrigin: "0 0", transform: `scale(${1 - 0.12 * press})` }}
      >
        <path d="M1 1V17.4L5.1 13.6 7.9 20.2 10.7 19 7.9 12.5H13.6Z" fill={p.ink} stroke={p.background} strokeWidth={1.3} strokeLinejoin="round" />
      </svg>
    </AbsoluteFill>
  );
};
