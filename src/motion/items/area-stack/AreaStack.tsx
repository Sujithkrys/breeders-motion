import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, progress, useLayout } from "../../kit";

export type AreaStackProps = {
  background: string;
  ink: string;
  muted: string;
  grid: string;
  colorA: string;
  colorB: string;
  colorC: string;
  title: string;
  names: string;
  seriesA: string;
  seriesB: string;
  seriesC: string;
  reveal: number; // % of the duration the chart takes to grow across
  ease: string;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DEFAULT_SERIES = [
  [32, 38, 41, 47, 52, 58, 66, 71, 79, 88],
  [18, 22, 21, 27, 31, 30, 36, 40, 44, 49],
  [8, 9, 12, 13, 15, 18, 19, 23, 26, 30],
];
const DEFAULT_NAMES = ["Subscriptions", "Services", "Marketplace"];

const parseList = (s: string) =>
  String(s)
    .split(",")
    .map((x) => parseFloat(x.trim()))
    .filter((n) => Number.isFinite(n))
    .map((n) => Math.max(0, n))
    .slice(0, 12);

// Series may differ in length; trim all three to the shortest so the stack stays aligned.
export const parseSeries = (a: string, b: string, c: string) => {
  const lists = [parseList(a), parseList(b), parseList(c)].map((l, i) => (l.length >= 2 ? l : DEFAULT_SERIES[i]));
  const n = Math.min(...lists.map((l) => l.length));
  return lists.map((l) => l.slice(0, n));
};

export const parseNames = (s: string) => {
  const list = String(s).split(",").map((x) => x.trim());
  return [0, 1, 2].map((i) => list[i] || DEFAULT_NAMES[i]);
};

const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const niceScale = (max: number, ticks = 4) => {
  if (max <= 0) return { top: ticks, step: 1 };
  const rough = max / ticks;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  return { top: step * Math.ceil(max / step - 1e-9), step };
};

type Pt = { x: number; y: number };
type Seg = { p0: Pt; c1: Pt; c2: Pt; p1: Pt };

// Monotone cubic (Fritsch–Carlson). Control x sits at thirds, so x(t) is linear and y at any x is a direct lookup.
const monotone = (pts: Pt[]): Seg[] => {
  const n = pts.length;
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1].x - pts[i].x || 1);
    m.push((pts[i + 1].y - pts[i].y) / dx[i]);
  }
  const t: number[] = pts.map((_, i) => (i === 0 ? m[0] : i === n - 1 ? m[n - 2] : m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i] / m[i];
    const b = t[i + 1] / m[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      t[i] = k * a * m[i];
      t[i + 1] = k * b * m[i];
    }
  }
  return dx.map((d, i) => ({
    p0: pts[i],
    c1: { x: pts[i].x + d / 3, y: pts[i].y + (t[i] * d) / 3 },
    c2: { x: pts[i + 1].x - d / 3, y: pts[i + 1].y - (t[i + 1] * d) / 3 },
    p1: pts[i + 1],
  }));
};

const forward = (segs: Seg[]) => segs.map((s) => `C ${s.c1.x} ${s.c1.y} ${s.c2.x} ${s.c2.y} ${s.p1.x} ${s.p1.y}`).join(" ");
const backward = (segs: Seg[]) =>
  segs
    .slice()
    .reverse()
    .map((s) => `C ${s.c2.x} ${s.c2.y} ${s.c1.x} ${s.c1.y} ${s.p0.x} ${s.p0.y}`)
    .join(" ");

const yAt = (segs: Seg[], x: number) => {
  const s = segs.find((g) => x <= g.p1.x) ?? segs[segs.length - 1];
  const t = Math.min(1, Math.max(0, (x - s.p0.x) / Math.max(1e-6, s.p1.x - s.p0.x)));
  const mt = 1 - t;
  return mt ** 3 * s.p0.y + 3 * mt * mt * t * s.c1.y + 3 * mt * t * t * s.c2.y + t ** 3 * s.p1.y;
};

export const AreaStack: React.FC<AreaStackProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, u, ratio, isVertical, durationInFrames } = useLayout();
  const id = `ast${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const series = parseSeries(p.seriesA, p.seriesB, p.seriesC);
  const names = parseNames(p.names);
  const colors = [p.colorA, p.colorB, p.colorC];
  const n = series[0].length;
  const totals = series[0].map((_, i) => series[0][i] + series[1][i] + series[2][i]);
  const { top: yTop, step } = niceScale(Math.max(...totals));
  const ticks = Math.round(yTop / step);

  const wide = ratio === "16:9";
  const padX = (wide ? 128 : 84) * u;
  const padTop = (wide ? 104 : isVertical ? 200 : 84) * u;
  const padBottom = (wide ? 104 : isVertical ? 260 : 80) * u;
  const headerH = (isVertical ? 300 : wide ? 190 : 200) * u;
  const left = padX + 76 * u;
  const right = width - padX;
  const top = padTop + headerH + 70 * u;
  const bottom = height - padBottom - 56 * u;
  const cw = right - left;
  const ch = bottom - top;

  const xs = Array.from({ length: n }, (_, i) => left + (i / (n - 1)) * cw);
  const cum = [0, 1, 2].map((k) => series[0].map((_, i) => series.slice(0, k + 1).reduce((acc, s) => acc + s[i], 0)));
  const tops = cum.map((c) => monotone(c.map((v, i) => ({ x: xs[i], y: bottom - (v / yTop) * ch }))));

  const g0 = 16;
  const g1 = g0 + (p.reveal / 100) * durationInFrames;
  const g = Math.min(1, progress(frame, g0, g1, p.ease));
  const edgeX = left + cw * g;
  const edgeOn = progress(frame, g0, g0 + 6, "enter") * (1 - progress(frame, g1, g1 + 14, "enter"));
  const head = progress(frame, 0, 22, "enter");
  const legendCount = progress(frame, g0, g1, "enter");
  const mono: React.CSSProperties = { fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums" };
  const labelEvery = isVertical && n > 8 ? 2 : 1;

  const legend = (
    <div style={{ display: "flex", flexDirection: isVertical ? "row" : "column", flexWrap: "wrap", gap: isVertical ? `${14 * u}px ${36 * u}px` : 12 * u, alignItems: isVertical ? "center" : "flex-end" }}>
      {[2, 1, 0].map((k, row) => {
        const on = progress(frame, 10 + row * 5, 28 + row * 5, "enter");
        return (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 14 * u, opacity: on, transform: `translateY(${(1 - on) * 12 * u}px)` }}>
            <span style={{ width: 18 * u, height: 18 * u, borderRadius: 5 * u, background: colors[k] }} />
            <span style={{ fontSize: 24 * u, fontWeight: 500, letterSpacing: "-0.01em" }}>{names[k]}</span>
            <span style={{ ...mono, fontSize: 22 * u, color: p.muted, minWidth: 56 * u, textAlign: "right" }}>{fmt(series[k][n - 1] * legendCount)}</span>
          </div>
        );
      })}
    </div>
  );

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS, color: p.ink }}>
      <div
        style={{
          position: "absolute",
          left: padX,
          right: padX,
          top: padTop,
          display: "flex",
          flexDirection: isVertical ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isVertical ? "flex-start" : "flex-end",
          gap: 36 * u,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 * u, opacity: head, transform: `translateY(${(1 - head) * 24 * u}px)` }}>
          <span style={{ ...mono, fontSize: 20 * u, letterSpacing: "0.14em", textTransform: "uppercase", color: p.muted }}>
            {MONTHS[0]} – {MONTHS[(n - 1) % 12]}
          </span>
          <span style={{ fontSize: (wide ? 68 : 60) * u, fontWeight: 650, letterSpacing: "-0.04em", lineHeight: 1.02, maxWidth: (isVertical ? 900 : wide ? 1000 : 520) * u }}>{p.title}</span>
        </div>
        {legend}
      </div>

      <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          {colors.map((c, k) => (
            <linearGradient key={k} id={`${id}-f${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={c} stopOpacity={1} />
              <stop offset="1" stopColor={c} stopOpacity={0.82} />
            </linearGradient>
          ))}
          <clipPath id={`${id}-clip`}>
            <rect x={left - 2 * u} y={0} width={Math.max(0, edgeX - left + 2 * u)} height={height} />
          </clipPath>
        </defs>

        {Array.from({ length: ticks + 1 }, (_, k) => {
          const y = bottom - (k / ticks) * ch;
          const gl = progress(frame, 4 + k * 3, 30 + k * 3, "enter");
          return (
            <line
              key={k}
              x1={left - 8 * u}
              x2={left - 8 * u + (cw + 8 * u) * gl}
              y1={y}
              y2={y}
              stroke={p.grid}
              strokeWidth={1.5 * u}
              strokeDasharray={k === 0 ? undefined : `${4 * u} ${8 * u}`}
            />
          );
        })}

        <g clipPath={`url(#${id}-clip)`}>
          {[0, 1, 2].map((k) => {
            const segs = tops[k];
            const first = segs[0].p0;
            const below = k === 0 ? null : tops[k - 1];
            const end = below ? below[below.length - 1].p1 : null;
            const base = below && end ? `L ${end.x} ${end.y} ${backward(below)}` : `L ${right} ${bottom} L ${left} ${bottom}`;
            const on = progress(frame, g0 + k * 5, g0 + 16 + k * 5, "enter");
            return (
              <g key={k} opacity={on}>
                <path d={`M ${first.x} ${first.y} ${forward(segs)} ${base} Z`} fill={`url(#${id}-f${k})`} />
                <path d={`M ${first.x} ${first.y} ${forward(segs)}`} fill="none" stroke={k === 2 ? colors[2] : p.background} strokeWidth={(k === 2 ? 3 : 2.5) * u} strokeLinecap="round" />
              </g>
            );
          })}
        </g>

        <g opacity={edgeOn}>
          <line x1={edgeX} x2={edgeX} y1={yAt(tops[2], edgeX) - 24 * u} y2={bottom} stroke={p.ink} strokeOpacity={0.45} strokeWidth={1.5 * u} />
          {[0, 1, 2].map((k) => (
            <circle key={k} cx={edgeX} cy={yAt(tops[k], edgeX)} r={7 * u} fill={colors[k]} stroke={p.background} strokeWidth={3 * u} />
          ))}
        </g>
      </svg>

      {Array.from({ length: ticks + 1 }, (_, k) => {
        const y = bottom - (k / ticks) * ch;
        return (
          <span key={k} style={{ ...mono, position: "absolute", right: width - left + 22 * u, top: y - 13 * u, fontSize: 20 * u, lineHeight: `${26 * u}px`, color: p.muted, opacity: progress(frame, 8 + k * 3, 30 + k * 3, "enter") }}>
            {fmt(k * step)}
          </span>
        );
      })}
      {xs.map((x, i) =>
        i % labelEvery === 0 || i === n - 1 ? (
          <span key={i} style={{ position: "absolute", left: x, top: bottom + 20 * u, transform: "translateX(-50%)", fontSize: 22 * u, color: p.muted, whiteSpace: "nowrap", opacity: progress(frame, 10, 30, "enter") }}>
            {MONTHS[i % 12]}
          </span>
        ) : null,
      )}
    </AbsoluteFill>
  );
};
