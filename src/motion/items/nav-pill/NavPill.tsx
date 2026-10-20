import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { FONT_SANS, RADIUS, STROKE, mix, progress, useLayout } from "../../kit";

export type NavPillProps = {
  background: string;
  fill: string;
  line: string;
  ink: string;
  ink2: string;
  accent: string;
  onAccent: string;
  item1: string;
  item2: string;
  item3: string;
  item4: string;
  stretch: number; // frames the trailing edge lags the leading edge
  ease: string;
};

// ---------- geometry (px at 1080 on the short side) ----------
// Pill heights equal twice their radius token, so every item is a true pill.
export const GEO = {
  "16:9": { h: 96, radius: RADIUS.hero, font: 44, icon: 40, pad: 40, gap: 16, extra: 24 },
  "1:1": { h: 64, radius: RADIUS.card, font: 30, icon: 28, pad: 26, gap: 12, extra: 16 },
  "9:16": { h: 64, radius: RADIUS.card, font: 30, icon: 28, pad: 26, gap: 12, extra: 16 },
} as const;
export const CHAR_W = 0.56; // average Inter 500 advance, in em

// ---------- timeline (frames of a 150-frame loop) ----------
export const CLICKS: { f: number; to: number }[] = [
  { f: 18, to: 1 },
  { f: 44, to: 2 },
  { f: 70, to: 3 },
  { f: 102, to: 0 },
];
export const LEAD = 14; // frames the leading edge travels
export const SETTLE = [6, 20] as const; // width shuffle window after a click
export const LEGS: { a: number; b: number; from: number; to: number }[] = [
  { a: 2, b: 15, from: -1, to: 1 },
  { a: 24, b: 41, from: 1, to: 2 },
  { a: 50, b: 67, from: 2, to: 3 },
  { a: 78, b: 99, from: 3, to: 0 },
  { a: 110, b: 136, from: 0, to: -1 },
];

const ICONS = [
  "M4.5 10.5 12 4.5l7.5 6V19.5h-5v-5.5h-5v5.5h-5z", // home
  "M4 5.5h5.5a2.5 2.5 0 0 1 2.5 2.5v11a2 2 0 0 0-2-2H4zM20 5.5h-5.5A2.5 2.5 0 0 0 12 8v11a2 2 0 0 1 2-2h6z", // open book
  "M4 8.5h16v10H4zM9 8.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v2.5M4 13h16", // briefcase
  "M20.5 12a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0zM12 11v5.5M12 7.8v.4", // info
];

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
type Pt = [number, number];
const glide = (a: Pt, b: Pt, t: number): Pt => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const bow = Math.sin(Math.PI * clamp01(t)) * 0.1;
  return [a[0] + dx * t - dy * bow, a[1] + dy * t + dx * bow];
};

export const NavPill: React.FC<NavPillProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, u, ratio } = useLayout();
  const g = GEO[ratio];
  const labels = [p.item1, p.item2, p.item3, p.item4];
  const lag = Math.min(8, Math.max(0, Math.round(Number(p.stretch) || 0)));

  // ---- base widths, shrunk to fit if labels get long
  const raw = labels.map((l) => 2 * g.pad + g.icon + 0.35 * g.font + l.length * CHAR_W * g.font);
  const rawTotal = raw.reduce((a, b) => a + b, 0) + g.gap * (labels.length - 1) + g.extra;
  const sc = Math.min(1, (width * 0.88) / u / rawTotal);
  const fs = g.font * sc * u;
  const iconPx = g.icon * sc * u;
  const gap = g.gap * sc * u;
  const extra = g.extra * sc * u;
  const base = raw.map((r) => r * sc * u);
  const h = g.h * u;

  // ---- fold the clicks: width weights (who is "landed" active) and the accent pill's edges
  let ws = [1, 0, 0, 0];
  for (const c of CLICKS) {
    const t = progress(frame, c.f + SETTLE[0], c.f + SETTLE[1], p.ease);
    ws = ws.map((v, i) => v * (1 - t) + (i === c.to ? t : 0));
  }
  const widths = base.map((b, i) => b + extra * ws[i]);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (labels.length - 1);
  const left0 = (width - total) / 2;
  const xs: number[] = [];
  widths.reduce((acc, w, i) => ((xs[i] = acc), acc + w + gap), left0);

  let from = 0;
  let L = xs[0];
  let R = xs[0] + widths[0];
  for (const c of CLICKS) {
    if (frame < c.f) break;
    const tLead = progress(frame, c.f, c.f + LEAD, p.ease);
    const tTrail = progress(frame, c.f + lag, c.f + lag + LEAD, p.ease);
    const fromL = xs[from];
    const fromR = xs[from] + widths[from];
    const toL = xs[c.to];
    const toR = xs[c.to] + widths[c.to];
    const right = c.to > from;
    L = mix(fromL, toL, right ? tTrail : tLead);
    R = mix(fromR, toR, right ? tLead : tTrail);
    from = c.to;
  }

  // ---- cursor
  const cy = height / 2;
  const top = cy - h / 2;
  const rest: Pt = [width / 2 + total * 0.12, top + h + 120 * u];
  const at = (i: number): Pt => (i < 0 ? rest : [xs[i] + widths[i] * 0.55, top + h * 0.62]);
  let cur: Pt = rest;
  for (const l of LEGS) if (frame >= l.a) cur = glide(at(l.from), at(l.to), progress(frame, l.a, l.b, "travel"));
  const bump = (c: number) => interpolate(frame, [c - 3, c, c + 5], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const presses = CLICKS.map((c) => bump(c.f));
  const press = Math.max(...presses);
  const pressOf = (i: number) => {
    const k = CLICKS.findIndex((c) => c.to === i);
    return k >= 0 ? presses[k] : 0;
  };
  const hair = Math.max(1, u);

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS }}>
      {/* resting pills */}
      {labels.map((_, i) => (
        <div
          key={`bg${i}`}
          style={{
            position: "absolute",
            left: xs[i],
            top,
            width: widths[i],
            height: h,
            borderRadius: g.radius * u,
            background: p.fill,
            boxShadow: `inset 0 0 0 ${hair}px ${p.line}`,
            transform: `scale(${1 - 0.03 * pressOf(i)})`,
          }}
        />
      ))}

      {/* the accent pill: slides and stretches between items */}
      <div style={{ position: "absolute", left: L, top, width: Math.max(h, R - L), height: h, borderRadius: g.radius * u, background: p.accent }} />

      {/* labels, coloured by how much of each item the accent pill covers */}
      {labels.map((l, i) => {
        const ov = clamp01((Math.min(R, xs[i] + widths[i]) - Math.max(L, xs[i])) / widths[i]);
        const col = interpolateColors(ov, [0, 1], [p.ink2, p.onAccent]);
        return (
          <div
            key={`t${i}`}
            style={{
              position: "absolute",
              left: xs[i],
              top,
              width: widths[i],
              height: h,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.35 * fs,
              fontSize: fs,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              color: col,
              whiteSpace: "nowrap",
            }}
          >
            <svg width={iconPx} height={iconPx} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth={(STROKE.ring * u * 24) / iconPx} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d={ICONS[i % ICONS.length]} />
            </svg>
            <span>{l}</span>
          </div>
        );
      })}

      {/* cursor */}
      <svg
        width={30 * u}
        height={41 * u}
        viewBox="0 0 16 22"
        style={{ position: "absolute", left: cur[0], top: cur[1], overflow: "visible", transformOrigin: "0 0", transform: `scale(${1 - 0.12 * press})` }}
      >
        <path d="M1 1V17.4L5.1 13.6 7.9 20.2 10.7 19 7.9 12.5H13.6Z" fill={p.ink} stroke={p.background} strokeWidth={1.3} strokeLinejoin="round" />
      </svg>
    </AbsoluteFill>
  );
};
