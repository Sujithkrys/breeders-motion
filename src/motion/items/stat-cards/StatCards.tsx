import React, { useId } from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, alpha, progress, useLayout } from "../../kit";

export type StatCardsProps = {
  background: string;
  card: string;
  border: string;
  ink: string;
  muted: string;
  accent: string;
  pos: string;
  neg: string;
  title: string;
  labels: string;
  values: string;
  deltas: string;
  stagger: number; // frames between cards
  ease: string;
};

const DEFAULT_LABELS = ["Revenue", "Active users", "Retention"];
const DEFAULT_VALUES = ["$128.4k", "48210", "92.4%"];
const DEFAULT_DELTAS = [12, 8.5, -2.1];

type Stat = { prefix: string; n: number; d: number; suffix: string };

// "$128.4k" → prefix "$", 128.4, 1 decimal, suffix "k", so the count-up keeps the formatting.
export const parseStat = (raw: string): Stat => {
  const m = raw.trim().match(/^([^\d.-]*)(-?\d*\.?\d+)(.*)$/);
  if (!m) return { prefix: "", n: 0, d: 0, suffix: raw.trim() };
  return { prefix: m[1], n: parseFloat(m[2]), d: Math.min(2, (m[2].split(".")[1] ?? "").length), suffix: m[3] };
};

export const parseCards = (labels: string, values: string, deltas: string) => {
  const l = String(labels).split(",").map((x) => x.trim());
  const v = String(values).split(",").map((x) => x.trim());
  const d = String(deltas).split(",").map((x) => parseFloat(x.trim()));
  return [0, 1, 2].map((i) => ({
    label: l[i] || DEFAULT_LABELS[i],
    stat: parseStat(v[i] || DEFAULT_VALUES[i]),
    delta: Number.isFinite(d[i]) ? d[i] : DEFAULT_DELTAS[i],
  }));
};

const fmt = (n: number, d = 0) => {
  const [int, frac] = Math.abs(n).toFixed(d).split(".");
  return (n < 0 ? "-" : "") + int.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (frac ? `.${frac}` : "");
};

// A deterministic random walk that trends the same way as the card's delta.
const sparkPoints = (i: number, delta: number, w: number, h: number) => {
  const N = 14;
  const dir = delta >= 0 ? 1 : -1;
  const raw: number[] = [];
  let y = 0;
  for (let k = 0; k < N; k++) {
    y += dir * 0.55 + (random(`stat-spark-${i}-${k}`) - 0.5) * 1.9;
    raw.push(y);
  }
  const lo = Math.min(...raw);
  const hi = Math.max(...raw);
  return raw.map((v, k) => ({ x: (k / (N - 1)) * w, y: h - ((v - lo) / Math.max(1e-6, hi - lo)) * h }));
};

const Arrow: React.FC<{ up: boolean; size: number; color: string }> = ({ up, size, color }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" style={{ transform: up ? undefined : "rotate(180deg)" }}>
    <path d="M6 2.5 L10 8.5 L2 8.5 Z" fill={color} />
  </svg>
);

export const StatCards: React.FC<StatCardsProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, u, ratio, isVertical } = useLayout();
  const id = `stc${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const cards = parseCards(p.labels, p.values, p.deltas);
  const wide = ratio === "16:9";

  const pad = (wide ? 120 : isVertical ? 90 : 80) * u;
  const gap = (wide ? 36 : 28) * u;
  const headerH = (wide ? 120 : isVertical ? 140 : 100) * u;
  const headerGap = (wide ? 64 : 48) * u;
  const cardW = wide ? (width - pad * 2 - gap * 2) / 3 : width - pad * 2;
  const cardH = (wide ? 460 : isVertical ? 320 : 238) * u;
  const blockH = headerH + headerGap + (wide ? cardH : cardH * 3 + gap * 2);
  const top = (height - blockH) / 2;
  const cardTop = top + headerH + headerGap;
  const head = progress(frame, 0, 22, "smooth");
  const st = p.stagger;
  const mono: React.CSSProperties = { fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums" };

  const valueSize = (wide ? 84 : isVertical ? 88 : 64) * u;
  const cardPad = (wide ? 44 : isVertical ? 48 : 36) * u;
  const sparkW = wide ? cardW - cardPad * 2 : cardW * 0.4;
  const sparkH = (wide ? 120 : isVertical ? 150 : 110) * u;

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS, color: p.ink }}>
      <div style={{ position: "absolute", left: pad, right: pad, top, height: headerH, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 12 * u, opacity: head, transform: `translateY(${(1 - head) * 24 * u}px)` }}>
        <span style={{ ...mono, fontSize: 20 * u, letterSpacing: "0.14em", textTransform: "uppercase", color: p.muted }}>Key metrics</span>
        <span style={{ fontSize: (wide ? 64 : 56) * u, fontWeight: 650, letterSpacing: "-0.04em", lineHeight: 1.02, whiteSpace: "nowrap", overflow: "hidden" }}>{p.title}</span>
      </div>

      {cards.map((c, i) => {
        const s0 = 12 + i * st;
        const rise = progress(frame, s0, s0 + 26, p.ease);
        const count = progress(frame, s0 + 6, s0 + 50, "smooth");
        const chip = progress(frame, s0 + 34, s0 + 48, "smooth");
        const draw = progress(frame, s0 + 12, s0 + 58, "soft");
        const up = c.delta >= 0;
        const dc = up ? p.pos : p.neg;
        const x = wide ? pad + i * (cardW + gap) : pad;
        const y = wide ? cardTop : cardTop + i * (cardH + gap);

        const pts = sparkPoints(i, c.delta, sparkW, sparkH);
        const segLens = pts.slice(1).map((pt, k) => Math.hypot(pt.x - pts[k].x, pt.y - pts[k].y));
        const len = segLens.reduce((a, b) => a + b, 0);
        let rem = len * draw;
        let tip = pts[0];
        for (let k = 0; k < segLens.length; k++) {
          if (rem <= segLens[k]) {
            const f = segLens[k] > 0 ? rem / segLens[k] : 0;
            tip = { x: pts[k].x + (pts[k + 1].x - pts[k].x) * f, y: pts[k].y + (pts[k + 1].y - pts[k].y) * f };
            break;
          }
          rem -= segLens[k];
          tip = pts[k + 1];
        }
        const line = pts.map((pt, k) => `${k === 0 ? "M" : "L"} ${pt.x} ${pt.y}`).join(" ");

        const chipEl = (
          <span
            style={{
              ...mono,
              display: "flex",
              alignItems: "center",
              gap: 6 * u,
              fontSize: 22 * u,
              fontWeight: 600,
              color: dc,
              background: alpha(dc, 0.14),
              padding: `${7 * u}px ${14 * u}px ${7 * u}px ${10 * u}px`,
              borderRadius: 999,
              opacity: chip,
              transform: `scale(${0.85 + 0.15 * chip})`,
              transformOrigin: "left center",
              alignSelf: "flex-start",
            }}
          >
            <Arrow up={up} size={16 * u} color={dc} />
            {up ? "+" : "−"}
            {fmt(Math.abs(c.delta), Math.abs(c.delta) % 1 === 0 ? 0 : 1)}%
          </span>
        );

        const spark = (
          <svg width={sparkW} height={sparkH + 12 * u} viewBox={`0 ${-6 * u} ${sparkW} ${sparkH + 12 * u}`} style={{ overflow: "visible", flexShrink: 0 }}>
            <defs>
              <linearGradient id={`${id}-a${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={p.accent} stopOpacity={0.28} />
                <stop offset="1" stopColor={p.accent} stopOpacity={0} />
              </linearGradient>
              <clipPath id={`${id}-c${i}`}>
                <rect x={-10 * u} y={-20 * u} width={tip.x + 10 * u} height={sparkH + 40 * u} />
              </clipPath>
            </defs>
            <path d={`${line} L ${sparkW} ${sparkH} L 0 ${sparkH} Z`} fill={`url(#${id}-a${i})`} clipPath={`url(#${id}-c${i})`} opacity={draw} />
            <path d={line} fill="none" stroke={p.accent} strokeWidth={3.5 * u} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${len + 1} ${len + 1}`} strokeDashoffset={(len + 1) * (1 - draw)} />
            <circle cx={tip.x} cy={tip.y} r={6.5 * u} fill={p.accent} stroke={p.card} strokeWidth={3 * u} opacity={draw > 0 ? 1 : 0} />
          </svg>
        );

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: cardW,
              height: cardH,
              boxSizing: "border-box",
              padding: cardPad,
              borderRadius: 30 * u,
              background: p.card,
              border: `${1.5 * u}px solid ${p.border}`,
              boxShadow: `0 ${24 * u}px ${60 * u}px rgba(0,0,0,${0.22 * rise})`,
              opacity: Math.min(1, rise * 1.4),
              transform: `translateY(${(1 - rise) * 70 * u}px) scale(${0.96 + 0.04 * rise})`,
              display: "flex",
              flexDirection: wide ? "column" : "row",
              justifyContent: "space-between",
              alignItems: wide ? "stretch" : "center",
              gap: 24 * u,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: (wide ? 18 : 12) * u, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 * u }}>
                <span style={{ fontSize: 28 * u, fontWeight: 500, color: p.muted, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>{c.label}</span>
                {wide && chipEl}
              </div>
              <span style={{ fontSize: valueSize, fontWeight: 650, letterSpacing: "-0.045em", lineHeight: 1, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                {c.stat.prefix}
                {fmt(c.stat.n * count, c.stat.d)}
                {c.stat.suffix}
              </span>
              {!wide && chipEl}
            </div>
            {spark}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
