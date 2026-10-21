import React from "react";
import { AbsoluteFill, Easing, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STROKE, mix, progress, useLayout } from "../../kit";
import type { Ratio } from "../../types";

export type TickSliderProps = {
  background: string;
  card: string;
  line: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  label: string;
  min: number;
  max: number;
  lens: number; // how much the ticks near the thumb swell (×)
  ease: string;
};

// ---------- geometry (px at 1080 on the short side) ----------
export const TICKS = 41;
export const GEO: Record<Ratio, { w: number; pad: number; font: number; tick: number; amp: number; gap: number; label: number }> = {
  "16:9": { w: 1240, pad: 80, font: 136, tick: 40, amp: 92, gap: 52, label: 24 },
  "1:1": { w: 920, pad: 64, font: 116, tick: 34, amp: 80, gap: 44, label: 22 },
  "9:16": { w: 920, pad: 64, font: 136, tick: 44, amp: 120, gap: 96, label: 24 },
};
export const SIGMA = 2.6; // lens width, in ticks

// ---------- timeline (150-frame loop) ----------
export const T = { inA: 8, inB: 22, press: 24, release: 118, homeA: 122, homeB: 138 } as const;
export const DRAGS: { a: number; b: number; from: number; to: number }[] = [
  { a: 26, b: 56, from: 0.5, to: 0.82 },
  { a: 60, b: 94, from: 0.82, to: 0.24 },
  { a: 98, b: 114, from: 0.24, to: 0.5 },
];
// The thumb chases the drag target on a slightly under-damped spring (lag ≈ 4 frames, a few % overshoot).
export const FOLLOW = { k: 0.14, c: 0.6 } as const;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
export const isDark = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  if (Number.isNaN(n)) return false;
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.4;
};
export const range = (min: number, max: number) => {
  const lo = Math.round(Number(min) || 0);
  const hiRaw = Math.round(Number(max));
  const hi = Number.isFinite(hiRaw) && hiRaw > lo ? hiRaw : lo + 100;
  return { lo, hi };
};
type Pt = [number, number];
const glide = (a: Pt, b: Pt, t: number): Pt => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const bow = Math.sin(Math.PI * clamp01(t)) * 0.08;
  return [a[0] + dx * t - dy * bow, a[1] + dy * t + dx * bow];
};
const snap = Easing.bezier(0.65, 0, 0.35, 1);

// Where the cursor holds the thumb (0–1 along the track) on a given frame.
const target = (f: number, ease: string) => {
  let x = 0.5;
  for (const d of DRAGS) if (f >= d.a) x = mix(d.from, d.to, progress(f, d.a, d.b, ease));
  return x;
};

// A one-line odometer: the integer part rolls to the next number as the value crosses it.
const Roll: React.FC<{ v: number; chars: number; color: string }> = ({ v, chars, color }) => {
  const n = Math.floor(v + 1e-6);
  const t = snap(clamp01((v - n - 0.3) / 0.4));
  const cell: React.CSSProperties = { position: "absolute", left: 0, top: 0, height: "1.1em", lineHeight: "1.1em", whiteSpace: "nowrap" };
  return (
    <span style={{ position: "relative", display: "inline-block", width: `${chars * 0.64}em`, height: "1.1em", overflow: "hidden", color }}>
      {t < 1 ? <span style={{ ...cell, transform: `translateY(${-t * 100}%)`, opacity: 1 - t * 0.6 }}>{`${n}`}</span> : null}
      {t > 0 ? <span style={{ ...cell, transform: `translateY(${(1 - t) * 100}%)`, opacity: 0.4 + t * 0.6 }}>{`${n + 1}`}</span> : null}
    </span>
  );
};

export const TickSlider: React.FC<TickSliderProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, u, ratio } = useLayout();
  const g = GEO[ratio];
  const dark = isDark(p.background);
  const { lo, hi } = range(p.min, p.max);
  const lensK = Math.min(2, Math.max(0.4, Number(p.lens) || 1));

  // ---- the thumb: a spring that chases the cursor
  let s = 0.5;
  let vel = 0;
  for (let f = 0; f <= frame; f++) {
    const acc = FOLLOW.k * (target(f, p.ease) - s) - FOLLOW.c * vel;
    vel += acc;
    s += vel;
  }
  s = clamp01(s);
  const value = lo + s * (hi - lo);

  const pressed = progress(frame, T.press - 2, T.press + 4, "enter") - progress(frame, T.release, T.release + 8, "exit");
  const bump = (c: number) => interpolate(frame, [c - 3, c, c + 5], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lensNow = lensK * (0.5 + 0.5 * pressed);

  // ---- layout
  const W = Math.min(g.w * u, width * 0.9);
  const pad = g.pad * u;
  const fs = g.font * u;
  const tick = g.tick * u;
  const amp = g.amp * u;
  const thumbH = tick + amp * lensK + 34 * u;
  const area = thumbH + 16 * u;
  const H = pad * 0.85 + fs * 1.1 + g.gap * u + area + 22 * u + g.label * u + pad * 0.9;
  const left = (width - W) / 2;
  const top = (height - H) / 2;
  const trackL = pad + 6 * u;
  const TW = W - 2 * trackL;
  const mid = pad * 0.85 + fs * 1.1 + g.gap * u + area / 2;
  const thumbX = trackL + s * TW;

  // ---- ticks: one SVG; the lens is a gaussian around the thumb
  const ticks = Array.from({ length: TICKS }, (_, i) => {
    const d = i - s * (TICKS - 1);
    const lens = Math.exp(-(d * d) / (2 * SIGMA * SIGMA));
    const major = i % 10 === 0 ? 1.3 : 1;
    const h = tick * major + amp * lens * lensNow;
    const base = i / (TICKS - 1) <= s ? p.ink2 : p.ink3;
    return { x: trackL + (i / (TICKS - 1)) * TW, h, color: interpolateColors(clamp01(lens * 1.2), [0, 1], [base, p.ink]) };
  });
  const marks = [0, 0.25, 0.5, 0.75, 1].map((q) => ({ x: trackL + q * TW, text: `${Math.round(lo + q * (hi - lo))}` }));
  const chars = Math.max(`${lo}`.length, `${hi}`.length);

  // ---- cursor (card coordinates)
  const grab: Pt = [thumbX, mid + thumbH * 0.18];
  const home: Pt = [trackL + 0.5 * TW + 170 * u, mid + thumbH / 2 + 70 * u];
  let cur: Pt = home;
  // While held, the cursor rides the thumb, so the thumb's spring reads as the drag's inertia.
  if (frame >= T.homeA) cur = glide(grab, home, progress(frame, T.homeA, T.homeB, "travel"));
  else if (frame >= T.press) cur = grab;
  else if (frame >= T.inA) cur = glide(home, [trackL + 0.5 * TW, grab[1]], progress(frame, T.inA, T.inB, "travel"));
  const press = Math.max(pressed * 0.6, bump(T.press), bump(T.release));

  const hair = Math.max(1, u);
  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS }}>
      <div
        style={{
          position: "absolute",
          left,
          top,
          width: W,
          height: H,
          background: p.card,
          borderRadius: RADIUS.card * u,
          border: `${hair}px solid ${p.line}`,
          boxSizing: "border-box",
          boxShadow: dark ? "none" : `0 ${u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)`,
        }}
      >
        {/* readout */}
        <div
          style={{
            position: "absolute",
            left: trackL,
            top: pad * 0.85,
            height: fs * 1.1,
            display: "flex",
            alignItems: "flex-start",
            gap: fs * 0.26,
            fontSize: fs,
            lineHeight: "1.1em",
            letterSpacing: "-0.04em",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ color: p.ink3, fontWeight: 400 }}>{p.label}</span>
          <span style={{ fontWeight: 600, display: "inline-block", height: "1.1em" }}>
            <Roll v={value} chars={chars} color={p.ink} />
          </span>
        </div>

        {/* ticks, thumb and scale labels */}
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {ticks.map((t, i) => (
            <line key={i} x1={t.x} x2={t.x} y1={mid - t.h / 2} y2={mid + t.h / 2} stroke={t.color} strokeWidth={STROKE.ring * u} strokeLinecap="round" />
          ))}
          <g transform={`translate(${thumbX} ${mid}) scale(${1 + 0.05 * pressed})`}>
            <line x1={0} x2={0} y1={-(tick + amp * lensNow + 34 * u) / 2} y2={(tick + amp * lensNow + 34 * u) / 2} stroke={p.accent} strokeWidth={STROKE.bar * u} strokeLinecap="round" />
          </g>
          {marks.map((m, i) => (
            <text
              key={`m${i}`}
              x={m.x}
              y={mid + area / 2 + 22 * u + g.label * u * 0.8}
              textAnchor={i === 0 ? "start" : i === marks.length - 1 ? "end" : "middle"}
              fontFamily={FONT_MONO}
              fontSize={g.label * u}
              letterSpacing="0.04em"
              fill={p.ink3}
            >
              {m.text}
            </text>
          ))}
        </svg>

        {/* cursor */}
        <svg
          width={30 * u}
          height={41 * u}
          viewBox="0 0 16 22"
          style={{ position: "absolute", left: cur[0] - 2 * u, top: cur[1] - 2 * u, overflow: "visible", transformOrigin: "0 0", transform: `scale(${1 - 0.12 * press})` }}
        >
          <path d="M1 1V17.4L5.1 13.6 7.9 20.2 10.7 19 7.9 12.5H13.6Z" fill={p.ink} stroke={p.card} strokeWidth={1.3} strokeLinejoin="round" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
