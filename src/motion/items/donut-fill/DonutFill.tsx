import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STROKE, progress, useLayout } from "../../kit";

export type DonutFillProps = {
  background: string;
  ink: string;
  ink2: string;
  ink3: string;
  line: string;
  fill: string;
  accent: string;
  title: string;
  labels: string;
  values: string;
  sweep: number; // % of the duration the full ring takes
  ease: string;
};

const DEFAULT_VALUES = [38, 24, 18, 12, 8];
const DEFAULT_LABELS = ["Direct", "Search", "Social", "Email", "Referral", "Other"];

export const parseValues = (s: string): { values: number[]; decimals: number } => {
  const tokens = String(s).split(",").map((x) => x.trim()).filter((x) => x !== "" && Number.isFinite(parseFloat(x)) && parseFloat(x) >= 0);
  if (tokens.length < 1 || tokens.every((x) => parseFloat(x) === 0)) return { values: DEFAULT_VALUES, decimals: 0 };
  const list = tokens.slice(0, 6);
  const decimals = Math.min(2, Math.max(...list.map((x) => (x.split(".")[1] ?? "").length)));
  return { values: list.map((x) => parseFloat(x)), decimals };
};

export const parseLabels = (s: string, n: number) => {
  const list = String(s).split(",").map((x) => x.trim());
  return Array.from({ length: n }, (_, i) => list[i] || DEFAULT_LABELS[i]);
};

// One accent segment (the first), then grey steps. Shared with the prompt.
export const segmentColors = (p: Pick<DonutFillProps, "accent" | "ink2" | "ink3" | "line" | "fill">) => [p.accent, p.ink2, p.ink3, p.line, p.fill, p.fill];

const fmt = (n: number, d = 0) => {
  const [int, frac] = Math.abs(n).toFixed(d).split(".");
  return (n < 0 ? "-" : "") + int.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (frac ? `.${frac}` : "");
};

// Angle 0 is 12 o'clock, increasing clockwise.
const polar = (cx: number, cy: number, r: number, a: number) => ({ x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) });

// A filled ring sector between radii r0 < r1. `gs`/`ge` are the gaps in px at the start/end, kept parallel by
// converting them to an angle per radius, so segments separate with straight, even gutters.
const sector = (cx: number, cy: number, r0: number, r1: number, a0: number, a1: number, gs: number, ge: number) => {
  const ob0 = a0 + gs / 2 / r1;
  const ob1 = a1 - ge / 2 / r1;
  const ib0 = a0 + gs / 2 / r0;
  const ib1 = a1 - ge / 2 / r0;
  if (ob1 - ob0 < 0.002 || ib1 - ib0 < 0.002) return null;
  const A = polar(cx, cy, r1, ob0);
  const B = polar(cx, cy, r1, ob1);
  const C = polar(cx, cy, r0, ib1);
  const D = polar(cx, cy, r0, ib0);
  return `M ${A.x} ${A.y} A ${r1} ${r1} 0 ${ob1 - ob0 > Math.PI ? 1 : 0} 1 ${B.x} ${B.y} L ${C.x} ${C.y} A ${r0} ${r0} 0 ${ib1 - ib0 > Math.PI ? 1 : 0} 0 ${D.x} ${D.y} Z`;
};

export const SWEEP_START = 14;
export const ROW_DUR = 20;

export const DonutFill: React.FC<DonutFillProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, u, ratio, durationInFrames } = useLayout();
  const { values, decimals } = parseValues(p.values);
  const n = values.length;
  const labels = parseLabels(p.labels, n);
  const colors = segmentColors(p);
  const total = values.reduce((a, b) => a + b, 0);
  const fracs = values.map((v) => v / total);
  const cums = fracs.map((_, i) => fracs.slice(0, i).reduce((a, b) => a + b, 0));

  const L =
    ratio === "16:9"
      ? { cx: 600, cy: 548, R: 300, tx: 1060, ty: 250, lx: 1060, ly: 392, lw: 700, rowH: 84, showValue: true }
      : ratio === "9:16"
        ? { cx: 540, cy: 760, R: 330, tx: 90, ty: 200, lx: 90, ly: 1200, lw: 900, rowH: 92, showValue: true }
        : { cx: 300, cy: 590, R: 214, tx: 80, ty: 96, lx: 590, ly: 400, lw: 410, rowH: 76, showValue: false };
  const cx = L.cx * u;
  const cy = L.cy * u;
  const R = L.R * u;
  const th = R * 0.16;
  const r0 = R - th;
  const gap = n > 1 ? 6 * u : 0;

  const a = SWEEP_START;
  const b = a + (p.sweep / 100) * durationInFrames;
  const s = Math.min(1, progress(frame, a, b, p.ease));
  const head = progress(frame, 0, 22, "enter");
  const ring = progress(frame, 2, 26, "enter");
  const mono: React.CSSProperties = { fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums" };
  const tiny: React.CSSProperties = { ...mono, letterSpacing: "0.12em", textTransform: "uppercase", color: p.ink3 };
  const TAU = Math.PI * 2;

  // The frame the sweep reaches each segment; its legend row enters from there over ROW_DUR frames.
  const reach = useMemo(
    () =>
      cums.map((c) => {
        for (let f = Math.floor(a); f <= Math.ceil(b); f++) if (progress(f, a, b, p.ease) >= c - 0.02) return f;
        return Math.ceil(b);
      }),
    // cums derives from p.values; a and b from p.sweep and the duration.
    [p.values, p.ease, a, b],
  );

  const track = sector(cx, cy, r0, R, Math.max(0, s * TAU), TAU - 0.0005, 0, 0);

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS, color: p.ink }}>
      <div style={{ position: "absolute", left: L.tx * u, top: L.ty * u, display: "flex", flexDirection: "column", gap: 14 * u, opacity: head, transform: `translateY(${(1 - head) * 24 * u}px)` }}>
        <span style={{ ...tiny, fontSize: 18 * u }}>
          {n} {n === 1 ? "segment" : "segments"}
        </span>
        <span style={{ fontSize: 44 * u, fontWeight: 500, letterSpacing: "-0.035em", lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", maxWidth: (ratio === "1:1" ? 900 : L.lw) * u }}>{p.title}</span>
      </div>

      <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }}>
        {track && <path d={track} fill={p.fill} opacity={ring} />}
        {values.map((_, i) => {
          const start = cums[i] * TAU;
          const end = (cums[i] + fracs[i]) * TAU;
          const drawn = Math.min(end, s * TAU, start + TAU - 0.0005);
          // The leading edge stays square while it sweeps; the gutter appears once the segment is complete.
          const d = sector(cx, cy, r0, R, start, drawn, gap, drawn >= end - 1e-6 ? gap : 0);
          return d ? <path key={i} d={d} fill={colors[i]} /> : null;
        })}
      </svg>

      <div
        style={{
          position: "absolute",
          left: cx - r0,
          top: cy - r0,
          width: r0 * 2,
          height: r0 * 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10 * u,
          opacity: ring,
        }}
      >
        <span style={{ ...tiny, fontSize: R * 0.06 }}>Total</span>
        <span style={{ fontSize: R * 0.27, fontWeight: 600, letterSpacing: "-0.045em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{fmt(total * s, decimals)}</span>
      </div>

      {values.map((v, i) => {
        const local = Math.min(1, Math.max(0, (s - cums[i]) / Math.max(fracs[i], 0.0001)));
        const f0 = reach[i];
        const appear = progress(frame, f0, f0 + ROW_DUR, "enter");
        const isHi = i === 0;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: L.lx * u,
              top: (L.ly + i * L.rowH) * u,
              width: L.lw * u,
              height: L.rowH * u,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              gap: 20 * u,
              borderBottom: `${STROKE.hair * u}px solid ${p.line}`,
              opacity: appear,
              transform: `translateX(${(1 - appear) * 28 * u}px)`,
            }}
          >
            <span style={{ width: 16 * u, height: 16 * u, borderRadius: RADIUS.chip * u, background: colors[i], flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: (ratio === "1:1" ? 26 : 28) * u, fontWeight: isHi ? 500 : 400, letterSpacing: "-0.015em", color: isHi ? p.ink : p.ink2, whiteSpace: "nowrap", overflow: "hidden" }}>{labels[i]}</span>
            {L.showValue && <span style={{ ...mono, fontSize: 20 * u, color: p.ink3 }}>{fmt(v * local, decimals)}</span>}
            <span style={{ ...mono, fontSize: 22 * u, fontWeight: 500, width: 88 * u, textAlign: "right", color: isHi ? p.ink : p.ink2 }}>{Math.round(fracs[i] * 100 * local)}%</span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
