import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, alpha, progress, useLayout } from "../../kit";

export type BarChartRiseProps = {
  background: string;
  ink: string;
  muted: string;
  grid: string;
  bar: string;
  accent: string;
  accentInk: string;
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

export const BarChartRise: React.FC<BarChartRiseProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, u, ratio, isVertical, durationInFrames } = useLayout();
  const { values, decimals } = parseValues(p.values);
  const n = values.length;
  const labels = parseLabels(p.labels, n);
  const max = Math.max(...values);
  const hi = values.indexOf(max);
  const { top, step } = niceScale(max);
  const tickCount = Math.round(top / step);

  const wide = ratio === "16:9";
  const padX = (wide ? 128 : 84) * u;
  const padTop = (wide ? 104 : isVertical ? 180 : 84) * u;
  const padBottom = (wide ? 96 : isVertical ? 220 : 72) * u;
  const titleSize = (wide ? 68 : 60) * u;
  const headerH = (isVertical ? 330 : wide ? 190 : 180) * u;
  const axisW = 76 * u;
  const left = padX + axisW;
  const right = width - padX;
  const chartTop = padTop + headerH + 80 * u;
  const base = height - padBottom - 56 * u;
  const chartH = base - chartTop;
  const slot = (right - left) / n;
  const barW = Math.min(slot * 0.58, 120 * u);
  const r = Math.min(14 * u, barW * 0.22);

  // Bars must finish by 70% of the loop so the final chart holds; long lists compress the stagger.
  const start = 22;
  const dur = 34;
  const st = Math.min(p.stagger, (durationInFrames * 0.7 - start - dur) / Math.max(1, n - 1));
  const head = progress(frame, 0, 22, "smooth");

  const hiStart = start + hi * st;
  const count = progress(frame, hiStart, hiStart + dur + 6, "smooth");
  const first = values[0];
  const deltaPct = first > 0 ? ((values[n - 1] - first) / first) * 100 : null;
  const chip = progress(frame, hiStart + dur, hiStart + dur + 14, "smooth");

  const mono: React.CSSProperties = { fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums" };

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS, color: p.ink }}>
      {/* header */}
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
          gap: 40 * u,
          opacity: head,
          transform: `translateY(${(1 - head) * 24 * u}px)`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 * u }}>
          <span style={{ ...mono, fontSize: 20 * u, letterSpacing: "0.14em", textTransform: "uppercase", color: p.muted }}>
            {labels[0]} – {labels[n - 1]}
          </span>
          <span style={{ fontSize: titleSize, fontWeight: 650, letterSpacing: "-0.04em", lineHeight: 1.02, maxWidth: (isVertical ? 900 : wide ? 1000 : 560) * u }}>{p.title}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: isVertical ? "flex-start" : "flex-end", gap: 10 * u }}>
          <span style={{ ...mono, fontSize: 20 * u, letterSpacing: "0.14em", textTransform: "uppercase", color: p.muted }}>Peak · {labels[hi]}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 18 * u }}>
            {deltaPct !== null && (
              <span
                style={{
                  ...mono,
                  fontSize: 22 * u,
                  fontWeight: 600,
                  color: p.accent,
                  background: alpha(p.accent, 0.14),
                  padding: `${8 * u}px ${14 * u}px`,
                  borderRadius: 999,
                  opacity: chip,
                  transform: `scale(${0.85 + 0.15 * chip})`,
                }}
              >
                {deltaPct >= 0 ? "+" : "−"}
                {fmt(Math.abs(deltaPct), 0)}%
              </span>
            )}
            <span style={{ fontSize: 84 * u, fontWeight: 650, letterSpacing: "-0.045em", lineHeight: 1, color: p.accent, fontVariantNumeric: "tabular-nums" }}>
              {fmt(max * count, decimals)}
            </span>
          </div>
        </div>
      </div>

      {/* gridlines */}
      <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }}>
        {Array.from({ length: tickCount + 1 }, (_, k) => {
          const y = base - (k / tickCount) * chartH;
          const g = progress(frame, 4 + k * 3, 30 + k * 3, "smooth");
          return (
            <line
              key={k}
              x1={left - 8 * u}
              x2={left - 8 * u + (right - left + 8 * u) * g}
              y1={y}
              y2={y}
              stroke={k === 0 ? alpha(p.ink, 0.28) : p.grid}
              strokeWidth={(k === 0 ? 2 : 1.5) * u}
              strokeDasharray={k === 0 ? undefined : `${4 * u} ${8 * u}`}
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
              right: width - left + 22 * u,
              top: y - 13 * u,
              fontSize: 20 * u,
              lineHeight: `${26 * u}px`,
              color: p.muted,
              opacity: progress(frame, 8 + k * 3, 30 + k * 3, "smooth"),
            }}
          >
            {fmt(k * step, step % 1 === 0 ? 0 : 1)}
          </span>
        );
      })}

      {/* bars */}
      {values.map((v, i) => {
        const s0 = start + i * st;
        const g = progress(frame, s0, s0 + dur, p.ease);
        const h = Math.max(0, (v / top) * chartH * g);
        const x = left + i * slot + (slot - barW) / 2;
        const isHi = i === hi;
        const lbl = progress(frame, s0 + dur * 0.55, s0 + dur, "smooth");
        const shown = v * Math.min(1, progress(frame, s0, s0 + dur, "smooth"));
        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: "absolute",
                left: x,
                top: base - h,
                width: barW,
                height: h,
                borderRadius: `${r}px ${r}px ${r * 0.25}px ${r * 0.25}px`,
                background: isHi ? `linear-gradient(180deg, ${p.accent}, ${alpha(p.accent, 0.78)})` : `linear-gradient(180deg, ${p.bar}, ${alpha(p.bar, 0.6)})`,
                boxShadow: isHi ? `0 ${18 * u}px ${56 * u}px ${alpha(p.accent, 0.38)}` : "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: x + barW / 2,
                top: base - h - (isHi ? 58 : 44) * u,
                transform: `translateX(-50%) translateY(${(1 - lbl) * 10 * u}px)`,
                opacity: lbl,
                ...mono,
                fontSize: (isHi ? 22 : 20) * u,
                fontWeight: isHi ? 600 : 400,
                color: isHi ? p.accentInk : p.muted,
                background: isHi ? p.accent : "transparent",
                padding: isHi ? `${6 * u}px ${12 * u}px` : 0,
                borderRadius: 999,
                whiteSpace: "nowrap",
              }}
            >
              {fmt(shown, decimals)}
            </div>
            <span
              style={{
                position: "absolute",
                left: x + barW / 2,
                top: base + 20 * u,
                transform: "translateX(-50%)",
                fontSize: 22 * u,
                fontWeight: isHi ? 600 : 400,
                color: isHi ? p.ink : p.muted,
                whiteSpace: "nowrap",
                opacity: progress(frame, s0, s0 + 16, "smooth"),
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
