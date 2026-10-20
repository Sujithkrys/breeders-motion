import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STAGGER, STROKE, alpha, progress, useLayout } from "../../kit";

export type LineChartDrawProps = {
  background: string;
  ink: string;
  ink2: string;
  ink3: string;
  line: string;
  accent: string;
  tooltip: string;
  tooltipInk: string;
  success: string;
  error: string;
  title: string;
  labels: string;
  values: string;
  draw: number; // % of the duration the line takes to draw
  ease: string;
};

const DEFAULT_VALUES = [24, 31, 28, 42, 39, 55, 61, 58, 72, 84];
const DEFAULT_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const parseValues = (s: string): { values: number[]; decimals: number } => {
  const tokens = String(s).split(",").map((x) => x.trim()).filter((x) => x !== "" && Number.isFinite(parseFloat(x)));
  if (tokens.length < 2) return { values: DEFAULT_VALUES, decimals: 0 };
  const list = tokens.slice(0, 16);
  const decimals = Math.min(2, Math.max(...list.map((x) => (x.split(".")[1] ?? "").length)));
  return { values: list.map((x) => parseFloat(x)), decimals };
};

export const parseLabels = (s: string, n: number) => {
  const list = String(s).split(",").map((x) => x.trim());
  return Array.from({ length: n }, (_, i) => list[i] || DEFAULT_LABELS[i % 12]);
};

const fmt = (n: number, d = 0) => {
  const [int, frac] = Math.abs(n).toFixed(d).split(".");
  return (n < 0 ? "-" : "") + int.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (frac ? `.${frac}` : "");
};

// Nice step on the data range; the axis floor drops to 0 when the data sits close to it.
export const niceDomain = (min: number, max: number, ticks = 4) => {
  const lo0 = min >= 0 && min < max * 0.4 ? 0 : min;
  const span = Math.max(max - lo0, 1e-6);
  const rough = span / ticks;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  const lo = Math.floor(lo0 / step + 1e-9) * step;
  const hi = Math.max(lo + step, Math.ceil(max / step - 1e-9) * step);
  return { lo, hi, step };
};

// Dark canvases get no surface shadow (the system's rule for Ink).
const isDark = (hex: string) => {
  const h = hex.replace("#", "");
  const v = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  if (!Number.isFinite(v)) return false;
  return 0.2126 * ((v >> 16) & 255) + 0.7152 * ((v >> 8) & 255) + 0.0722 * (v & 255) < 128;
};

type Pt = { x: number; y: number };
type Seg = { p0: Pt; c1: Pt; c2: Pt; p1: Pt };

// Monotone cubic (Fritsch–Carlson): smooth like a spline but never overshoots the data between points.
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

const bez = (s: Seg, t: number): Pt => {
  const a = (1 - t) ** 3;
  const b = 3 * (1 - t) ** 2 * t;
  const c = 3 * (1 - t) * t * t;
  const d = t ** 3;
  return { x: a * s.p0.x + b * s.c1.x + c * s.c2.x + d * s.p1.x, y: a * s.p0.y + b * s.c1.y + c * s.c2.y + d * s.p1.y };
};

// Shared with the prompt.
export const DRAW_START = 16;

export const LineChartDraw: React.FC<LineChartDrawProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, u, ratio, isVertical, durationInFrames } = useLayout();
  // Unique SVG ids: the grid renders many players on one page.
  const id = `lcd${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const { values, decimals } = parseValues(p.values);
  const n = values.length;
  const labels = parseLabels(p.labels, n);
  const { lo, hi, step } = niceDomain(Math.min(...values), Math.max(...values));
  const ticks = Math.round((hi - lo) / step);

  const wide = ratio === "16:9";
  const padX = (wide ? 200 : 84) * u;
  const padTop = (wide ? 120 : isVertical ? 200 : 96) * u;
  const padBottom = (wide ? 112 : isVertical ? 260 : 80) * u;
  const headerH = (isVertical ? 300 : 140) * u;
  const left = padX + 64 * u;
  const right = width - padX - 16 * u;
  const top = padTop + headerH + 130 * u;
  const bottom = height - padBottom - 48 * u;
  const cw = right - left;
  const ch = bottom - top;

  const pts: Pt[] = values.map((v, i) => ({ x: left + (i / (n - 1)) * cw, y: bottom - ((v - lo) / (hi - lo)) * ch }));
  const segs = monotone(pts);
  const d = segs.reduce((acc, s) => `${acc} C ${s.c1.x} ${s.c1.y} ${s.c2.x} ${s.c2.y} ${s.p1.x} ${s.p1.y}`, `M ${pts[0].x} ${pts[0].y}`);

  // Arc-length table so the dash and the tracking dot agree on where the tip is.
  const samples: Pt[] = [pts[0]];
  segs.forEach((s) => {
    for (let k = 1; k <= 24; k++) samples.push(bez(s, k / 24));
  });
  const cum: number[] = [0];
  for (let i = 1; i < samples.length; i++) cum.push(cum[i - 1] + Math.hypot(samples[i].x - samples[i - 1].x, samples[i].y - samples[i - 1].y));
  const L = cum[cum.length - 1];
  const pointAt = (len: number): Pt => {
    if (len <= 0) return samples[0];
    let i = 1;
    while (i < cum.length - 1 && cum[i] < len) i++;
    const f = Math.min(1, (len - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]));
    return { x: samples[i - 1].x + (samples[i].x - samples[i - 1].x) * f, y: samples[i - 1].y + (samples[i].y - samples[i - 1].y) * f };
  };

  const drawEnd = DRAW_START + (p.draw / 100) * durationInFrames;
  const t = Math.min(1, progress(frame, DRAW_START, drawEnd, p.ease));
  const tip = pointAt(L * t);
  const tipValue = lo + ((bottom - tip.y) / ch) * (hi - lo);
  const tipIdx = Math.min(n - 1, Math.max(0, Math.round(((tip.x - left) / cw) * (n - 1))));
  const head = progress(frame, 0, 22, "enter");
  const area = progress(frame, DRAW_START + 6, DRAW_START + 30, "enter");
  const tipIn = progress(frame, DRAW_START, DRAW_START + 18, "enter");

  const last = values[n - 1];
  const first = values[0];
  const deltaPct = first !== 0 ? ((last - first) / Math.abs(first)) * 100 : null;
  const dc = deltaPct !== null && deltaPct < 0 ? p.error : p.success;
  const chip = progress(frame, drawEnd - 6, drawEnd + 14, "enter");
  const tipW = 152 * u;
  const tipH = 80 * u;
  const tipX = Math.min(Math.max(tip.x, left + tipW / 2 - 24 * u), right - tipW / 2 + 16 * u);
  const shadow = isDark(p.background) ? "none" : `0 ${1 * u}px ${2 * u}px ${alpha(p.ink, 0.04)}, 0 ${8 * u}px ${24 * u}px ${alpha(p.ink, 0.06)}`;
  const mono: React.CSSProperties = { fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums" };
  const tiny: React.CSSProperties = { ...mono, fontSize: 18 * u, letterSpacing: "0.12em", textTransform: "uppercase", color: p.ink3 };
  const labelEvery = n > 12 ? 2 : 1;

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS, color: p.ink }}>
      <div
        style={{
          position: "absolute",
          left: padX,
          right: padX,
          top: padTop,
          height: headerH,
          display: "flex",
          flexDirection: isVertical ? "column" : "row",
          justifyContent: isVertical ? "flex-end" : "space-between",
          alignItems: isVertical ? "flex-start" : "flex-end",
          gap: 36 * u,
          opacity: head,
          transform: `translateY(${(1 - head) * 24 * u}px)`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 * u, minWidth: 0 }}>
          <span style={tiny}>
            {labels[0]} – {labels[n - 1]}
          </span>
          <span style={{ fontSize: 44 * u, fontWeight: 500, letterSpacing: "-0.035em", lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", maxWidth: (isVertical ? 900 : wide ? 860 : 520) * u }}>{p.title}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 * u }}>
          {deltaPct !== null && (
            <span
              style={{
                ...mono,
                fontSize: 18 * u,
                fontWeight: 500,
                color: dc,
                background: alpha(dc, 0.12),
                padding: `${6 * u}px ${10 * u}px`,
                borderRadius: RADIUS.chip * u,
                opacity: chip,
                transform: `translateY(${(1 - chip) * 8 * u}px)`,
              }}
            >
              {deltaPct >= 0 ? "+" : "−"}
              {fmt(Math.abs(deltaPct), 0)}%
            </span>
          )}
          <span style={{ fontSize: 96 * u, fontWeight: 600, letterSpacing: "-0.045em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
            {fmt(last * progress(frame, DRAW_START, drawEnd, "enter"), decimals)}
          </span>
        </div>
      </div>

      <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <clipPath id={`${id}-clip`}>
            <rect x={left - 20 * u} y={0} width={Math.max(0, tip.x - left + 20 * u)} height={height} />
          </clipPath>
        </defs>

        {Array.from({ length: ticks + 1 }, (_, k) => {
          const y = bottom - (k / ticks) * ch;
          const g = progress(frame, 4 + k * STAGGER, 28 + k * STAGGER, "enter");
          return (
            <line
              key={k}
              x1={left}
              x2={left + cw * g}
              y1={y}
              y2={y}
              stroke={k === 0 ? p.ink : p.line}
              strokeOpacity={k === 0 ? 0.2 : 1}
              strokeWidth={STROKE.hair * u}
            />
          );
        })}

        {/* flat, low-opacity area under the line: no gradient */}
        <path d={`${d} L ${right} ${bottom} L ${left} ${bottom} Z`} fill={p.accent} fillOpacity={0.08} opacity={area} clipPath={`url(#${id}-clip)`} />
        <line x1={tip.x} x2={tip.x} y1={tip.y} y2={bottom} stroke={p.ink} strokeOpacity={0.25} strokeWidth={STROKE.hair * u} strokeDasharray={`${3 * u} ${6 * u}`} opacity={tipIn} />
        <path
          d={d}
          fill="none"
          stroke={p.accent}
          strokeWidth={STROKE.ring * u}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${L + 2} ${L + 2}`}
          strokeDashoffset={(L + 2) * (1 - t)}
        />
        <circle cx={tip.x} cy={tip.y} r={8 * u} fill={p.accent} stroke={p.background} strokeWidth={STROKE.ring * u} opacity={tipIn} />
      </svg>

      {Array.from({ length: ticks + 1 }, (_, k) => {
        const y = bottom - (k / ticks) * ch;
        return (
          <span
            key={k}
            style={{ ...mono, position: "absolute", right: width - left + 20 * u, top: y - 12 * u, fontSize: 18 * u, lineHeight: `${24 * u}px`, color: p.ink3, opacity: progress(frame, 8 + k * STAGGER, 28 + k * STAGGER, "enter") }}
          >
            {fmt(lo + k * step, step % 1 === 0 ? 0 : 1)}
          </span>
        );
      })}
      {labels.map((l, i) =>
        i % labelEvery === 0 || i === n - 1 ? (
          <span
            key={i}
            style={{
              ...mono,
              position: "absolute",
              left: pts[i].x,
              top: bottom + 20 * u,
              transform: "translateX(-50%)",
              fontSize: 18 * u,
              color: i === tipIdx && tipIn > 0 ? p.ink : p.ink3,
              fontWeight: i === tipIdx && tipIn > 0 ? 500 : 400,
              whiteSpace: "nowrap",
              opacity: progress(frame, 10, 30, "enter"),
            }}
          >
            {l}
          </span>
        ) : null,
      )}

      {/* tooltip */}
      <div
        style={{
          position: "absolute",
          left: tipX - tipW / 2,
          top: tip.y - 112 * u,
          width: tipW,
          height: tipH,
          borderRadius: RADIUS.button * u,
          background: p.tooltip,
          color: p.tooltipInk,
          boxShadow: shadow,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 6 * u,
          opacity: tipIn,
          transform: `translateY(${(1 - tipIn) * 12 * u}px)`,
        }}
      >
        <span style={{ ...mono, fontSize: 15 * u, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.6 }}>{labels[tipIdx]}</span>
        <span style={{ fontSize: 30 * u, fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{fmt(tipValue, decimals)}</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: tip.x - 7 * u,
          top: tip.y - 112 * u + tipH - 7 * u,
          width: 14 * u,
          height: 14 * u,
          background: p.tooltip,
          transform: `translateY(${(1 - tipIn) * 12 * u}px) rotate(45deg)`,
          opacity: tipIn,
        }}
      />
    </AbsoluteFill>
  );
};
