import React, { useId } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONT_SANS, RADIUS, mix, progress, useLayout } from "../../kit";
import type { Ratio } from "../../types";

export type StarRatingProps = {
  background: string;
  card: string;
  line: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  rating: number; // 0.5–5 in halves
  reviews: string;
  pop: number; // peak scale of a star as it fills
  ease: string;
};

// ---------- geometry (px at 1080 on the short side) ----------
// 16:9 is one row (stars | divider | value); 1:1 and 9:16 stack the value above the stars.
export const GEO: Record<Ratio, { star: number; gap: number; pad: number; num: number; rev: number; stackGap: number }> = {
  "16:9": { star: 136, gap: 20, pad: 76, num: 168, rev: 30, stackGap: 0 },
  "1:1": { star: 140, gap: 18, pad: 70, num: 160, rev: 30, stackGap: 48 },
  "9:16": { star: 140, gap: 18, pad: 70, num: 184, rev: 32, stackGap: 72 },
};
export const DIVIDE = 64; // space either side of the 16:9 divider
export const VALUE_W = 280;

// ---------- timeline (150-frame loop) ----------
export const T = { drainA: 10, drainDur: 12, inA: 30, inB: 44, sweepA: 46, sweepB: 96, click: 100, homeA: 104, homeB: 124 } as const;

// A five-point star in a 100 box; drawn with a round-joined stroke of the same colour so the points are softly rounded.
const star = (() => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 43 : 20;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(2)} ${(54 + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
})();
export const STAR_JOIN = 9;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
export const isDark = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  if (Number.isNaN(n)) return false;
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.4;
};
export const cleanRating = (r: number) => Math.min(5, Math.max(0.5, Math.round((Number(r) || 4.5) * 2) / 2));
type Pt = [number, number];
const glide = (a: Pt, b: Pt, t: number): Pt => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const bow = Math.sin(Math.PI * clamp01(t)) * 0.08;
  return [a[0] + dx * t - dy * bow, a[1] + dy * t + dx * bow];
};

export const StarRating: React.FC<StarRatingProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, u, ratio } = useLayout();
  const id = `str${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const g = GEO[ratio];
  const row = ratio === "16:9";
  const dark = isDark(p.background);
  const rating = cleanRating(p.rating);
  const popK = Math.min(0.16, Math.max(0, (Number(p.pop) || 1.08) - 1));

  // ---- layout (px)
  const S = g.star * u;
  const G = g.gap * u;
  const pad = g.pad * u;
  const starsW = 5 * S + 4 * G;
  const numH = g.num * u * 1.05;
  const W = row ? pad * 2 + starsW + DIVIDE * 2 * u + VALUE_W * u : pad * 2 + starsW;
  const H = row ? pad * 2 + Math.max(S, numH + g.rev * u * 1.6) : pad * 2 + numH + g.stackGap * u + S;
  const left = (width - W) / 2;
  const top = (height - H) / 2;
  const starsL = pad;
  const starsT = row ? (H - S) / 2 : pad + numH + g.stackGap * u;
  const starX = (i: number) => starsL + i * (S + G);

  // ---- cursor and the hovered value
  const hoverAt = (x: number) => {
    const rel = x - starsL;
    if (rel <= 0) return 0;
    const i = Math.floor(rel / (S + G));
    if (i >= 5) return 5;
    const local = (rel - i * (S + G)) / S;
    if (local > 1) return i + 1;
    return i + (local <= 0.5 ? 0.5 : 1);
  };
  const ti = rating % 1 === 0 ? rating - 1 : Math.floor(rating);
  const endX = starX(ti) + (rating % 1 === 0 ? 0.72 : 0.3) * S;
  const y0 = starsT + S * 0.62;
  const startPt: Pt = [starsL - 44 * u, y0];
  const endPt: Pt = [endX, y0];
  const home: Pt = row ? [starsL + starsW + DIVIDE * u * 0.5, H - pad * 0.4] : [starsL + starsW * 0.86, H - pad * 0.35];
  const cursorAt = (f: number): Pt => {
    if (f >= T.homeA) return glide(endPt, home, progress(f, T.homeA, T.homeB, "travel"));
    if (f >= T.sweepA) return [mix(startPt[0], endPt[0], progress(f, T.sweepA, T.sweepB, p.ease)), y0];
    if (f >= T.inA) return glide(home, startPt, progress(f, T.inA, T.inB, "travel"));
    return home;
  };
  // v: the value the stars show. The loop starts full, drains to empty, then the sweep fills it again.
  const valueAt = (f: number) => (f >= T.homeA ? rating : f >= T.sweepA ? hoverAt(cursorAt(f)[0]) : 0);
  const v = valueAt(frame);
  const cur = cursorAt(frame);

  // when each star last gained fill during the sweep → its pop
  const last = [-99, -99, -99, -99, -99];
  let lastValue = -99;
  for (let f = T.sweepA; f <= Math.min(frame, T.homeA); f++) {
    const a = valueAt(f - 1);
    const b = valueAt(f);
    if (b !== a) lastValue = f;
    for (let i = 0; i < 5; i++) if (clamp01(b - i) > clamp01(a - i)) last[i] = f;
  }
  const popAt = (at: number, k: number) => 1 + k * (progress(frame, at, at + 8, "spring") - progress(frame, at + 5, at + 16, "spring"));

  const drain = (i: number) => 1 - progress(frame, T.drainA + (4 - i) * 3, T.drainA + (4 - i) * 3 + T.drainDur, "exit");
  const bump = (c: number) => interpolate(frame, [c - 3, c, c + 5], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const press = bump(T.click);
  // Before the sweep the stars drain right to left and the number counts down with them in half steps.
  const draining = frame < T.sweepA;
  const fracOf = (i: number) => (draining ? clamp01(rating - i) : clamp01(v - i));
  const shown = draining ? Math.round([0, 1, 2, 3, 4].reduce((a, i) => a + clamp01(rating - i) * drain(i), 0) * 2) / 2 : v;
  const valueText = shown.toFixed(1);
  const numScale = popAt(lastValue, 0.04) * (1 + 0.05 * bump(T.click + 3));

  const hair = Math.max(1, u);
  const strokeJ = STAR_JOIN;
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
        {/* stars: one SVG; the accent copy is clipped by x for half-star precision */}
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <defs>
            {[0, 1, 2, 3, 4].map((i) => {
              const frac = fracOf(i);
              return (
                <clipPath key={i} id={`${id}-c${i}`}>
                  <rect x={-10} y={-10} width={frac >= 1 ? 120 : frac * 100} height={120} />
                </clipPath>
              );
            })}
          </defs>
          {[0, 1, 2, 3, 4].map((i) => {
            const sc = popAt(last[i], popK);
            const fillOn = draining ? drain(i) : 1;
            return (
              <g key={i} transform={`translate(${starX(i) + S / 2} ${starsT + S / 2}) scale(${sc}) translate(${-S / 2} ${-S / 2}) scale(${S / 100})`}>
                <path d={star} fill={p.line} stroke={p.line} strokeWidth={strokeJ} strokeLinejoin="round" />
                <path d={star} fill={p.accent} stroke={p.accent} strokeWidth={strokeJ} strokeLinejoin="round" clipPath={`url(#${id}-c${i})`} opacity={fillOn} />
              </g>
            );
          })}
          {row ? <line x1={starsL + starsW + DIVIDE * u} x2={starsL + starsW + DIVIDE * u} y1={pad} y2={H - pad} stroke={p.line} strokeWidth={hair} /> : null}
        </svg>

        {/* value + reviews */}
        <div
          style={{
            position: "absolute",
            left: row ? starsL + starsW + DIVIDE * 2 * u : pad,
            right: row ? undefined : pad,
            top: row ? (H - (numH + g.rev * u * 1.6)) / 2 : pad,
            display: "flex",
            flexDirection: row ? "column" : "row",
            alignItems: row ? "flex-start" : "flex-end",
            justifyContent: row ? undefined : "space-between",
            whiteSpace: "nowrap",
          }}
        >
          <div
            style={{
              fontSize: g.num * u,
              lineHeight: `${numH}px`,
              height: numH,
              fontWeight: 600,
              letterSpacing: "-0.045em",
              color: shown > 0 ? p.ink : p.ink3,
              transformOrigin: row ? "0% 60%" : "0% 70%",
              transform: `scale(${numScale})`,
            }}
          >
            {valueText}
          </div>
          <div style={{ fontSize: g.rev * u, color: p.ink2, letterSpacing: "-0.01em", marginTop: row ? 4 * u : 0, marginBottom: row ? 0 : numH * 0.16 }}>{p.reviews}</div>
        </div>

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
