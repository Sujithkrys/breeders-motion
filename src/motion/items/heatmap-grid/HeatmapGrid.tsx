import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { FINAL_HOLD, FONT_MONO, FONT_SANS, RADIUS, alpha, progress, useLayout } from "../../kit";

export type HeatmapGridProps = {
  background: string;
  card: string;
  line: string;
  fill: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
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

// Timing in frames. The card rises in, cells grow in a diagonal wave, the legend fades in last, then a still hold.
export const HEAT = { cardIn: 18, headA: 4, headB: 24, labelsA: 8, labelsB: 28, start: 18, cell: 20, legendLead: 10, legendIn: 18 } as const;
// Five-step scale: level 0 is the empty `fill`; levels 1–4 mix fill → accent by these amounts.
export const STEPS = [0, 0.25, 0.5, 0.75, 1] as const;

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

// ---------- colour helpers (all inputs come from props) ----------
const hexRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  if (Number.isNaN(n)) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const mixHex = (a: string, b: string, t: number) => {
  const A = hexRgb(a);
  const B = hexRgb(b);
  return `#${A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
};
export const isDarkHex = (hex: string) => {
  const [r, g, b] = hexRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.45;
};
export const stepColor = (fill: string, accent: string, lvl: number) => mixHex(fill, accent, STEPS[Math.max(0, Math.min(4, lvl))]);

export const levelFor = (weeks: number[], w: number, d: number) => {
  const max = Math.max(...weeks);
  const r = random(`heat-${w}-${d}`);
  if (r < 0.07) return 0;
  const raw = (weeks[w] / max) * DAY_FACTOR[d] * 4 + (random(`heat-n-${w}-${d}`) - 0.5) * 1.6;
  return Math.max(0, Math.min(4, Math.round(raw)));
};

// Wave step, compressed if needed so the last cell and the legend land before the final hold.
export const waveTiming = (n: number, wave: number, durationInFrames: number) => {
  const budget = durationInFrames - FINAL_HOLD - HEAT.legendIn + HEAT.legendLead - HEAT.start - HEAT.cell;
  const w = Math.max(0, Math.min(wave, budget / (n + 5)));
  const doneAt = HEAT.start + (n + 5) * w + HEAT.cell;
  return { w, doneAt };
};

// Card layout in px. The card hugs the grid and sits centred; at 9:16 the grid is transposed.
export const heatLayout = (width: number, height: number, n: number) => {
  const u = Math.min(width, height) / 1080;
  const vertical = height > width;
  const wide = width > height;
  const cols = vertical ? 7 : n;
  const rows = vertical ? n : 7;
  const pad = (vertical ? 56 : wide ? 64 : 52) * u;
  const sideLabel = (vertical ? 76 : 64) * u;
  const topLabel = 44 * u;
  const headerH = (vertical ? 224 : 120) * u;
  const headerGap = 48 * u;
  const legendH = 72 * u;
  const maxCardW = wide ? width * 0.74 : width - 2 * (vertical ? 80 : 70) * u;
  const maxCardH = height - 2 * (wide ? 90 : vertical ? 150 : 70) * u;
  const availW = maxCardW - 2 * pad - sideLabel;
  const availH = maxCardH - 2 * pad - headerH - headerGap - topLabel - legendH;
  const pitch = Math.min((vertical ? 112 : 72) * u, availW / cols, availH / rows);
  const size = pitch * 0.84;
  const gridW = cols * pitch;
  const gridH = rows * pitch;
  const minCardW = wide ? width * 0.62 : vertical ? 640 * u : width * 0.72;
  const cardW = Math.min(maxCardW, Math.max(minCardW, gridW + sideLabel + 2 * pad));
  const cardH = 2 * pad + headerH + headerGap + topLabel + gridH + legendH;
  const cardLeft = (width - cardW) / 2;
  const cardTop = (height - cardH) / 2;
  const gridLeft = cardLeft + pad + sideLabel + (cardW - 2 * pad - sideLabel - gridW) / 2;
  const gridTop = cardTop + pad + headerH + headerGap + topLabel;
  return { u, vertical, wide, cols, rows, pad, pitch, size, gridW, gridH, cardW, cardH, cardLeft, cardTop, gridLeft, gridTop, headerH };
};

export const HeatmapGrid: React.FC<HeatmapGridProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useLayout();
  const weeks = parseWeeks(p.values);
  const months = parseMonths(p.months);
  const n = weeks.length;
  const total = weeks.reduce((a, b) => a + b, 0);
  const L = heatLayout(width, height, n);
  const { u, vertical, pitch, size, gridLeft, gridTop, gridW, gridH } = L;
  const dark = isDarkHex(p.background);

  const { w, doneAt } = waveTiming(n, p.wave, durationInFrames);
  const cardOn = progress(frame, 0, HEAT.cardIn, "enter");
  const head = progress(frame, HEAT.headA, HEAT.headB, "enter");
  const count = progress(frame, HEAT.start, doneAt, "enter");
  const labelsOn = progress(frame, HEAT.labelsA, HEAT.labelsB, "enter");
  const legendOn = progress(frame, doneAt - HEAT.legendLead, doneAt - HEAT.legendLead + HEAT.legendIn, "enter");
  const mono: React.CSSProperties = { fontFamily: FONT_MONO, fontSize: 18 * u, lineHeight: 1.2, letterSpacing: "0.12em", textTransform: "uppercase", color: p.ink3, whiteSpace: "nowrap" };
  const axis: React.CSSProperties = { position: "absolute", fontSize: 19 * u, lineHeight: `${24 * u}px`, fontWeight: 400, color: p.ink3, opacity: labelsOn, whiteSpace: "nowrap" };
  const radius = RADIUS.chip * u;

  const cells: React.ReactNode[] = [];
  for (let wk = 0; wk < n; wk++) {
    for (let d = 0; d < 7; d++) {
      const lvl = levelFor(weeks, wk, d);
      const at = HEAT.start + (wk + d) * w;
      const e = progress(frame, at, at + HEAT.cell, p.ease);
      const col = vertical ? d : wk;
      const row = vertical ? wk : d;
      const s = Math.max(0, size * (0.35 + 0.65 * e));
      const cx = gridLeft + col * pitch + pitch / 2;
      const cy = gridTop + row * pitch + pitch / 2;
      cells.push(
        <rect key={`${wk}-${d}`} x={cx - s / 2} y={cy - s / 2} width={s} height={s} rx={Math.min(radius, s / 2)} fill={stepColor(p.fill, p.accent, lvl)} opacity={Math.min(1, Math.max(0, e))} />,
      );
    }
  }

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS, color: p.ink }}>
      {/* card */}
      <div
        style={{
          position: "absolute",
          left: L.cardLeft,
          top: L.cardTop,
          width: L.cardW,
          height: L.cardH,
          boxSizing: "border-box",
          borderRadius: RADIUS.card * u,
          background: p.card,
          border: `${u}px solid ${p.line}`,
          boxShadow: dark ? "none" : `0 ${u}px ${2 * u}px ${alpha(p.ink, 0.04)}, 0 ${8 * u}px ${24 * u}px ${alpha(p.ink, 0.06)}`,
          opacity: cardOn,
          transform: `translateY(${(1 - cardOn) * 24 * u}px)`,
        }}
      />

      {/* header */}
      <div
        style={{
          position: "absolute",
          left: L.cardLeft + L.pad,
          width: L.cardW - 2 * L.pad,
          top: L.cardTop + L.pad,
          height: L.headerH,
          display: "flex",
          flexDirection: vertical ? "column" : "row",
          justifyContent: "space-between",
          alignItems: vertical ? "flex-start" : "flex-end",
          gap: 32 * u,
          opacity: head,
          transform: `translateY(${(1 - head) * 16 * u}px)`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 * u, flex: vertical ? undefined : 1, minWidth: 0, maxWidth: "100%" }}>
          <span style={mono}>Last {n} weeks</span>
          <span style={{ fontSize: 44 * u, fontWeight: 400, letterSpacing: "-0.035em", lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: vertical ? "flex-start" : "flex-end", gap: 8 * u, flexShrink: 0 }}>
          <span style={mono}>Total</span>
          <span style={{ fontFamily: FONT_SANS, fontSize: 72 * u, fontWeight: 600, letterSpacing: "-0.045em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{fmt(total * count)}</span>
        </div>
      </div>

      {/* cells */}
      <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }}>
        {cells}
      </svg>

      {/* axis labels */}
      {months.map((m, k) => {
        const at = Math.min(n - 1, Math.round((k * n) / months.length));
        const pos: React.CSSProperties = vertical
          ? { right: width - gridLeft + 18 * u, top: gridTop + at * pitch + (pitch - 24 * u) / 2 }
          : { left: gridLeft + at * pitch + (pitch - size) / 2, top: gridTop - 40 * u };
        return (
          <span key={k} style={{ ...axis, ...pos, color: p.ink2 }}>
            {m}
          </span>
        );
      })}
      {DAY_NAMES.map((dn, d) =>
        dn ? (
          <span
            key={d}
            style={{
              ...axis,
              ...(vertical
                ? { left: gridLeft + d * pitch + pitch / 2, top: gridTop - 40 * u, transform: "translateX(-50%)" }
                : { right: width - gridLeft + 18 * u, top: gridTop + d * pitch + (pitch - 24 * u) / 2 }),
            }}
          >
            {dn}
          </span>
        ) : null,
      )}

      {/* legend */}
      <div
        style={{
          position: "absolute",
          right: width - (gridLeft + gridW) + (pitch - size) / 2,
          top: gridTop + gridH + 32 * u,
          display: "flex",
          alignItems: "center",
          gap: 8 * u,
          fontSize: 18 * u,
          color: p.ink3,
          opacity: legendOn,
        }}
      >
        <span style={{ marginRight: 6 * u }}>Less</span>
        {STEPS.map((_, l) => (
          <span key={l} style={{ width: 24 * u, height: 24 * u, borderRadius: RADIUS.chip * u, background: stepColor(p.fill, p.accent, l) }} />
        ))}
        <span style={{ marginLeft: 6 * u }}>More</span>
      </div>
    </AbsoluteFill>
  );
};
