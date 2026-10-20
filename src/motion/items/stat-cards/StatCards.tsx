import React, { useId } from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STAGGER, STROKE, alpha, progress, useLayout } from "../../kit";

export type StatCardsProps = {
  background: string;
  card: string;
  line: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  success: string;
  error: string;
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

// Dark canvases get no surface shadow (the system's rule for Ink).
const isDark = (hex: string) => {
  const h = hex.replace("#", "");
  const v = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  if (!Number.isFinite(v)) return false;
  return 0.2126 * ((v >> 16) & 255) + 0.7152 * ((v >> 8) & 255) + 0.0722 * (v & 255) < 128;
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

// Per-card timing, shared with the prompt.
export const CARD_START = 12;
export const RISE = 24;

export const StatCards: React.FC<StatCardsProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, u, ratio, isVertical } = useLayout();
  const id = `stc${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const cards = parseCards(p.labels, p.values, p.deltas);
  const wide = ratio === "16:9";

  const pad = (wide ? 220 : isVertical ? 90 : 80) * u;
  const gap = (wide ? 32 : 28) * u;
  const headerH = (wide ? 110 : isVertical ? 140 : 100) * u;
  const headerGap = (wide ? 56 : 48) * u;
  const cardW = wide ? (width - pad * 2 - gap * 2) / 3 : width - pad * 2;
  const cardH = (wide ? 400 : isVertical ? 320 : 238) * u;
  const blockH = headerH + headerGap + (wide ? cardH : cardH * 3 + gap * 2);
  const top = (height - blockH) / 2;
  const cardTop = top + headerH + headerGap;
  const head = progress(frame, 0, 22, "enter");
  const st = Math.max(1, p.stagger || STAGGER);
  const mono: React.CSSProperties = { fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums" };
  const shadow = isDark(p.background) ? "none" : `0 ${1 * u}px ${2 * u}px ${alpha(p.ink, 0.04)}, 0 ${8 * u}px ${24 * u}px ${alpha(p.ink, 0.06)}`;

  const valueSize = (wide ? 76 : isVertical ? 80 : 60) * u;
  const cardPad = (wide ? 40 : isVertical ? 44 : 34) * u;
  const sparkW = wide ? cardW - cardPad * 2 : cardW * 0.4;
  const sparkH = (wide ? 112 : isVertical ? 140 : 104) * u;

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS, color: p.ink }}>
      <div style={{ position: "absolute", left: pad, right: pad, top, height: headerH, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 14 * u, opacity: head, transform: `translateY(${(1 - head) * 24 * u}px)` }}>
        <span style={{ ...mono, fontSize: 18 * u, letterSpacing: "0.12em", textTransform: "uppercase", color: p.ink3 }}>Key metrics</span>
        <span style={{ fontSize: 44 * u, fontWeight: 500, letterSpacing: "-0.035em", lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden" }}>{p.title}</span>
      </div>

      {cards.map((c, i) => {
        const s0 = CARD_START + i * st;
        const rise = progress(frame, s0, s0 + RISE, p.ease);
        const count = progress(frame, s0 + 6, s0 + 50, "enter");
        const chip = progress(frame, s0 + 30, s0 + 50, "enter");
        const draw = progress(frame, s0 + 12, s0 + 58, "travel");
        const up = c.delta >= 0;
        const dc = up ? p.success : p.error;
        // Grey sparklines; the accent is reserved for the hero (first) card.
        const sc = i === 0 ? p.accent : p.ink3;
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
        const path = pts.map((pt, k) => `${k === 0 ? "M" : "L"} ${pt.x} ${pt.y}`).join(" ");

        const chipEl = (
          <span
            style={{
              ...mono,
              display: "flex",
              alignItems: "center",
              gap: 6 * u,
              fontSize: 18 * u,
              fontWeight: 500,
              color: dc,
              background: alpha(dc, 0.12),
              padding: `${6 * u}px ${10 * u}px ${6 * u}px ${8 * u}px`,
              borderRadius: RADIUS.chip * u,
              opacity: chip,
              transform: `translateY(${(1 - chip) * 8 * u}px)`,
              alignSelf: "flex-start",
            }}
          >
            <Arrow up={up} size={14 * u} color={dc} />
            {up ? "+" : "−"}
            {fmt(Math.abs(c.delta), Math.abs(c.delta) % 1 === 0 ? 0 : 1)}%
          </span>
        );

        const spark = (
          <svg width={sparkW} height={sparkH + 12 * u} viewBox={`0 ${-6 * u} ${sparkW} ${sparkH + 12 * u}`} style={{ overflow: "visible", flexShrink: 0 }}>
            <defs>
              <clipPath id={`${id}-c${i}`}>
                <rect x={-10 * u} y={-20 * u} width={tip.x + 10 * u} height={sparkH + 40 * u} />
              </clipPath>
            </defs>
            <path d={`${path} L ${sparkW} ${sparkH} L 0 ${sparkH} Z`} fill={sc} fillOpacity={0.08} clipPath={`url(#${id}-c${i})`} opacity={draw} />
            <path
              d={path}
              fill="none"
              stroke={sc}
              strokeWidth={STROKE.ring * u}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={`${len + 1} ${len + 1}`}
              strokeDashoffset={(len + 1) * (1 - draw)}
            />
            <circle cx={tip.x} cy={tip.y} r={5 * u} fill={sc} stroke={p.card} strokeWidth={STROKE.ring * u} opacity={draw > 0 ? 1 : 0} />
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
              borderRadius: RADIUS.card * u,
              background: p.card,
              border: `${STROKE.hair * u}px solid ${p.line}`,
              boxShadow: shadow,
              opacity: Math.min(1, rise * 1.4),
              transform: `translateY(${(1 - rise) * 40 * u}px)`,
              display: "flex",
              flexDirection: wide ? "column" : "row",
              justifyContent: "space-between",
              alignItems: wide ? "stretch" : "center",
              gap: 24 * u,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: (wide ? 16 : 12) * u, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 * u }}>
                <span style={{ fontSize: 26 * u, fontWeight: 500, color: p.ink2, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>{c.label}</span>
                {wide && chipEl}
              </div>
              <span style={{ fontSize: valueSize, fontWeight: 500, letterSpacing: "-0.045em", lineHeight: 1, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
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
