import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STROKE, progress, useLayout } from "../../kit";
import type { Ratio } from "../../types";

export type MemberSelectorProps = {
  background: string;
  card: string;
  line: string;
  ink: string;
  ink2: string;
  ink3: string;
  button: string; // counter pill surface
  onButton: string;
  sub: string; // secondary text on the pill
  pillLine: string; // divider on the pill
  accent: string;
  onAccent: string;
  title: string;
  name1: string;
  name2: string;
  name3: string;
  name4: string;
  name5: string;
  ease: string;
};

// ---------- avatars drawn in code: initials on soft grey tones ----------
const rgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const n = parseInt(f, 16);
  if (Number.isNaN(n)) return [128, 128, 128];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const blend = (a: string, b: string, t: number) => {
  const x = rgb(a);
  const y = rgb(b);
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(", ")})`;
};
// ink mixed into the card at these strengths, with initials at these strengths
export const TONES = [
  { bg: 0.08, fg: 0.72 },
  { bg: 0.16, fg: 1 },
  { bg: 0.05, fg: 0.55 },
  { bg: 0.24, fg: 1 },
  { bg: 0.12, fg: 0.8 },
];
const words = (name: string) => name.trim().split(/\s+/).filter(Boolean);
export const initials = (name: string) => {
  const w = words(name);
  if (!w.length) return "?";
  if (w.length === 1) return [...w[0]][0].toUpperCase();
  return ([...w[0]][0] + [...w[w.length - 1]][0]).toUpperCase();
};
export const firstName = (name: string) => words(name)[0] ?? "";

// ---------- geometry (px at 1080 on the short side) ----------
// The pill is exactly twice its radius token tall, so it is a true pill.
export const GEO: Record<Ratio, { cols: number; d: number; colW: number; pad: number; head: number; name: number; rowGap: number; pillH: number; pillR: number; pillFont: number }> = {
  "16:9": { cols: 6, d: 150, colW: 204, pad: 64, head: 36, name: 28, rowGap: 0, pillH: 96, pillR: RADIUS.hero, pillFont: 30 },
  "1:1": { cols: 6, d: 104, colW: 148, pad: 40, head: 28, name: 22, rowGap: 0, pillH: 64, pillR: RADIUS.card, pillFont: 22 },
  "9:16": { cols: 3, d: 176, colW: 270, pad: 56, head: 38, name: 32, rowGap: 56, pillH: 96, pillR: RADIUS.hero, pillFont: 30 },
};
export const RING_GAP = 7;

// ---------- timeline (180-frame loop) ----------
export const PICKS = [
  { i: 0, f: 30 },
  { i: 2, f: 56 },
  { i: 3, f: 82 },
];
export const CLEAR = 120;
export const LEGS = [
  { a: 10, b: 28 }, // rest → first pick
  { a: 38, b: 54 },
  { a: 64, b: 80 },
  { a: 98, b: 118 }, // → "Clear"
  { a: 128, b: 152 }, // → rest
];
export const PILL_IN = [31, 51] as const;
export const PILL_OUT = [124, 138] as const;

type Pt = [number, number];
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const glide = (a: Pt, b: Pt, t: number): Pt => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const bow = Math.sin(Math.PI * clamp01(t)) * 0.08;
  return [a[0] + dx * t - dy * bow, a[1] + dy * t + dx * bow];
};
const isDark = (hex: string) => {
  const [r, g, b] = rgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.4;
};

export const MemberSelector: React.FC<MemberSelectorProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, u, ratio } = useLayout();
  const g = GEO[ratio];
  const names = [p.name1, p.name2, p.name3, p.name4, p.name5];
  const hair = Math.max(1, u);

  // ---- layout
  const d = g.d * u;
  const pad = g.pad * u;
  const rows = Math.ceil(6 / g.cols);
  const headH = g.head * 1.5 * u;
  const cellH = d + 20 * u + g.name * 1.3 * u;
  const gridTop0 = pad + headH + 64 * u;
  const cw = g.cols * g.colW * u + 2 * pad;
  const ch = gridTop0 + rows * cellH + (rows - 1) * g.rowGap * u + pad - 8 * u;
  const pillH = g.pillH * u;
  const total = ch + 36 * u + pillH;
  const left = (width - cw) / 2;
  const top = (height - total) / 2;
  const cell = (i: number): Pt => {
    const col = i % g.cols;
    const row = Math.floor(i / g.cols);
    return [left + pad + g.colW * u * (col + 0.5), top + gridTop0 + row * (cellH + g.rowGap * u) + d / 2];
  };

  // ---- selection state
  const bump = (at: number) => interpolate(frame, [at - 3, at, at + 5], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const deselect = (k: number) => progress(frame, CLEAR + 1 + 3 * k, CLEAR + 15 + 3 * k, "exit");
  const state = names.map((_, i) => {
    const k = PICKS.findIndex((c) => c.i === i);
    if (k < 0) return { sel: 0, ring: 0, badge: 0, press: 0 };
    const f = PICKS[k].f;
    const out = deselect(k);
    const inn = progress(frame, f + 1, f + 13, p.ease);
    const pop = interpolate(frame, [f + 1, f + 7, f + 12], [0, 1.18, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return { sel: inn * (1 - out), ring: inn, badge: pop * (1 - out), press: bump(f) };
  });

  // ---- counter pill
  const pf = g.pillFont * u;
  const pillW = 12.4 * pf;
  const pillLeft = (width - pillW) / 2;
  const pillTop = top + ch + 36 * u;
  const pin = progress(frame, PILL_IN[0], PILL_IN[1], "enter");
  const pout = progress(frame, PILL_OUT[0], PILL_OUT[1], "exit");
  const n = Math.max(1, PICKS.filter((c) => frame >= c.f).length);
  const rollK = PICKS.findIndex((c, k) => k > 0 && frame >= c.f && frame < c.f + 12);
  const roll = rollK > 0 ? progress(frame, PICKS[rollK].f, PICKS[rollK].f + 10, "enter") : 1;
  const clearPress = bump(CLEAR);
  const clearPt: Pt = [pillLeft + pillW - 0.9 * pf - 1.4 * pf, pillTop + pillH * 0.55];

  // ---- cursor
  const rest: Pt = [left + cw * 0.82, top + ch + 44 * u];
  const at = (i: number): Pt => {
    const c = cell(i);
    return [c[0] + d * 0.1, c[1] + d * 0.12];
  };
  const stops: Pt[] = [rest, at(PICKS[0].i), at(PICKS[1].i), at(PICKS[2].i), clearPt, rest];
  let cur: Pt = rest;
  LEGS.forEach((l, k) => {
    if (frame >= l.a) cur = glide(stops[k], stops[k + 1], progress(frame, l.a, l.b, "travel"));
  });
  const press = Math.max(...PICKS.map((c) => bump(c.f)), clearPress);

  const toneOf = (i: number) => {
    const t = TONES[i % TONES.length];
    return { bg: blend(p.card, p.ink, t.bg), fg: blend(p.card, p.ink, t.fg) };
  };
  const shadow = isDark(p.background) ? "none" : `0 ${u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)`;
  const badge = d * 0.3;
  const off = d * 0.354;
  const digitH = pf * 1.25;

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS }}>
      {/* card */}
      <div style={{ position: "absolute", left, top, width: cw, height: ch, borderRadius: RADIUS.card * u, background: p.card, boxShadow: shadow === "none" ? `inset 0 0 0 ${hair}px ${p.line}` : `inset 0 0 0 ${hair}px ${p.line}, ${shadow}` }} />
      <div style={{ position: "absolute", left: left + pad, top: top + pad, width: cw - 2 * pad, height: headH, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: g.head * u, fontWeight: 500, letterSpacing: "-0.02em", color: p.ink, whiteSpace: "nowrap" }}>{p.title}</div>
        <div style={{ fontFamily: FONT_MONO, fontSize: g.head * 0.5 * u, letterSpacing: "0.12em", color: p.ink3 }}>5 MEMBERS</div>
      </div>
      <div style={{ position: "absolute", left: left + pad, top: top + pad + headH + 28 * u, width: cw - 2 * pad, height: hair, background: p.line }} />

      {/* members */}
      {names.map((nm, i) => {
        const [x, y] = cell(i);
        const s = state[i];
        const tone = toneOf(i);
        const ringD = d + 2 * RING_GAP * u;
        return (
          <React.Fragment key={`m${i}`}>
            <div
              style={{
                position: "absolute",
                left: x - d / 2,
                top: y - d / 2,
                width: d,
                height: d,
                borderRadius: 999,
                background: tone.bg,
                boxShadow: `inset 0 0 0 ${hair}px ${p.line}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: d * 0.34,
                fontWeight: 500,
                letterSpacing: "-0.02em",
                color: tone.fg,
                transform: `scale(${1 - 0.05 * s.press})`,
              }}
            >
              {initials(nm)}
            </div>
            {s.sel > 0.001 && (
              <div
                style={{
                  position: "absolute",
                  left: x - ringD / 2,
                  top: y - ringD / 2,
                  width: ringD,
                  height: ringD,
                  boxSizing: "border-box",
                  borderRadius: 999,
                  border: `${STROKE.ring * u}px solid ${p.accent}`,
                  opacity: s.sel,
                  transform: `scale(${1.12 - 0.12 * s.ring})`,
                }}
              />
            )}
            {s.badge > 0.001 && (
              <div
                style={{
                  position: "absolute",
                  left: x + off - badge / 2,
                  top: y + off - badge / 2,
                  width: badge,
                  height: badge,
                  borderRadius: 999,
                  background: p.accent,
                  boxShadow: `0 0 0 ${STROKE.bar * u}px ${p.card}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${s.badge})`,
                }}
              >
                <svg width={badge} height={badge} viewBox="0 0 24 24" fill="none">
                  <path d="M7 12.4l3.3 3.3L17 9" stroke={p.onAccent} strokeWidth={(STROKE.ring * u * 24) / badge} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
            <div
              style={{
                position: "absolute",
                left: x - (g.colW * u) / 2,
                width: g.colW * u,
                top: y + d / 2 + 20 * u,
                textAlign: "center",
                fontSize: g.name * u,
                fontWeight: 500,
                letterSpacing: "-0.01em",
                color: interpolateColors(s.sel, [0, 1], [p.ink3, p.ink]),
                whiteSpace: "nowrap",
              }}
            >
              {firstName(nm)}
            </div>
          </React.Fragment>
        );
      })}

      {/* add */}
      {(() => {
        const [x, y] = cell(5);
        const sw = STROKE.ring * u;
        const r = d / 2 - sw / 2;
        const circ = 2 * Math.PI * r;
        const dash = circ / 28;
        return (
          <>
            <svg width={d} height={d} viewBox={`0 0 ${d} ${d}`} style={{ position: "absolute", left: x - d / 2, top: y - d / 2 }}>
              <circle cx={d / 2} cy={d / 2} r={r} fill="none" stroke={blend(p.card, p.ink, 0.3)} strokeWidth={sw} strokeDasharray={`${dash * 0.55} ${dash * 0.45}`} />
              <path d={`M${d / 2 - d * 0.13} ${d / 2}H${d / 2 + d * 0.13}M${d / 2} ${d / 2 - d * 0.13}V${d / 2 + d * 0.13}`} stroke={p.ink2} strokeWidth={sw} strokeLinecap="round" />
            </svg>
            <div style={{ position: "absolute", left: x - (g.colW * u) / 2, width: g.colW * u, top: y + d / 2 + 20 * u, textAlign: "center", fontSize: g.name * u, fontWeight: 500, letterSpacing: "-0.01em", color: p.ink3 }}>Add</div>
          </>
        );
      })()}

      {/* counter pill */}
      {pin > 0.001 && pout < 0.999 && (
        <div
          style={{
            position: "absolute",
            left: pillLeft,
            top: pillTop + (1 - pin) * 40 * u + pout * 24 * u,
            width: pillW,
            height: pillH,
            boxSizing: "border-box",
            padding: `0 ${0.9 * pf}px`,
            borderRadius: g.pillR * u,
            background: p.button,
            boxShadow: shadow,
            opacity: pin * (1 - pout),
            display: "flex",
            alignItems: "center",
            fontSize: pf,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            color: p.onButton,
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ position: "relative", width: 0.62 * pf, height: digitH, overflow: "hidden" }}>
            {roll < 1 && (
              <div style={{ position: "absolute", left: 0, top: 0, height: digitH, lineHeight: `${digitH}px`, opacity: 1 - roll, transform: `translateY(${-roll * digitH}px)` }}>{`${n - 1}`}</div>
            )}
            <div style={{ position: "absolute", left: 0, top: 0, height: digitH, lineHeight: `${digitH}px`, opacity: roll, transform: `translateY(${(1 - roll) * digitH}px)` }}>{`${n}`}</div>
          </div>
          <div style={{ marginLeft: 0.28 * pf }}>selected</div>
          <div style={{ flex: 1 }} />
          <div style={{ width: hair, height: pillH * 0.4, background: p.pillLine, marginRight: 0.8 * pf }} />
          <div style={{ color: p.sub, transform: `scale(${1 - 0.06 * clearPress})` }}>Clear</div>
        </div>
      )}

      {/* cursor */}
      <svg
        width={30 * u}
        height={41 * u}
        viewBox="0 0 16 22"
        style={{ position: "absolute", left: cur[0], top: cur[1], overflow: "visible", transformOrigin: "0 0", transform: `scale(${1 - 0.12 * press})` }}
      >
        <path d="M1 1V17.4L5.1 13.6 7.9 20.2 10.7 19 7.9 12.5H13.6Z" fill={p.ink} stroke={p.background} strokeWidth={STROKE.hair} strokeLinejoin="round" />
      </svg>
    </AbsoluteFill>
  );
};
