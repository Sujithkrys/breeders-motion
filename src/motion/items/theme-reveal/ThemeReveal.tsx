import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STROKE, mix, progress, useLayout } from "../../kit";
import type { Ratio } from "../../types";

export type ThemeRevealProps = {
  background: string;
  card: string;
  line: string;
  fill: string;
  ink: string;
  ink2: string;
  ink3: string;
  altBackground: string;
  altCard: string;
  altLine: string;
  altFill: string;
  altInk: string;
  altInk2: string;
  altInk3: string;
  accent: string;
  title: string;
  value: string;
  speed: number; // frames the reveal takes
  ease: string;
};

type Theme = { bg: string; card: string; line: string; fill: string; ink: string; ink2: string; ink3: string };

// ---------- geometry (design px; k = scale × u). 9:16 re-flows to a narrower, taller screen with a taller chart ----------
export const SCALE: Record<Ratio, number> = { "16:9": 1.7, "1:1": 1.4, "9:16": 1.6 };
export const PAD = 30;
export const BTN = 40;
export const CHART_TOP = 192;
export const layoutFor = (ratio: Ratio) => {
  const vertical = ratio === "9:16";
  const cw = vertical ? 560 : 620;
  const chartH = vertical ? 330 : 130;
  const foot = CHART_TOP + chartH + 22;
  return { cw, chartH, foot, ch: foot + 78 };
};
export const BARS = [38, 52, 45, 61, 49, 66, 58, 72, 64, 79, 70, 84, 77, 92];
export const STATS: [string, string][] = [
  ["Orders", "1,284"],
  ["Avg. order", "$37.60"],
  ["Refunds", "0.8%"],
];

// ---------- timeline (150-frame loop) ----------
export const T = { mv1A: 10, mv1B: 28, click1: 31, open: 32, hoverA: 46, hoverB: 66, mv2A: 88, mv2B: 104, click2: 107, close: 108, homeA: 116, homeB: 136 } as const;
export const clampSpeed = (s: number) => Math.min(30, Math.max(18, Math.round(Number(s) || 26)));

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
  const bow = Math.sin(Math.PI * clamp01(t)) * 0.06;
  return [a[0] + dx * t - dy * bow, a[1] + dy * t + dx * bow];
};

const SUN = "M12 2.8v2.1M12 19.1v2.1M5.5 5.5 7 7M17 17l1.5 1.5M2.8 12h2.1M19.1 12h2.1M5.5 18.5 7 17M17 7l1.5-1.5";
const MOON = "M19.5 14.2A7.8 7.8 0 0 1 9.8 4.5a7.8 7.8 0 1 0 9.7 9.7z";

// One full copy of the screen in one theme. Both copies are drawn with identical geometry; only colours differ.
const Scene: React.FC<{
  th: Theme;
  moon: boolean;
  iconIn: number;
  p: ThemeRevealProps;
  k: number;
  u: number;
  ratio: Ratio;
  cur: Pt;
  press: number;
}> = ({ th, moon, iconIn, p, k, u, ratio, cur, press }) => {
  const L = layoutFor(ratio);
  const dark = isDark(th.bg);
  const hair = Math.max(1, u);
  const vb = (n: number) => (n * u) / k; // a token width in px, expressed in design units
  const chartW = L.cw - 2 * PAD;
  const plotH = L.chartH - 24;
  const slot = chartW / BARS.length;
  const barW = slot * 0.58;
  const icon = 18 * k;

  return (
    <AbsoluteFill style={{ background: th.bg, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div
        style={{
          position: "relative",
          width: L.cw * k,
          height: L.ch * k,
          background: th.card,
          borderRadius: RADIUS.card * u,
          border: `${hair}px solid ${th.line}`,
          boxSizing: "border-box",
          boxShadow: dark ? "none" : `0 ${u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)`,
          color: th.ink,
        }}
      >
        {/* header */}
        <div style={{ position: "absolute", left: PAD * k, top: 26 * k, height: BTN * k, display: "flex", alignItems: "center", gap: 10 * k, whiteSpace: "nowrap" }}>
          <span style={{ width: 10 * k, height: 10 * k, borderRadius: 999, background: p.accent }} />
          <span style={{ fontSize: 17 * k, fontWeight: 500, letterSpacing: "-0.02em" }}>{p.title}</span>
        </div>
        <div
          style={{
            position: "absolute",
            left: (L.cw - PAD - BTN) * k,
            top: 26 * k,
            width: BTN * k,
            height: BTN * k,
            borderRadius: 999,
            background: th.fill,
            border: `${hair}px solid ${th.line}`,
            boxSizing: "border-box",
            transform: `scale(${1 - 0.08 * press})`,
          }}
        >
          <svg
            width={icon}
            height={icon}
            viewBox="0 0 24 24"
            fill="none"
            stroke={th.ink}
            strokeWidth={(STROKE.ring * u * 24) / icon}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: "absolute", left: (BTN * k - icon) / 2 - hair, top: (BTN * k - icon) / 2 - hair, transform: `rotate(${(moon ? -1 : 1) * 90 * (1 - iconIn)}deg) scale(${mix(0.5, 1, iconIn)})`, opacity: iconIn }}
          >
            {moon ? (
              <path d={MOON} />
            ) : (
              <>
                <circle cx={12} cy={12} r={4.2} />
                <path d={SUN} />
              </>
            )}
          </svg>
        </div>

        {/* KPI */}
        <div style={{ position: "absolute", left: PAD * k, top: 88 * k, fontFamily: FONT_MONO, fontSize: 10.5 * k, letterSpacing: "0.12em", color: th.ink3, whiteSpace: "nowrap" }}>LAST 30 DAYS</div>
        <div style={{ position: "absolute", left: PAD * k, top: 104 * k, fontSize: 48 * k, lineHeight: `${54 * k}px`, letterSpacing: "-0.045em", whiteSpace: "nowrap" }}>{p.value}</div>
        <div style={{ position: "absolute", left: PAD * k, top: 162 * k, fontSize: 13 * k, color: th.ink2, whiteSpace: "nowrap", display: "flex", gap: 5 * k }}>
          <span style={{ fontWeight: 500, color: th.ink }}>+12.4%</span>
          <span>vs last month</span>
        </div>

        {/* chart: bars, gridlines and axis labels in one SVG */}
        <svg width={chartW * k} height={L.chartH * k} viewBox={`0 0 ${chartW} ${L.chartH}`} style={{ position: "absolute", left: PAD * k, top: CHART_TOP * k }}>
          {[0, 0.5].map((g) => (
            <line key={g} x1={0} x2={chartW} y1={plotH * g + 0.5} y2={plotH * g + 0.5} stroke={th.line} strokeWidth={vb(STROKE.hair)} strokeDasharray={`${vb(4)} ${vb(5)}`} />
          ))}
          <line x1={0} x2={chartW} y1={plotH} y2={plotH} stroke={th.line} strokeWidth={vb(STROKE.hair)} />
          {BARS.map((v, i) => {
            const h = (plotH * v) / 100;
            return <rect key={i} x={slot * i + (slot - barW) / 2} y={plotH - h} width={barW} height={h} rx={Math.min(barW / 2, vb(RADIUS.chip))} fill={i === BARS.length - 1 ? p.accent : th.ink3} opacity={i === BARS.length - 1 ? 1 : 0.55} />;
          })}
          <g fontFamily={FONT_MONO} fontSize={9.5} fill={th.ink3} letterSpacing="0.06em">
            <text x={0} y={L.chartH - 4}>OCT 1</text>
            <text x={chartW / 2} y={L.chartH - 4} textAnchor="middle">OCT 15</text>
            <text x={chartW} y={L.chartH - 4} textAnchor="end">OCT 30</text>
          </g>
        </svg>

        {/* footer stats */}
        <div style={{ position: "absolute", left: PAD * k, right: PAD * k, top: L.foot * k, height: hair, background: th.line }} />
        <div style={{ position: "absolute", left: PAD * k, right: PAD * k, top: (L.foot + 18) * k, display: "flex" }}>
          {STATS.map(([label, val]) => (
            <div key={label} style={{ flex: 1, whiteSpace: "nowrap" }}>
              <div style={{ fontSize: 12 * k, color: th.ink3 }}>{label}</div>
              <div style={{ marginTop: 6 * k, fontSize: 17 * k, fontWeight: 500, letterSpacing: "-0.02em" }}>{val}</div>
            </div>
          ))}
        </div>

        {/* cursor */}
        <svg
          width={16 * u * 2.2}
          height={22 * u * 2.2}
          viewBox="0 0 16 22"
          style={{ position: "absolute", left: cur[0] * k - u, top: cur[1] * k - u, overflow: "visible", transformOrigin: "0 0", transform: `scale(${1 - 0.12 * press})` }}
        >
          <path d="M1 1V17.4L5.1 13.6 7.9 20.2 10.7 19 7.9 12.5H13.6Z" fill={th.ink} stroke={th.card} strokeWidth={1.3} strokeLinejoin="round" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

export const ThemeReveal: React.FC<ThemeRevealProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, u, ratio } = useLayout();
  const k = SCALE[ratio] * u;
  const L = layoutFor(ratio);
  const speed = clampSpeed(p.speed);

  // ---- reveal radius from the toggle's centre to the farthest corner
  const ox = (width - L.cw * k) / 2 + (L.cw - PAD - BTN / 2) * k;
  const oy = (height - L.ch * k) / 2 + (26 + BTN / 2) * k;
  const maxR = Math.max(Math.hypot(ox, oy), Math.hypot(width - ox, oy), Math.hypot(ox, height - oy), Math.hypot(width - ox, height - oy)) + 2 * u;
  const rr = clamp01(progress(frame, T.open, T.open + speed, p.ease) - progress(frame, T.close, T.close + speed, p.ease));
  const r = maxR * rr;

  const moonIn = progress(frame, T.click1 + 1, T.click1 + 15, "enter");
  const sunIn = frame < T.click2 ? 1 : progress(frame, T.click2 + 1, T.click2 + 15, "enter");

  // ---- cursor (card coords), shared by both copies so it flips colour as the circle passes
  const R: Pt = [L.cw * 0.56, CHART_TOP + L.chartH * 0.62];
  const hover: Pt = [L.cw * 0.84, CHART_TOP + L.chartH * 0.3];
  const btn: Pt = [L.cw - PAD - BTN / 2 + 2, 26 + BTN / 2 + 3];
  let cur: Pt = R;
  if (frame >= T.homeA) cur = glide(btn, R, progress(frame, T.homeA, T.homeB, "travel"));
  else if (frame >= T.mv2A) cur = glide(hover, btn, progress(frame, T.mv2A, T.mv2B, "travel"));
  else if (frame >= T.hoverA) cur = glide(btn, hover, progress(frame, T.hoverA, T.hoverB, "travel"));
  else if (frame >= T.mv1A) cur = glide(R, btn, progress(frame, T.mv1A, T.mv1B, "travel"));
  const bump = (at: number) => interpolate(frame, [at - 3, at, at + 5], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const press = Math.max(bump(T.click1), bump(T.click2));

  const light: Theme = { bg: p.background, card: p.card, line: p.line, fill: p.fill, ink: p.ink, ink2: p.ink2, ink3: p.ink3 };
  const alt: Theme = { bg: p.altBackground, card: p.altCard, line: p.altLine, fill: p.altFill, ink: p.altInk, ink2: p.altInk2, ink3: p.altInk3 };
  const shared = { p, k, u, ratio, cur, press };

  return (
    <AbsoluteFill style={{ background: p.background }}>
      <Scene th={light} moon={false} iconIn={sunIn} {...shared} />
      {r > 0.5 ? (
        <AbsoluteFill style={{ clipPath: `circle(${r}px at ${ox}px ${oy}px)` }}>
          <Scene th={alt} moon iconIn={moonIn} {...shared} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
