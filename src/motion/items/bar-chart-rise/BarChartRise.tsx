import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STAGGER, STROKE, alpha, progress, useLayout } from "../../kit";

export type BarChartRiseProps = {
  background: string;
  ink: string;
  ink2: string;
  ink3: string;
  line: string;
  bar: string;
  accent: string;
  success: string;
  error: string;
  title: string;
  labels: string;
  values: string;
  stagger: number; // frames between bars
  ease: string;
};

export const DEFAULT_VALUES = [42, 68, 55, 90, 74, 98, 81];
const DEFAULT_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Wk 8", "Wk 9", "Wk 10"];

export const parseValues = (s: string): { values: number[]; decimals: number } => {
  const tokens = String(s).split(",").map((x) => x.trim()).filter((x) => x !== "" && Number.isFinite(parseFloat(x)));
  if (tokens.length < 2) return { values: DEFAULT_VALUES, decimals: 0 };
  const list = tokens.slice(0, 10);
  const decimals = Math.min(2, Math.max(...list.map((x) => (x.split(".")[1] ?? "").length)));
  return { values: list.map((x) => Math.max(0, parseFloat(x))), decimals };
};

export const parseLabels = (s: string, n: number) => {
  const list = String(s).split(",").map((x) => x.trim());
  return Array.from({ length: n }, (_, i) => list[i] || DEFAULT_LABELS[i] || `#${i + 1}`);
};

export const fmt = (n: number, d = 0) => {
  const [int, frac] = Math.abs(n).toFixed(d).split(".");
  return (n < 0 ? "-" : "") + int.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (frac ? `.${frac}` : "");
};

// Round the axis top up to 1, 2, 2.5 or 5 × 10^k so tick labels read cleanly.
export const niceScale = (max: number, ticks = 4) => {
  if (max <= 0) return { top: ticks, step: 1 };
  const rough = max / ticks;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  return { top: step * Math.ceil(max / step - 1e-9), step };
};

// Shared with the prompt so the copy always quotes the frames the preview uses.
// The cascade spans at most 8 stagger steps: past 8 bars the gap compresses instead of the chart running long.
export const BAR_START = 20;
export const BAR_DUR = 24;
export const barStep = (n: number, stagger: number) => (n > 8 ? (stagger * 7) / (n - 1) : stagger);

export const BarChartRise: React.FC<BarChartRiseProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, u, ratio, isVertical } = useLayout();
  const { values, decimals } = parseValues(p.values);
  const n = values.length;
  const labels = parseLabels(p.labels, n);
  const max = Math.max(...values);
  const hi = values.indexOf(max);
  const { top, step } = niceScale(max);
  const tickCount = Math.round(top / step);

  const wide = ratio === "16:9";
  const padX = (wide ? 200 : 84) * u;
  const padTop = (wide ? 120 : isVertical ? 180 : 96) * u;
  const padBottom = (wide ? 112 : isVertical ? 220 : 80) * u;
  const headerH = (isVertical ? 300 : 140) * u;
  const axisW = 64 * u;
  const left = padX + axisW;
  const right = width - padX;
  const chartTop = padTop + headerH + 72 * u;
  const base = height - padBottom - 48 * u;
  const chartH = base - chartTop;
  const slot = (right - left) / n;
  const barW = Math.min(slot * 0.56, 112 * u);
  const r = Math.min(RADIUS.chip * u, barW / 2);

  const st = barStep(n, Math.max(1, p.stagger || STAGGER));
  const head = progress(frame, 0, 22, "enter");
  const hiStart = BAR_START + hi * st;
  const count = progress(frame, hiStart, hiStart + BAR_DUR, "enter");
  const first = values[0];
  const deltaPct = first > 0 ? ((values[n - 1] - first) / first) * 100 : null;
  const chip = progress(frame, hiStart + BAR_DUR - 4, hiStart + BAR_DUR + 16, "enter");
  const dc = deltaPct !== null && deltaPct < 0 ? p.error : p.success;

  const mono: React.CSSProperties = { fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums" };
  const tiny: React.CSSProperties = { ...mono, fontSize: 18 * u, letterSpacing: "0.12em", textTransform: "uppercase", color: p.ink3 };

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS, color: p.ink }}>
      {/* header */}
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
        <div style={{ display: "flex", flexDirection: "column", alignItems: isVertical ? "flex-start" : "flex-end", gap: 12 * u }}>
          <span style={tiny}>Peak · {labels[hi]}</span>
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
            <span style={{ fontSize: 96 * u, fontWeight: 600, letterSpacing: "-0.045em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{fmt(max * count, decimals)}</span>
          </div>
        </div>
      </div>

      {/* gridlines */}
      <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }}>
        {Array.from({ length: tickCount + 1 }, (_, k) => {
          const y = base - (k / tickCount) * chartH;
          const g = progress(frame, 4 + k * STAGGER, 28 + k * STAGGER, "enter");
          return (
            <line
              key={k}
              x1={left}
              x2={left + (right - left) * g}
              y1={y}
              y2={y}
              stroke={k === 0 ? p.ink : p.line}
              strokeOpacity={k === 0 ? 0.2 : 1}
              strokeWidth={STROKE.hair * u}
            />
          );
        })}
      </svg>
      {Array.from({ length: tickCount + 1 }, (_, k) => {
        const y = base - (k / tickCount) * chartH;
        return (
          <span
            key={k}
            style={{
              ...mono,
              position: "absolute",
              right: width - left + 20 * u,
              top: y - 12 * u,
              fontSize: 18 * u,
              lineHeight: `${24 * u}px`,
              color: p.ink3,
              opacity: progress(frame, 8 + k * STAGGER, 28 + k * STAGGER, "enter"),
            }}
          >
            {fmt(k * step, step % 1 === 0 ? 0 : 1)}
          </span>
        );
      })}

      {/* bars */}
      {values.map((v, i) => {
        const s0 = BAR_START + i * st;
        const g = progress(frame, s0, s0 + BAR_DUR, p.ease);
        const h = Math.max(0, (v / top) * chartH * g);
        const x = left + i * slot + (slot - barW) / 2;
        const isHi = i === hi;
        const lbl = progress(frame, s0 + 8, s0 + 28, "enter");
        const shown = v * progress(frame, s0, s0 + BAR_DUR, "enter");
        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: "absolute",
                left: x,
                top: base - h,
                width: barW,
                height: h,
                borderRadius: `${r}px ${r}px 0 0`,
                background: isHi ? p.accent : p.bar,
              }}
            />
            <span
              style={{
                ...mono,
                position: "absolute",
                left: x + barW / 2,
                top: base - h - 36 * u,
                transform: `translateX(-50%) translateY(${(1 - lbl) * 8 * u}px)`,
                opacity: lbl,
                fontSize: 18 * u,
                lineHeight: `${24 * u}px`,
                fontWeight: isHi ? 500 : 400,
                color: isHi ? p.accent : p.ink3,
                whiteSpace: "nowrap",
              }}
            >
              {fmt(shown, decimals)}
            </span>
            <span
              style={{
                ...mono,
                position: "absolute",
                left: x + barW / 2,
                top: base + 20 * u,
                transform: "translateX(-50%)",
                fontSize: 18 * u,
                fontWeight: isHi ? 500 : 400,
                color: isHi ? p.ink : p.ink3,
                whiteSpace: "nowrap",
                opacity: progress(frame, s0, s0 + 18, "enter"),
              }}
            >
              {labels[i]}
            </span>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
