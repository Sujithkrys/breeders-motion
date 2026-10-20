import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FINAL_HOLD, FONT_MONO, FONT_SANS, RADIUS, STAGGER, STROKE, alpha, mix, progress, useLayout } from "../../kit";

// Ported from the "I · integrations" and "scroll effect" shots of our Framer film (Tempo's Hub section): six tool
// tiles, hairline connectors that merge into a spine and draw into a "Today" card, rows filling as they land.

export type IntegrationsTimelineProps = {
  title: string;
  subline: string;
  heading: string;
  tiles: string; // six letters: first three on the left (top), last three on the right (bottom)
  time1: string;
  label1: string;
  time2: string;
  label2: string;
  time3: string;
  label3: string;
  time4: string;
  label4: string;
  background: string;
  card: string;
  line: string;
  fill: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  stagger: number; // frames between connector draws
  ease: string;
};

// ---------- timing (frames at 30fps) ----------
// Tiles drop in 3 frames apart; connectors then draw one by one, `stagger` frames apart; everything exits on the exit
// curve and the last FINAL_HOLD frames match frame 0.
export const TIMING = { first: 6, drop: 20, lineFirst: 30, draw: 22, fill: 18, ripple: 18, exit: 16 } as const;
// Which arrival (0-based, in draw order) fills each schedule row: lines 1, 3, 4 and 6.
export const ROW_AT = [0, 2, 3, 5] as const;
// The row that is "now": the only one tinted with the accent.
export const ACTIVE_ROW = 3;
export const ACTIVE_TINT = 0.12;
// Connector lines sit at this opacity of ink.
export const LINE_ALPHA = 0.24;
// Draw order alternates sides: L1, R1, L2, R2, L3, R3. Tile index (0–2 left, 3–5 right) → order.
export const orderOf = (i: number) => (i < 3 ? i * 2 : (i - 3) * 2 + 1);
export const timing = (stagger: number, durationInFrames: number) => {
  const tileAt = (k: number) => TIMING.first + k * STAGGER;
  const lineAt = (k: number) => TIMING.lineFirst + k * stagger;
  const arriveAt = (k: number) => lineAt(k) + TIMING.draw;
  const exitAt = durationInFrames - FINAL_HOLD - TIMING.exit;
  return { tileAt, lineAt, arriveAt, exitAt };
};

// Card internals at k = 1 (px at 1080 short side).
export const CARD = { w: 660, pad: 40, header: 44, headerGap: 30, row: 72, rowGap: 18, timeCol: 92, label: 28, time: 24 } as const;
const cardInnerH = () => CARD.pad * 2 + CARD.header + CARD.headerGap + CARD.row * 4 + CARD.rowGap * 3;

// ---------- layout ----------
type Pt = { x: number; y: number };
export type ITLayout = {
  u: number;
  vertical: boolean;
  k: number; // card scale
  cx: number;
  cy: number;
  cardW: number;
  cardH: number;
  tileSize: number;
  tiles: Pt[]; // centres, by tile index
  routes: Pt[][]; // sampled connector polylines, by tile index
  ports: Pt[]; // [left|top, right|bottom]
  titleTop: number;
  titleSize: number;
  subSize: number;
  subGap: number;
  spineGap: number;
  corner: number;
  tileGap: number;
  tileOffset: number;
};

const quad = (out: Pt[], P: (a: number, b: number) => Pt, s: [number, number], c: [number, number], e: [number, number]) => {
  const n = 14;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = (1 - t) * (1 - t) * s[0] + 2 * (1 - t) * t * c[0] + t * t * e[0];
    const b = (1 - t) * (1 - t) * s[1] + 2 * (1 - t) * t * c[1] + t * t * e[1];
    out.push(P(a, b));
  }
};

// A connector in (main, cross) axes: run along the main axis to the spine, turn, run across to the port's line, turn,
// and run into the port. Main axis is x for side tiles and y for the 9:16 top/bottom rows.
const route = (a0: number, b0: number, m: number, a1: number, b1: number, r: number, vertical: boolean): Pt[] => {
  const P = (a: number, b: number): Pt => (vertical ? { x: b, y: a } : { x: a, y: b });
  if (Math.abs(b1 - b0) < 0.5) return [P(a0, b0), P(a1, b1)];
  const da = Math.sign(a1 - a0);
  const db = Math.sign(b1 - b0);
  const rr = Math.min(r, Math.abs(b1 - b0) / 2, Math.abs(m - a0), Math.abs(a1 - m));
  const pts: Pt[] = [P(a0, b0)];
  quad(pts, P, [m - da * rr, b0], [m, b0], [m, b0 + db * rr]);
  quad(pts, P, [m, b1 - db * rr], [m, b1], [m + da * rr, b1]);
  pts.push(P(a1, b1));
  return pts;
};

export const layoutFor = (width: number, height: number): ITLayout => {
  const u = Math.min(width, height) / 1080;
  const vertical = height > width;
  const square = width === height;
  const cx = width / 2;

  const k = vertical ? 760 / CARD.w : square ? 560 / CARD.w : 1;
  const cardW = CARD.w * k * u;
  const cardH = cardInnerH() * k * u;
  const tileSize = (vertical ? 132 : square ? 104 : 128) * u;
  const titleSize = (vertical ? 64 : square ? 60 : 72) * u;
  const subSize = (vertical ? 26 : square ? 22 : 26) * u;
  const subGap = (square ? 14 : 16) * u;
  const titleBlock = titleSize * 1.05 + subGap + subSize * 1.35;
  const spineGap = (vertical ? 64 : square ? 40 : 70) * u;
  const corner = (square ? 20 : 28) * u;
  const tileGap = (vertical ? 230 : square ? 156 : 190) * u; // between tile centres in a column/row
  const tileOffset = vertical ? cardH / 2 + 200 * u : (square ? 434 : 700) * u; // card centre → tile column/row centre

  // Centre the whole group (title + card + tiles) vertically, nudged a touch above centre.
  const gap = (vertical ? 150 : square ? 120 : 130) * u;
  const groupH = vertical ? titleBlock + gap + (tileOffset + tileSize / 2) * 2 : titleBlock + gap + Math.max(cardH, tileGap * 2 + tileSize);
  const titleTop = ((height - groupH) / 2) * 0.9;
  const cy = vertical ? titleTop + titleBlock + gap + tileOffset + tileSize / 2 : titleTop + titleBlock + gap + Math.max(cardH, tileGap * 2 + tileSize) / 2;

  const tiles: Pt[] = [];
  const routes: Pt[][] = [];
  const ports: Pt[] = vertical
    ? [{ x: cx, y: cy - cardH / 2 }, { x: cx, y: cy + cardH / 2 }]
    : [{ x: cx - cardW / 2, y: cy }, { x: cx + cardW / 2, y: cy }];

  for (let i = 0; i < 6; i++) {
    const sgn = i < 3 ? -1 : 1;
    const j = i % 3;
    if (vertical) {
      const t = { x: cx + (j - 1) * tileGap, y: cy + sgn * tileOffset };
      tiles.push(t);
      routes.push(route(t.y - sgn * (tileSize / 2), t.x, cy + sgn * (cardH / 2 + spineGap), cy + sgn * (cardH / 2), cx, corner, true));
    } else {
      const t = { x: cx + sgn * tileOffset, y: cy + (j - 1) * tileGap };
      tiles.push(t);
      routes.push(route(t.x - sgn * (tileSize / 2), t.y, cx + sgn * (cardW / 2 + spineGap), cx + sgn * (cardW / 2), cy, corner, false));
    }
  }

  return { u, vertical, k, cx, cy, cardW, cardH, tileSize, tiles, routes, ports, titleTop, titleSize, subSize, subGap, spineGap, corner, tileGap, tileOffset };
};

// ---------- helpers ----------
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const hexRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  if (Number.isNaN(n)) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const isDark = (hex: string) => {
  const [r, g, b] = hexRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.45;
};
const mixHex = (a: string, b: string, t: number) => {
  const A = hexRgb(a);
  const B = hexRgb(b);
  return `#${A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
};
export const lettersOf = (s: string) => {
  const chars = Array.from(s.replace(/\s+/g, ""));
  return Array.from({ length: 6 }, (_, i) => chars[i] ?? "");
};

const measure = (pts: Pt[]) => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return cum;
};
const pointAt = (pts: Pt[], cum: number[], d: number): Pt => {
  if (d <= 0) return pts[0];
  for (let i = 1; i < pts.length; i++) {
    if (cum[i] >= d) {
      const t = (d - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
      return { x: mix(pts[i - 1].x, pts[i].x, t), y: mix(pts[i - 1].y, pts[i].y, t) };
    }
  }
  return pts[pts.length - 1];
};
const toD = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");

const ClockMark: React.FC<{ size: number; color: string; hand: string }> = ({ size, color, hand }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <circle cx={12} cy={12} r={10} fill={color} />
    <path d="M12 6.5V12l3.6 2.2" stroke={hand} strokeWidth={2.4} strokeLinecap="round" fill="none" />
  </svg>
);

// ---------- component ----------
export const IntegrationsTimeline: React.FC<IntegrationsTimelineProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useLayout();
  const L = React.useMemo(() => layoutFor(width, height), [width, height]);
  const geo = React.useMemo(() => L.routes.map((pts) => { const cum = measure(pts); return { pts, cum, len: cum[cum.length - 1], d: toD(pts) }; }), [L]);
  const { u, k } = L;

  const dark = isDark(p.background);
  const shadow = dark ? "none" : `0 ${u}px ${2 * u}px ${alpha(p.ink, 0.04)}, 0 ${8 * u}px ${24 * u}px ${alpha(p.ink, 0.06)}`;
  const lineColor = alpha(p.ink, LINE_ALPHA);
  const hair = STROKE.hair * u;
  const border = `${u}px solid ${p.line}`;

  const tm = timing(p.stagger, durationInFrames);
  const out = 1 - progress(frame, tm.exitAt, tm.exitAt + TIMING.exit, "exit");
  const arrived = [0, 1, 2, 3, 4, 5].filter((o) => frame >= tm.arriveAt(o)).length;
  const counterOn = progress(frame, tm.arriveAt(0) - 4, tm.arriveAt(0) + 14, "enter") * out;

  const letters = lettersOf(p.tiles);
  const rows: [string, string][] = [[p.time1, p.label1], [p.time2, p.label2], [p.time3, p.label3], [p.time4, p.label4]];

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS, overflow: "hidden" }}>
      {/* title */}
      <div style={{ position: "absolute", left: 80 * u, right: 80 * u, top: L.titleTop, textAlign: "center" }}>
        <div style={{ fontSize: L.titleSize, fontWeight: 400, letterSpacing: "-0.04em", lineHeight: 1.05, color: p.ink }}>{p.title}</div>
        <div style={{ fontSize: L.subSize, fontWeight: 400, letterSpacing: "-0.005em", lineHeight: 1.35, color: p.ink2, marginTop: L.subGap }}>{p.subline}</div>
      </div>

      {/* connectors, under the card */}
      <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }}>
        {geo.map((r, i) => {
          const o = orderOf(i);
          const lp = progress(frame, tm.lineAt(o), tm.lineAt(o) + TIMING.draw, "travel");
          if (lp <= 0) return null;
          return <path key={i} d={r.d} fill="none" stroke={lineColor} strokeWidth={hair} strokeLinejoin="round" strokeDasharray={`${r.len * lp} ${r.len + 2}`} opacity={out} />;
        })}
      </svg>

      {/* tiles */}
      {L.tiles.map((t, i) => {
        const o = orderOf(i);
        const d = progress(frame, tm.tileAt(o), tm.tileAt(o) + TIMING.drop, p.ease);
        const s = L.tileSize;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: t.x - s / 2,
              top: t.y - s / 2,
              width: s,
              height: s,
              borderRadius: RADIUS.card * u,
              background: p.card,
              border,
              boxSizing: "border-box",
              boxShadow: shadow,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: p.ink,
              fontSize: s * 0.4,
              fontWeight: 500,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              opacity: clamp01(d * 1.6) * out,
              transform: `translateY(${(-(1 - d) * 28 - (1 - out) * 10) * u}px) scale(${0.94 + 0.06 * d})`,
            }}
          >
            {letters[i]}
          </div>
        );
      })}

      {/* the Today card */}
      <div
        style={{
          position: "absolute",
          left: L.cx - L.cardW / 2,
          top: L.cy - L.cardH / 2,
          width: L.cardW,
          height: L.cardH,
          borderRadius: RADIUS.card * u,
          background: p.card,
          border,
          boxSizing: "border-box",
          boxShadow: shadow,
          padding: `${CARD.pad * k * u - u}px`,
          color: p.ink,
        }}
      >
        <div style={{ height: CARD.header * k * u, display: "flex", alignItems: "center", gap: 12 * k * u }}>
          <ClockMark size={30 * k * u} color={p.accent} hand={p.card} />
          <span style={{ fontSize: 30 * k * u, fontWeight: 500, letterSpacing: "-0.02em" }}>{p.heading}</span>
          <span style={{ marginLeft: "auto", fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums", fontSize: 20 * k * u, color: p.ink3, opacity: counterOn }}>{arrived}/6 synced</span>
        </div>
        <div style={{ marginTop: CARD.headerGap * k * u, display: "flex", flexDirection: "column", gap: CARD.rowGap * k * u }}>
          {rows.map(([time, label], r) => {
            const at = tm.arriveAt(ROW_AT[r]) + 2;
            const f = progress(frame, at, at + TIMING.fill, p.ease);
            const fc = clamp01(f);
            const active = r === ACTIVE_ROW;
            return (
              <div key={r} style={{ display: "flex", alignItems: "center", gap: 20 * k * u, height: CARD.row * k * u }}>
                <span style={{ width: CARD.timeCol * k * u, flexShrink: 0, textAlign: "right", fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums", fontSize: CARD.time * k * u, color: mixHex(p.ink3, p.ink2, fc * out) }}>{time}</span>
                <div style={{ position: "relative", flex: 1, height: "100%", boxSizing: "border-box", borderRadius: RADIUS.button * u, border, overflow: "hidden" }}>
                  <div style={{ position: "absolute", inset: 0, background: active ? alpha(p.accent, ACTIVE_TINT) : p.fill, clipPath: `inset(0 ${(1 - fc) * 100}% 0 0)`, opacity: out }} />
                  <span
                    style={{
                      position: "absolute",
                      left: 24 * k * u,
                      top: 0,
                      bottom: 0,
                      display: "flex",
                      alignItems: "center",
                      fontSize: CARD.label * k * u,
                      fontWeight: 500,
                      letterSpacing: "-0.01em",
                      color: p.ink,
                      whiteSpace: "nowrap",
                      opacity: clamp01((f - 0.25) / 0.75) * out,
                      transform: `translateX(${-(1 - f) * 10 * k * u}px)`,
                    }}
                  >
                    {label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* draw heads, ports and arrival ripples, above the card */}
      <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }}>
        {geo.map((r, i) => {
          const o = orderOf(i);
          const lp = progress(frame, tm.lineAt(o), tm.lineAt(o) + TIMING.draw, "travel");
          const headOp = clamp01(Math.min(lp, 1 - lp) * 10);
          const head = pointAt(r.pts, r.cum, r.len * lp);
          const port = L.ports[i < 3 ? 0 : 1];
          const rp = progress(frame, tm.arriveAt(o), tm.arriveAt(o) + TIMING.ripple, "enter");
          return (
            <g key={i}>
              {headOp > 0 ? <circle cx={head.x} cy={head.y} r={5 * u} fill={p.accent} opacity={headOp * out} /> : null}
              {rp > 0 && rp < 1 ? <circle cx={port.x} cy={port.y} r={mix(7, 26, rp) * u} fill="none" stroke={p.accent} strokeWidth={STROKE.ring * u} opacity={(1 - rp) * 0.6 * out} /> : null}
            </g>
          );
        })}
        {L.ports.map((pt, s) => {
          const lit = progress(frame, tm.arriveAt(s), tm.arriveAt(s) + 18, "enter") * out;
          return (
            <g key={s}>
              <circle cx={pt.x} cy={pt.y} r={6.5 * u} fill={p.card} stroke={alpha(p.ink, 0.3)} strokeWidth={hair} />
              <circle cx={pt.x} cy={pt.y} r={3.5 * u} fill={p.accent} opacity={lit} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
