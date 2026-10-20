import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STAGGER, STROKE, progress, useLayout } from "../../kit";

export type AreaStackProps = {
  background: string;
  ink: string;
  ink2: string;
  ink3: string;
  line: string;
  accent: string;
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

// Bottom series takes the accent, the two above it step down through the greys. Shared with the prompt.
export const seriesColors = (p: Pick<AreaStackProps, "accent" | "ink2" | "ink3">) => [p.accent, p.ink2, p.ink3];
// Flat layer fills at low opacity: no gradients.
export const FILL_OPACITY = 0.14;
export const GROW_START = 16;

const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const niceScale = (max: number, ticks = 4) => {
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
  const colors = seriesColors(p);
  const n = series[0].length;
  const totals = series[0].map((_, i) => series[0][i] + series[1][i] + series[2][i]);
  const { top: yTop, step } = niceScale(Math.max(...totals));
  const ticks = Math.round(yTop / step);

  const wide = ratio === "16:9";
  const padX = (wide ? 200 : 84) * u;
  const padTop = (wide ? 120 : isVertical ? 200 : 96) * u;
  const padBottom = (wide ? 112 : isVertical ? 260 : 80) * u;
  const headerH = (isVertical ? 300 : wide ? 140 : 180) * u;
  const left = padX + 64 * u;
  const right = width - padX;
  const top = padTop + headerH + 72 * u;
  const bottom = height - padBottom - 48 * u;
  const cw = right - left;
  const ch = bottom - top;

  const xs = Array.from({ length: n }, (_, i) => left + (i / (n - 1)) * cw);
  const cum = [0, 1, 2].map((k) => series[0].map((_, i) => series.slice(0, k + 1).reduce((acc, s) => acc + s[i], 0)));
  const tops = cum.map((c) => monotone(c.map((v, i) => ({ x: xs[i], y: bottom - (v / yTop) * ch }))));

  const g0 = GROW_START;
  const g1 = g0 + (p.reveal / 100) * durationInFrames;
  const g = Math.min(1, progress(frame, g0, g1, p.ease));
  const edgeX = left + cw * g;
  const edgeOn = progress(frame, g0, g0 + 18, "enter") * (1 - progress(frame, g1, g1 + 14, "exit"));
  const head = progress(frame, 0, 22, "enter");
  const legendCount = progress(frame, g0, g1, "enter");
  const mono: React.CSSProperties = { fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums" };
  const tiny: React.CSSProperties = { ...mono, fontSize: 18 * u, letterSpacing: "0.12em", textTransform: "uppercase", color: p.ink3 };
  const labelEvery = isVertical && n > 8 ? 2 : 1;

  const legend = (
    <div style={{ display: "flex", flexDirection: isVertical ? "row" : "column", flexWrap: "wrap", gap: isVertical ? `${14 * u}px ${36 * u}px` : 12 * u, alignItems: isVertical ? "center" : "flex-end" }}>
      {[2, 1, 0].map((k, row) => {
        const on = progress(frame, 10 + row * STAGGER, 30 + row * STAGGER, "enter");
        return (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 14 * u, opacity: on, transform: `translateY(${(1 - on) * 12 * u}px)` }}>
            <span style={{ width: 14 * u, height: 14 * u, borderRadius: RADIUS.chip * u, background: colors[k] }} />
            <span style={{ fontSize: 24 * u, fontWeight: k === 0 ? 500 : 400, letterSpacing: "-0.01em", color: k === 0 ? p.ink : p.ink2 }}>{names[k]}</span>
            <span style={{ ...mono, fontSize: 20 * u, color: p.ink3, minWidth: 56 * u, textAlign: "right" }}>{fmt(series[k][n - 1] * legendCount)}</span>
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
          <span style={tiny}>
            {MONTHS[0]} – {MONTHS[(n - 1) % 12]}
          </span>
          <span style={{ fontSize: 44 * u, fontWeight: 500, letterSpacing: "-0.035em", lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", maxWidth: (isVertical ? 900 : wide ? 860 : 520) * u }}>{p.title}</span>
        </div>
        {legend}
      </div>

      <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <clipPath id={`${id}-clip`}>
            <rect x={left - 2 * u} y={0} width={Math.max(0, edgeX - left + 2 * u)} height={height} />
          </clipPath>
        </defs>

        {Array.from({ length: ticks + 1 }, (_, k) => {
          const y = bottom - (k / ticks) * ch;
          const gl = progress(frame, 4 + k * STAGGER, 28 + k * STAGGER, "enter");
          return (
            <line
              key={k}
              x1={left}
              x2={left + cw * gl}
              y1={y}
              y2={y}
              stroke={k === 0 ? p.ink : p.line}
              strokeOpacity={k === 0 ? 0.2 : 1}
              strokeWidth={STROKE.hair * u}
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
            const on = progress(frame, g0 + k * STAGGER, g0 + 18 + k * STAGGER, "enter");
            return (
              <g key={k} opacity={on}>
                <path d={`M ${first.x} ${first.y} ${forward(segs)} ${base} Z`} fill={colors[k]} fillOpacity={FILL_OPACITY} />
                <path d={`M ${first.x} ${first.y} ${forward(segs)}`} fill="none" stroke={colors[k]} strokeWidth={STROKE.ring * u} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            );
          })}
        </g>

        <g opacity={edgeOn}>
          <line x1={edgeX} x2={edgeX} y1={yAt(tops[2], edgeX) - 24 * u} y2={bottom} stroke={p.ink} strokeOpacity={0.25} strokeWidth={STROKE.hair * u} />
          {[0, 1, 2].map((k) => (
            <circle key={k} cx={edgeX} cy={yAt(tops[k], edgeX)} r={6 * u} fill={colors[k]} stroke={p.background} strokeWidth={STROKE.ring * u} />
          ))}
        </g>
      </svg>

      {Array.from({ length: ticks + 1 }, (_, k) => {
        const y = bottom - (k / ticks) * ch;
        return (
          <span key={k} style={{ ...mono, position: "absolute", right: width - left + 20 * u, top: y - 12 * u, fontSize: 18 * u, lineHeight: `${24 * u}px`, color: p.ink3, opacity: progress(frame, 8 + k * STAGGER, 28 + k * STAGGER, "enter") }}>
            {fmt(k * step)}
          </span>
        );
      })}
      {xs.map((x, i) =>
        i % labelEvery === 0 || i === n - 1 ? (
          <span key={i} style={{ ...mono, position: "absolute", left: x, top: bottom + 20 * u, transform: "translateX(-50%)", fontSize: 18 * u, color: p.ink3, whiteSpace: "nowrap", opacity: progress(frame, 10, 30, "enter") }}>
            {MONTHS[i % 12]}
          </span>
        ) : null,
      )}
    </AbsoluteFill>
  );
};
