import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, mix, progress, useLayout } from "../../kit";
import type { Ratio } from "../../types";

export type ContextWindowProps = {
  background: string;
  card: string;
  accent: string;
  model: string;
  total: number; // window size, in K tokens
  label1: string;
  label2: string;
  label3: string;
  label4: string;
  label5: string;
  value1: number; // K tokens
  value2: number;
  value3: number;
  value4: number;
  value5: number;
  saved: number; // K tokens freed by Compact (taken from row 4)
  ease: string;
};

export const SAVED_GREEN = "#14A34A";
export const SPARK = "#FF5A1F";
export const HOVER_ROW = 2; // the row the cursor inspects (Files)
export const COMPACT_ROW = 3; // the row that owns the Compact button (Conversation)

// ---------- colour ----------
const hexRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const mixHex = (a: string, b: string, t: number) => {
  const A = hexRgb(a);
  const B = hexRgb(b);
  return `#${A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
};
const isDarkHex = (hex: string) => {
  const [r, g, b] = hexRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.45;
};

// Every colour the card uses, derived from canvas, card and accent so each palette stays one coherent look.
export const themeFor = (background: string, card: string, accent: string) => {
  const dark = isDarkHex(card);
  const ink = dark ? "#F3F3F4" : "#111214";
  const sub = dark ? "#8A8D96" : "#7B7E87";
  return {
    dark,
    ink,
    sub,
    tray: dark ? mixHex(card, "#FFFFFF", 0.035) : mixHex(background, ink, 0.04),
    trayRing: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
    cardRing: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
    pill: mixHex(card, ink, dark ? 0.06 : 0.045),
    tagBg: mixHex(card, ink, dark ? 0.07 : 0.05),
    empty: mixHex(card, ink, dark ? 0.08 : 0.065),
    cats: [mixHex(card, ink, 0.94), mixHex(card, ink, 0.5), mixHex(card, ink, 0.3), accent, mixHex(card, accent, dark ? 0.5 : 0.4)],
    shadow: dark ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.06)",
    shadowNear: dark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.04)",
  };
};

// ---------- layout (numbers in px at 1080 on the short side; k scales the reference card) ----------
export const CFG: Record<Ratio, { k: number; w: number; rows: number; rowPitch: number }> = {
  "16:9": { k: 1.8, w: 1200, rows: 6, rowPitch: 40.5 },
  "1:1": { k: 1.72, w: 900, rows: 6, rowPitch: 40.5 },
  "9:16": { k: 2.0, w: 920, rows: 10, rowPitch: 46 },
};

export const geometry = (ratio: Ratio, u: number) => {
  const c = CFG[ratio];
  const k = c.k * u;
  const W = c.w * u;
  const inset = 4 * k;
  const pad = 18 * k;
  const x0 = inset + pad;
  const CW = W - 2 * x0;
  const titleTop = inset + 16 * k;
  const titleH = 22 * k;
  const numTop = titleTop + titleH + 13 * k;
  const numH = 36 * k;
  const gridTop = numTop + numH + 12 * k;
  const gap = 3.6 * k;
  const cols = Math.max(12, Math.round((CW + gap) / (12.2 * k)));
  const pitch = (CW + gap) / cols;
  const dot = pitch - gap;
  const gridH = c.rows * pitch - gap;
  const rowsTop = gridTop + gridH + 14 * k;
  const rowH = c.rowPitch * k;
  const cardBottom = rowsTop + 5 * rowH + 6 * k;
  const footerH = 52 * k;
  return { k, W, H: cardBottom + footerH, inset, x0, CW, titleTop, titleH, numTop, numH, gridTop, gap, cols, rows: c.rows, pitch, dot, gridH, rowsTop, rowH, cardBottom, footerH };
};

// ---------- timeline (frames at a 180-frame loop) ----------
export const T = {
  fillA: 4, fillB: 48,
  mv1A: 38, mv1B: 58,
  hovA: 54, hovB: 62, hovOutA: 84, hovOutB: 92,
  mv2A: 84, mv2B: 102,
  btnA: 98, btnB: 104, btnOutA: 134, btnOutB: 142,
  click1: 106,
  spinA: 107, spinB: 111,
  colA: 110, colB: 132,
  doneA: 130, doneB: 137,
  mv3A: 144, mv3B: 157,
  click2: 160,
  resetA: 161, resetB: 173,
  mv4A: 164, mv4B: 180,
} as const;
const RAMP = 5; // dots of soft lead at the fill front

// ---------- data ----------
export const normalise = (p: ContextWindowProps) => {
  const total = Math.max(10, Number(p.total) || 200);
  let vals = [p.value1, p.value2, p.value3, p.value4, p.value5].map((v) => Math.max(0, Number(v) || 0));
  const sum = vals.reduce((a, b) => a + b, 0);
  if (sum > total * 0.98) vals = vals.map((v) => (v * total * 0.98) / sum);
  const saved = Math.min(Math.max(0, Number(p.saved) || 0), vals[COMPACT_ROW] * 0.9);
  return { total, vals, saved, used: vals.reduce((a, b) => a + b, 0) };
};

export const fmt1 = (v: number) => (v < 0.05 ? "0" : `${v.toFixed(1)}K`);
export const fmtShort = (v: number) => (v < 0.05 ? "0" : `${Number(v.toFixed(1))}K`);
export const fmtPct = (x: number) => (x < 10 ? `${x.toFixed(1)}%` : `${Math.round(x)}%`);

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const r2 = (n: number) => Math.round(n * 100) / 100;

// One rounded square as a path segment, so a whole category is a single <path>.
const sq = (cx: number, cy: number, s: number, r: number) => {
  if (s <= 0.05) return "";
  const h = s / 2;
  const rr = r2(Math.min(r, h));
  const e = r2(s - 2 * rr);
  return `M${r2(cx - h + rr)} ${r2(cy - h)}h${e}a${rr} ${rr} 0 0 1 ${rr} ${rr}v${e}a${rr} ${rr} 0 0 1 ${-rr} ${rr}h${-e}a${rr} ${rr} 0 0 1 ${-rr} ${-rr}v${-e}a${rr} ${rr} 0 0 1 ${rr} ${-rr}z`;
};

// ---------- small pieces ----------
type Layer = { w: number; node: React.ReactNode };
// Stacks text states in one grid cell (keeps the baseline) and blur-crossfades between them.
const Swap: React.FC<{ layers: Layer[]; blur: number; align?: "start" | "end" }> = ({ layers, blur, align = "start" }) => (
  <span style={{ display: "inline-grid", alignItems: "baseline" }}>
    {layers.map((l, i) =>
      l.w > 0.01 ? (
        <span key={i} style={{ gridArea: "1 / 1", justifySelf: align, whiteSpace: "nowrap", opacity: l.w, filter: l.w < 0.99 ? `blur(${(1 - l.w) * blur}px)` : undefined }}>
          {l.node}
        </span>
      ) : null,
    )}
  </span>
);

const Icon: React.FC<{ size: number; color: string; d: string; sw?: number; style?: React.CSSProperties }> = ({ size, color, d, sw = 1.4, style }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d={d} />
  </svg>
);
const D_COMPACT = "M2 6h8M6 1.2v3M4.6 3.2 6 4.6l1.4-1.4M6 10.8v-3M4.6 8.8 6 7.4l1.4 1.4";
const D_CHECK = "M2.6 6.4 5 8.8l4.4-5.2";
const D_CHEVRON = "M3.5 4.75 6 7.25l2.5-2.5";
const D_ARROW = "M2 6h8M6.6 2.6 10 6 6.6 9.4";
const D_SPARK = "M6 1v10M1 6h10M2.46 2.46l7.08 7.08M9.54 2.46l-7.08 7.08";

type Pt = [number, number];
const glide = (a: Pt, b: Pt, t: number): Pt => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const bow = Math.sin(Math.PI * clamp01(t)) * 0.07;
  return [a[0] + dx * t - dy * bow, a[1] + dy * t + dx * bow];
};

// ---------- component ----------
export const ContextWindow: React.FC<ContextWindowProps> = (p) => {
  const frame = useCurrentFrame();
  const { durationInFrames, u, ratio } = useLayout();
  const g = geometry(ratio, u);
  const { k } = g;
  const th = themeFor(p.background, p.card, p.accent);
  const { total, vals, saved } = normalise(p);
  const labels = [p.label1, p.label2, p.label3, p.label4, p.label5];

  const s = durationInFrames / 180;
  const at = (f: number) => f * s;
  const seg = (a: number, b: number) => progress(frame, at(a), at(b), p.ease);
  const bump = (c: number) => interpolate(frame, [at(c) - 3, at(c), at(c) + 4], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // dot budget
  const N = g.cols * g.rows;
  const counts = vals.map((v) => (v > 0 ? Math.max(1, Math.round((v / total) * N)) : 0));
  while (counts.reduce((a, b) => a + b, 0) > N) counts[counts.indexOf(Math.max(...counts))] -= 1;
  const convAfter = vals[COMPACT_ROW] > 0 ? Math.max(1, Math.round(((vals[COMPACT_ROW] - saved) / total) * N)) : 0;
  const usedBefore = counts.reduce((a, b) => a + b, 0);
  const usedAfter = usedBefore - counts[COMPACT_ROW] + convAfter;

  // state
  const collapse = Math.min(1, seg(T.colA, T.colB));
  const F = frame < at(T.resetA) ? Math.min(1, seg(T.fillA, T.fillB)) * (usedBefore + RAMP) : (1 - Math.min(1, seg(T.resetA, T.resetB))) * (usedAfter + RAMP);
  const h = Math.max(0, seg(T.hovA, T.hovB) - seg(T.hovOutA, T.hovOutB));
  const btnHover = Math.max(0, seg(T.btnA, T.btnB) - seg(T.btnOutA, T.btnOutB));
  const wSpin = clamp01(seg(T.spinA, T.spinB) - seg(T.doneA, T.doneB));
  const wDone = clamp01(seg(T.doneA, T.doneB) - seg(T.resetA, T.resetA + 8));
  const press1 = bump(T.click1);
  const press2 = bump(T.click2);

  // dots → one path per category
  const cx = (i: number) => (i % g.cols) * g.pitch + g.dot / 2;
  const cy = (i: number) => Math.floor(i / g.cols) * g.pitch + g.dot / 2;
  const dotR = g.dot * 0.26;
  const emptyPath = useMemo(() => {
    let d = "";
    for (let i = 0; i < N; i++) d += sq((i % g.cols) * g.pitch + g.dot / 2, Math.floor(i / g.cols) * g.pitch + g.dot / 2, g.dot, g.dot * 0.26);
    return d;
  }, [N, g.cols, g.pitch, g.dot]);

  const paths = ["", "", "", "", ""];
  const tokens = [0, 0, 0, 0, 0];
  let idx = 0;
  for (let j = 0; j < 5; j++) {
    const len = j === COMPACT_ROW ? mix(counts[j], convAfter, collapse) : counts[j];
    const value = j === COMPACT_ROW ? mix(vals[j], vals[j] - saved, collapse) : vals[j];
    tokens[j] = value * clamp01((F - idx) / Math.max(len, 0.5));
    const whole = Math.ceil(len - 1e-4);
    for (let q = 0; q < whole; q++) {
      const i = idx + q;
      if (i >= N) break;
      const part = q === whole - 1 ? Math.min(1, len - q) : 1;
      const grow = clamp01((F - i) / RAMP);
      const sc = part * (1 - Math.pow(1 - grow, 3));
      paths[j] += sq(cx(i), cy(i), g.dot * sc, dotR * sc);
    }
    idx += whole;
  }
  const used = tokens.reduce((a, b) => a + b, 0);
  const shown = mix(used, tokens[HOVER_ROW], h);

  // positions (tray coordinates)
  const valueW = 66 * k;
  const btnRight = g.x0 + g.CW - valueW - 8 * k;
  const P0: Pt = [g.W - 34 * k, g.H + 26 * k];
  const Pfiles: Pt = [g.x0 + 62 * k, g.rowsTop + (HOVER_ROW + 0.5) * g.rowH + 2 * k];
  const Pcomp: Pt = [btnRight - 40 * k, g.rowsTop + (COMPACT_ROW + 0.5) * g.rowH + 2 * k];
  const Pnew: Pt = [g.W - 58 * k, g.cardBottom + g.footerH / 2 + 2 * k];
  let cur: Pt = P0;
  if (frame >= at(T.mv4A)) cur = glide(Pnew, P0, seg(T.mv4A, T.mv4B));
  else if (frame >= at(T.mv3A)) cur = glide(Pcomp, Pnew, seg(T.mv3A, T.mv3B));
  else if (frame >= at(T.mv2A)) cur = glide(Pfiles, Pcomp, seg(T.mv2A, T.mv2B));
  else if (frame >= at(T.mv1A)) cur = glide(P0, Pfiles, seg(T.mv1A, T.mv1B));

  const hair = Math.max(1, u);
  const blur = 5 * k;
  const tnum: React.CSSProperties = { fontVariantNumeric: "tabular-nums" };
  const abs = (left: number, top: number, width: number, height: number): React.CSSProperties => ({ position: "absolute", left, top, width, height });

  // footer states
  const wHover = h;
  const wLeft = clamp01(1 - wHover - wSpin - wDone);

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div
        style={{
          position: "relative",
          width: g.W,
          height: g.H,
          borderRadius: 17 * k,
          background: th.tray,
          boxShadow: `0 0 0 ${hair}px ${th.trayRing}, 0 ${k}px ${2 * k}px ${th.shadowNear}, 0 ${8 * k}px ${24 * k}px ${th.shadow}`,
          color: th.ink,
        }}
      >
        {/* inner card */}
        <div
          style={{
            ...abs(g.inset, g.inset, g.W - 2 * g.inset, g.cardBottom - g.inset),
            borderRadius: 13 * k,
            background: p.card,
            boxShadow: `0 0 0 ${hair}px ${th.cardRing}, 0 ${k}px ${2.5 * k}px ${th.shadowNear}`,
          }}
        />

        {/* header */}
        <div style={{ ...abs(g.x0, g.titleTop, g.CW, g.titleH), display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 16.5 * k, fontWeight: 500, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>Context window</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 * k, height: 23 * k, padding: `0 ${8 * k}px`, borderRadius: 6 * k, background: th.tagBg, fontFamily: FONT_MONO, fontSize: 12.5 * k, color: th.sub, whiteSpace: "nowrap" }}>
            <Icon size={11 * k} color={SPARK} d={D_SPARK} sw={1.5} />
            {p.model}
          </span>
        </div>

        {/* big number */}
        <div style={{ ...abs(g.x0, g.numTop, g.CW, g.numH), display: "flex", alignItems: "baseline", whiteSpace: "nowrap" }}>
          <span style={{ ...tnum, fontSize: 34 * k, lineHeight: 1, fontWeight: 600, letterSpacing: "-0.035em" }}>{fmt1(shown)}</span>
          <span style={{ marginLeft: 8 * k, fontSize: 15 * k, color: th.sub }}>
            <Swap blur={blur} layers={[{ w: 1 - h, node: `of ${fmtShort(total)} tokens` }, { w: h, node: labels[HOVER_ROW] }]} />
          </span>
          <span style={{ ...tnum, marginLeft: "auto", fontSize: 15 * k, color: th.sub }}>{Math.round((used / total) * 100)}%</span>
        </div>

        {/* dot grid */}
        <svg width={g.CW} height={g.gridH} style={{ position: "absolute", left: g.x0, top: g.gridTop, overflow: "visible" }}>
          <path d={emptyPath} fill={th.empty} />
          {paths.map((d, j) => (d ? <path key={j} d={d} fill={th.cats[j]} opacity={j === HOVER_ROW ? 1 : mix(1, 0.16, h)} /> : null))}
        </svg>

        {/* rows */}
        <div style={{ ...abs(g.x0 - 8 * k, g.rowsTop + HOVER_ROW * g.rowH + 3 * k, g.CW + 16 * k, g.rowH - 6 * k), borderRadius: 8 * k, background: th.pill, opacity: h }} />
        <div style={{ ...abs(g.x0 - 8 * k, g.rowsTop + COMPACT_ROW * g.rowH + 3 * k, g.CW + 16 * k, g.rowH - 6 * k), borderRadius: 8 * k, background: th.pill, opacity: btnHover * 0.7 }} />
        {labels.map((label, r) => {
          const active = r === HOVER_ROW;
          const textCol = active ? th.ink : mixHex(th.ink, th.sub, h);
          return (
            <div key={r} style={{ ...abs(g.x0, g.rowsTop + r * g.rowH, g.CW, g.rowH), display: "flex", alignItems: "center", fontSize: 15.5 * k, color: textCol, whiteSpace: "nowrap" }}>
              <span style={{ width: 8.5 * k, height: 8.5 * k, borderRadius: 2.2 * k, background: th.cats[r], opacity: active ? 1 : mix(1, 0.3, h), marginRight: 9 * k, flexShrink: 0 }} />
              <span>{label}</span>
              {r === HOVER_ROW ? <Icon size={12 * k} color={th.sub} d={D_CHEVRON} sw={1.3} style={{ marginLeft: 4 * k }} /> : null}
              <span style={{ flex: 1 }} />
              {r === COMPACT_ROW ? (
                <span style={{ position: "relative", display: "flex", alignItems: "center", height: 25 * k, padding: `0 ${7 * k}px`, marginRight: 8 * k, fontSize: 13.5 * k, color: th.sub, transform: `scale(${1 - 0.05 * press1})` }}>
                  <span style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, borderRadius: 6 * k, background: mixHex(p.card, th.ink, th.dark ? 0.1 : 0.075), opacity: btnHover }} />
                  <span style={{ position: "relative" }}>
                    <Swap
                      align="end"
                      blur={blur * 0.6}
                      layers={[
                        { w: clamp01(1 - wSpin - wDone), node: <span style={{ display: "flex", alignItems: "center", gap: 5 * k, color: mixHex(th.sub, th.ink, btnHover * 0.8) }}><Icon size={11 * k} color="currentColor" d={D_COMPACT} sw={1.3} />Compact</span> },
                        {
                          w: wSpin,
                          node: (
                            <span style={{ display: "flex", alignItems: "center", gap: 5 * k, color: th.ink }}>
                              <svg width={11 * k} height={11 * k} viewBox="0 0 12 12" style={{ transform: `rotate(${frame * 14}deg)` }}>
                                <circle cx={6} cy={6} r={4.6} fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeDasharray="20 9" />
                              </svg>
                              Compact
                            </span>
                          ),
                        },
                        { w: wDone, node: <span style={{ display: "flex", alignItems: "center", gap: 5 * k, color: SAVED_GREEN }}><Icon size={11 * k} color="currentColor" d={D_CHECK} sw={1.5} />Compacted</span> },
                      ]}
                    />
                  </span>
                </span>
              ) : null}
              <span style={{ ...tnum, width: valueW, textAlign: "right", color: active ? th.ink : mixHex(th.ink, th.sub, h) }}>{fmt1(tokens[r])}</span>
            </div>
          );
        })}

        {/* footer */}
        <div style={{ ...abs(18 * k, g.cardBottom, g.W - 36 * k, g.footerH), display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14.5 * k, whiteSpace: "nowrap" }}>
          <Swap
            blur={blur}
            layers={[
              { w: wLeft, node: <span style={{ color: th.sub }}>{fmtShort(total - used)} left</span> },
              { w: wHover, node: <span><span style={{ color: th.ink, fontWeight: 500 }}>{labels[HOVER_ROW]}</span><span style={{ color: th.sub }}> · {fmtPct((vals[HOVER_ROW] / total) * 100)} of the window</span></span> },
              { w: wSpin, node: <span style={{ color: th.sub }}>Compacting…</span> },
              { w: wDone, node: <span style={{ color: SAVED_GREEN }}>Saved {fmtShort(saved)} tokens</span> },
            ]}
          />
          <span style={{ display: "flex", alignItems: "center", gap: 5 * k, fontWeight: 500, color: th.ink, opacity: 1 - 0.35 * press2 }}>
            New chat
            <Icon size={12 * k} color={th.ink} d={D_ARROW} sw={1.4} />
          </span>
        </div>

        {/* cursor */}
        <svg
          width={15 * k}
          height={20.6 * k}
          viewBox="0 0 16 22"
          style={{ position: "absolute", left: cur[0] - 0.95 * k, top: cur[1] - 0.95 * k, overflow: "visible", transformOrigin: "0 0", transform: `scale(${1 - 0.12 * Math.max(press1, press2)})` }}
        >
          <path d="M1 1V17.4L5.1 13.6 7.9 20.2 10.7 19 7.9 12.5H13.6Z" fill={th.dark ? "#FFFFFF" : "#111214"} stroke={th.dark ? "#111214" : "#FFFFFF"} strokeWidth={1.3} strokeLinejoin="round" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
