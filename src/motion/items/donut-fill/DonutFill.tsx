import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, alpha, easing, progress, useLayout } from "../../kit";

export type DonutFillProps = {
  background: string;
  ink: string;
  muted: string;
  grid: string;
  seg1: string;
  seg2: string;
  seg3: string;
  seg4: string;
  seg5: string;
  seg6: string;
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

const fmt = (n: number, d = 0) => {
  const [int, frac] = Math.abs(n).toFixed(d).split(".");
  return (n < 0 ? "-" : "") + int.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (frac ? `.${frac}` : "");
};

// Angle 0 is 12 o'clock, increasing clockwise.
const polar = (cx: number, cy: number, r: number, a: number) => ({ x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) });
const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const p0 = polar(cx, cy, r, a0);
  const p1 = polar(cx, cy, r, a1);
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p1.x} ${p1.y}`;
};

export const DonutFill: React.FC<DonutFillProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, u, ratio, durationInFrames } = useLayout();
  const { values, decimals } = parseValues(p.values);
  const n = values.length;
  const labels = parseLabels(p.labels, n);
  const colors = [p.seg1, p.seg2, p.seg3, p.seg4, p.seg5, p.seg6];
  const total = values.reduce((a, b) => a + b, 0);
  const fracs = values.map((v) => v / total);
  const cums = fracs.map((_, i) => fracs.slice(0, i).reduce((a, b) => a + b, 0));

  const L =
    ratio === "16:9"
      ? { cx: 600, cy: 548, R: 300, th: 68, tx: 1060, ty: 210, ts: 64, lx: 1060, ly: 392, lw: 700, rowH: 86, showValue: true }
      : ratio === "9:16"
        ? { cx: 540, cy: 760, R: 330, th: 72, tx: 90, ty: 170, ts: 64, lx: 90, ly: 1200, lw: 900, rowH: 96, showValue: true }
        : { cx: 300, cy: 590, R: 214, th: 52, tx: 80, ty: 84, ts: 56, lx: 590, ly: 400, lw: 410, rowH: 76, showValue: false };
  const cx = L.cx * u;
  const cy = L.cy * u;
  const R = L.R * u;
  const th = L.th * u;
  const rr = R - th / 2;
  const gap = n > 1 ? (6 * u) / rr : 0;

  const a = 14;
  const b = a + (p.sweep / 100) * durationInFrames;
  const s = Math.min(1, progress(frame, a, b, p.ease));
  const head = progress(frame, 0, 22, "enter");
  const ring = progress(frame, 2, 26, "enter");
  const rowEase = easing("enter");
  const mono: React.CSSProperties = { fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums" };
  const TAU = Math.PI * 2;

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS, color: p.ink }}>
      <div style={{ position: "absolute", left: L.tx * u, top: L.ty * u, display: "flex", flexDirection: "column", gap: 14 * u, opacity: head, transform: `translateY(${(1 - head) * 24 * u}px)` }}>
        <span style={{ ...mono, fontSize: 20 * u, letterSpacing: "0.14em", textTransform: "uppercase", color: p.muted }}>
          {n} {n === 1 ? "segment" : "segments"}
        </span>
        <span style={{ fontSize: L.ts * u, fontWeight: 650, letterSpacing: "-0.04em", lineHeight: 1.02, maxWidth: (ratio === "1:1" ? 900 : L.lw) * u }}>{p.title}</span>
      </div>

      <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }}>
        <circle cx={cx} cy={cy} r={rr} fill="none" stroke={p.grid} strokeWidth={th} opacity={ring} />
        {values.map((_, i) => {
          const start = cums[i] * TAU + gap / 2;
          const end = (cums[i] + fracs[i]) * TAU - gap / 2;
          const drawn = Math.min(end, s * TAU);
          if (drawn - start < 0.002) return null;
          return <path key={i} d={arc(cx, cy, rr, start, Math.min(drawn, start + TAU - 0.0005))} fill="none" stroke={colors[i]} strokeWidth={th} />;
        })}
      </svg>

      <div
        style={{
          position: "absolute",
          left: cx - rr,
          top: cy - rr,
          width: rr * 2,
          height: rr * 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8 * u,
          opacity: ring,
        }}
      >
        <span style={{ ...mono, fontSize: R * 0.068, letterSpacing: "0.14em", textTransform: "uppercase", color: p.muted }}>Total</span>
        <span style={{ fontSize: R * 0.27, fontWeight: 650, letterSpacing: "-0.045em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{fmt(total * s, decimals)}</span>
      </div>

      {values.map((v, i) => {
        const local = Math.min(1, Math.max(0, (s - cums[i]) / Math.max(fracs[i], 0.0001)));
        const appear = rowEase(Math.min(1, Math.max(0, (s - cums[i] + 0.02) / 0.12)));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: L.lx * u,
              top: (L.ly + i * L.rowH) * u,
              width: L.lw * u,
              height: L.rowH * u,
              display: "flex",
              alignItems: "center",
              gap: 20 * u,
              borderBottom: `${1.5 * u}px solid ${p.grid}`,
              opacity: appear,
              transform: `translateX(${(1 - appear) * 28 * u}px)`,
            }}
          >
            <span style={{ width: 22 * u, height: 22 * u, borderRadius: 7 * u, background: colors[i], boxShadow: `0 0 ${18 * u}px ${alpha(colors[i], 0.45)}`, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: (ratio === "1:1" ? 26 : 30) * u, fontWeight: 500, letterSpacing: "-0.02em", whiteSpace: "nowrap", overflow: "hidden" }}>{labels[i]}</span>
            {L.showValue && <span style={{ ...mono, fontSize: 24 * u, color: p.muted }}>{fmt(v * local, decimals)}</span>}
            <span style={{ ...mono, fontSize: (ratio === "1:1" ? 24 : 28) * u, fontWeight: 600, width: 96 * u, textAlign: "right" }}>{Math.round(fracs[i] * 100 * local)}%</span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
