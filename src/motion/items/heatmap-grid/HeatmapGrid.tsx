import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, alpha, progress, useLayout } from "../../kit";

export type HeatmapGridProps = {
  background: string;
  ink: string;
  muted: string;
  empty: string;
  cell: string;
  title: string;
  values: string;
  months: string;
  wave: number; // frames of delay per diagonal step
  ease: string;
};

const DEFAULT_VALUES = [4, 6, 5, 8, 7, 9, 12, 10, 14, 13, 16, 15, 18, 17, 21, 19, 24, 22, 26, 28];
const DEFAULT_MONTHS = ["Jun", "Jul", "Aug", "Sep", "Oct"];
// Weekdays run busier than weekends, which makes the grid read like real activity.
const DAY_FACTOR = [1, 1.08, 1.04, 0.98, 0.9, 0.55, 0.45];
const DAY_NAMES = ["Mon", "", "Wed", "", "Fri", "", ""];
const STEP_ALPHA = [0.24, 0.46, 0.72, 1];

export const parseWeeks = (s: string) => {
  const list = String(s)
    .split(",")
    .map((x) => parseFloat(x.trim()))
    .filter((n) => Number.isFinite(n))
    .map((n) => Math.max(0, n))
    .slice(0, 22);
  return list.length >= 8 && Math.max(...list) > 0 ? list : DEFAULT_VALUES;
};

export const parseMonths = (s: string) => {
  const list = String(s).split(",").map((x) => x.trim()).filter((x) => x !== "").slice(0, 7);
  return list.length ? list : DEFAULT_MONTHS;
};

const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const levelFor = (weeks: number[], w: number, d: number) => {
  const max = Math.max(...weeks);
  const r = random(`heat-${w}-${d}`);
  if (r < 0.07) return 0;
  const raw = (weeks[w] / max) * DAY_FACTOR[d] * 4 + (random(`heat-n-${w}-${d}`) - 0.5) * 1.6;
  return Math.max(0, Math.min(4, Math.round(raw)));
};

export const HeatmapGrid: React.FC<HeatmapGridProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, u, ratio, isVertical, durationInFrames } = useLayout();
  const weeks = parseWeeks(p.values);
  const months = parseMonths(p.months);
  const n = weeks.length;
  const total = weeks.reduce((a, b) => a + b, 0);

  const wide = ratio === "16:9";
  const pad = (wide ? 128 : isVertical ? 90 : 80) * u;
  const padTop = (wide ? 110 : isVertical ? 200 : 90) * u;
  const sideLabel = (isVertical ? 90 : 72) * u;
  const cols = isVertical ? 7 : n;
  const rows = isVertical ? n : 7;
  const headerH = (isVertical ? 300 : 190) * u;
  const availW = width - pad * 2 - sideLabel;
  const availH = height - padTop - headerH - (isVertical ? 380 : 220) * u;
  const pitch = Math.min((isVertical ? 112 : 66) * u, availW / cols, availH / rows);
  const size = pitch * 0.82;
  const gridW = cols * pitch;
  const gridH = rows * pitch;
  const gridLeft = pad + sideLabel + (availW - gridW) / 2;
  const regionTop = padTop + headerH;
  const regionH = height - regionTop - (isVertical ? 200 : 60) * u;
  const gridTop = regionTop + (regionH - gridH) / 2;

  const start = 18;
  const dur = 14;
  const w = Math.min(p.wave, (durationInFrames * 0.7 - start - dur) / (n + 5));
  const doneAt = start + (n + 5) * w + dur;
  const head = progress(frame, 0, 22, "smooth");
  const count = progress(frame, start, doneAt, "smooth");
  const labelsOn = progress(frame, 8, 28, "smooth");
  const mono: React.CSSProperties = { fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums" };
  const fill = (lvl: number) => (lvl === 0 ? p.empty : alpha(p.cell, STEP_ALPHA[lvl - 1]));

  const cells: React.ReactNode[] = [];
  for (let wk = 0; wk < n; wk++) {
    for (let d = 0; d < 7; d++) {
      const lvl = levelFor(weeks, wk, d);
      const e = progress(frame, start + (wk + d) * w, start + (wk + d) * w + dur, p.ease);
      const col = isVertical ? d : wk;
      const row = isVertical ? wk : d;
      const s = size * (0.35 + 0.65 * e);
      const cx = gridLeft + col * pitch + pitch / 2;
      const cy = gridTop + row * pitch + pitch / 2;
      cells.push(
        <rect key={`${wk}-${d}`} x={cx - s / 2} y={cy - s / 2} width={Math.max(0, s)} height={Math.max(0, s)} rx={size * 0.22} fill={fill(lvl)} opacity={Math.min(1, Math.max(0, e))} />,
      );
    }
  }

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS, color: p.ink }}>
      <div
        style={{
          position: "absolute",
          left: pad,
          right: pad,
          top: padTop,
          display: "flex",
          flexDirection: isVertical ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isVertical ? "flex-start" : "flex-end",
          gap: 36 * u,
          opacity: head,
          transform: `translateY(${(1 - head) * 24 * u}px)`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 * u }}>
          <span style={{ ...mono, fontSize: 20 * u, letterSpacing: "0.14em", textTransform: "uppercase", color: p.muted }}>Last {n} weeks</span>
          <span style={{ fontSize: (wide ? 68 : 60) * u, fontWeight: 650, letterSpacing: "-0.04em", lineHeight: 1.02, maxWidth: (isVertical ? 900 : wide ? 1000 : 560) * u }}>{p.title}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: isVertical ? "flex-start" : "flex-end", gap: 10 * u }}>
          <span style={{ ...mono, fontSize: 20 * u, letterSpacing: "0.14em", textTransform: "uppercase", color: p.muted }}>Total</span>
          <span style={{ fontSize: 84 * u, fontWeight: 650, letterSpacing: "-0.045em", lineHeight: 1, color: p.cell, fontVariantNumeric: "tabular-nums" }}>{fmt(total * count)}</span>
        </div>
      </div>

      <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }}>
        {cells}
      </svg>

      {months.map((m, k) => {
        const at = Math.min(n - 1, Math.round((k * n) / months.length));
        const style: React.CSSProperties = isVertical
          ? { right: width - gridLeft + 20 * u, top: gridTop + at * pitch + (pitch - 26 * u) / 2 }
          : { left: gridLeft + at * pitch + (pitch - size) / 2, top: gridTop - 44 * u };
        return (
          <span key={k} style={{ position: "absolute", ...style, fontSize: 22 * u, lineHeight: `${26 * u}px`, color: p.muted, opacity: labelsOn, whiteSpace: "nowrap" }}>
            {m}
          </span>
        );
      })}
      {DAY_NAMES.map((dn, d) =>
        dn ? (
          <span
            key={d}
            style={{
              position: "absolute",
              ...(isVertical
                ? { left: gridLeft + d * pitch + pitch / 2, top: gridTop - 44 * u, transform: "translateX(-50%)" }
                : { right: width - gridLeft + 20 * u, top: gridTop + d * pitch + (pitch - 24 * u) / 2 }),
              ...mono,
              fontSize: 19 * u,
              lineHeight: `${24 * u}px`,
              color: p.muted,
              opacity: labelsOn,
            }}
          >
            {dn}
          </span>
        ) : null,
      )}

      <div
        style={{
          position: "absolute",
          right: width - (gridLeft + gridW) + (pitch - size) / 2,
          top: gridTop + gridH + 28 * u,
          display: "flex",
          alignItems: "center",
          gap: 8 * u,
          ...mono,
          fontSize: 19 * u,
          color: p.muted,
          opacity: progress(frame, doneAt - 10, doneAt + 6, "smooth"),
        }}
      >
        <span style={{ marginRight: 6 * u }}>Less</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} style={{ width: 22 * u, height: 22 * u, borderRadius: 6 * u, background: fill(l) }} />
        ))}
        <span style={{ marginLeft: 6 * u }}>More</span>
      </div>
    </AbsoluteFill>
  );
};
