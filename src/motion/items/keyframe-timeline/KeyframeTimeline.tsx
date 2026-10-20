// Keyframe Timeline: ported from the "Set keyframes" and "Scrub" shots of our Figma Motion film. A flat colour block,
// a large Figma-style Motion timeline and a linked record card. A name-tag cursor drops keyframes row by row (each
// layer in the card jumps to its start state as its key lands), then presses play: the playhead sweeps and the card
// animates in sync, the vinyl sliding out of its sleeve and spinning. Keys clear and the loop starts again.
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, alpha, easing, progress, useLayout } from "../../kit";
import { RecordCard, type CardVariant } from "./RecordCard";

export type KeyframeTimelineProps = {
  background: string;
  titleColor: string;
  accent: string;
  title: string;
  layers: string; // comma list, five names
  cursorName: string;
  stagger: number; // seconds between keyframe clicks
  turns: number; // vinyl spins
  ease: string;
};

// The animation the timeline holds: row r starts at START[r] s and lasts LEN[r] s (same as the film).
export const START = [0, 0.1, 0.35, 0.55, 0.75];
export const LEN = [0.45, 0.5, 0.75, 0.6, 0.4];
export const DUR = 1.6;
const DEFAULT_LAYERS = ["Header", "Sleeve", "Vinyl", "Tracks", "Play"];
export const parseLayers = (s: string): string[] => {
  const xs = s.split(",").map((x) => x.trim()).filter(Boolean);
  return DEFAULT_LAYERS.map((d, i) => xs[i] ?? d);
};

const INK = "#0E0F12";
const INK2 = "#3B3D44";
const SUB = "#7B7E87";
const FAINT = "#A3A5AD";
const LINE = "#E8E8EC";
const ROWLINE = "#F2F2EF";
const PLAYHEAD = "#FF5A1F";

// ---------- timing (frames) ----------
export const schedule = (stagger: number, fps: number, total: number) => {
  const gap = Math.max(6, stagger * fps);
  const clicks = START.map((_, r) => Math.round(18 + r * gap));
  const play = clicks[4] + 26;
  const sweep0 = play + 2;
  const sweep1 = sweep0 + DUR * fps; // real time
  const reset0 = total - 30;
  return { clicks, play, sweep0, sweep1, reset0, grow: 11 };
};

// ---------- layout, in design px (1px at 1080 on the short side) ----------
type Geo = {
  title: { x: number; y: number; size: number };
  tl: { x: number; y: number; w: number; h: number; head: number; ruler: number; labelW: number };
  card: { x: number; y: number; scale: number; variant: CardVariant };
};
export const layoutFor = (width: number, height: number): Geo => {
  const u = Math.min(width, height) / 1080;
  const dw = width / u;
  const dh = height / u;
  if (dh > dw) {
    // 9:16: timeline on top, the record card stacked underneath
    const scale = 1.2;
    return {
      title: { x: 64, y: 120, size: 92 },
      tl: { x: 64, y: 290, w: dw - 128, h: 600, head: 68, ruler: 44, labelW: 196 },
      card: { x: (dw - 456 * scale) / 2, y: 290 + 600 + 136, scale, variant: "tall" },
    };
  }
  if (dw === dh) {
    // 1:1: a wide record card under the title, the timeline below
    return {
      title: { x: 64, y: 56, size: 76 },
      tl: { x: 64, y: 506, w: dw - 128, h: dh - 56 - 506, head: 62, ruler: 40, labelW: 180 },
      card: { x: 64, y: 204, scale: 1, variant: "wide" },
    };
  }
  // 16:9: timeline left under the title, the record card on the right
  const cardX = dw - 96 - 456;
  return {
    title: { x: 96, y: 80, size: 92 },
    tl: { x: 96, y: 330, w: cardX - 56 - 96, h: 600, head: 68, ruler: 44, labelW: 210 },
    card: { x: cardX, y: 330, scale: 1, variant: "tall" },
  };
};
// track geometry inside the panel (design px)
export const trackOf = (tl: Geo["tl"]) => {
  const x0 = tl.labelW + 28;
  const px = (tl.w - x0 - 64) / DUR;
  const rowH = (tl.h - tl.head - tl.ruler - 8) / 5;
  return { x0, px, rowH };
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const bump = (f: number, at: number, half: number) => Math.max(0, 1 - Math.abs(f - at) / half);

// tiny Figma layer icons: text, rectangle, ellipse, list, play
const ICONS = ["M3.5 3.5h9M8 3.5v9", "M3 3h10v10H3z", "M8 2.5a5.5 5.5 0 1 1 0 11a5.5 5.5 0 1 1 0-11z", "M3 4.5h10M3 8h10M3 11.5h10", "M5 3.5v9l7-4.5z"];

export const KeyframeTimeline: React.FC<KeyframeTimelineProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames, fps, u } = useLayout();
  const g = layoutFor(width, height);
  const { x0, px, rowH } = trackOf(g.tl);
  const S = schedule(p.stagger, fps, durationInFrames);
  const names = parseLayers(p.layers);
  const ez = easing(p.ease);
  const f = frame;

  // playhead: sweeps in real time after play, holds at the end, returns to 0 while the keys clear
  const sweepSec = interpolate(f, [S.sweep0, S.sweep1], [0, DUR], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const playhead = f < S.reset0 ? sweepSec : DUR * (1 - progress(f, S.reset0, S.reset0 + 18, p.ease));
  const playing = f >= S.play && f < S.sweep1;

  // per row: start key, bar, end key, the clearing at the end, and the layer value shown in the card
  const rows = START.map((st, r) => {
    const c = S.clicks[r];
    const out = progress(f, S.reset0 + r * 2, S.reset0 + r * 2 + 8, "enter");
    const inA = progress(f, c, c + 9, "spring");
    const inB = progress(f, c + S.grow, c + S.grow + 9, "spring");
    const bar = progress(f, c + 1, c + S.grow, p.ease) * (1 - out);
    const fromK = progress(f, c, c + 10, p.ease); // the layer jumps to its start state as its key lands
    const playK = ez(clamp01((sweepSec - st) / LEN[r]));
    return {
      a: { s: inA * (1 - 0.6 * out), o: clamp01((f - c) / 3) * (1 - out) },
      b: { s: inB * (1 - 0.6 * out), o: clamp01((f - c - S.grow) / 3) * (1 - out) },
      bar,
      sel: f >= c && f < (r < 4 ? S.clicks[r + 1] : S.play),
      hi: bump(f, c, 8),
      v: 1 - fromK * (1 - playK),
    };
  });
  const keyCount = rows.reduce((n, r) => n + (r.a.o > 0.5 ? 1 : 0) + (r.b.o > 0.5 ? 1 : 0), 0);

  // the vinyl spins from the moment its row starts playing and eases to a stop on a whole turn
  const vs = S.sweep0 + START[2] * fps;
  const rot = Math.round(p.turns) * 360 * Easing.out(Easing.cubic)(clamp01((f - vs) / (S.reset0 + 16 - vs)));

  // the cursor: rest → each row's start key → the play icon → rest
  const rowY = (r: number) => g.tl.head + g.tl.ruler + (r + 0.5) * rowH;
  const R: [number, number] = [x0 + 1.3 * px, g.tl.head + g.tl.ruler + 3.6 * rowH];
  const P: [number, number] = [24 + 18, g.tl.head / 2];
  const K = START.map((st, r): [number, number] => [x0 + st * px, rowY(r)]);
  const pts: [number, [number, number]][] = [[0, R]];
  S.clicks.forEach((c, r) => {
    pts.push([c - 3, K[r]], [c + 2, K[r]]);
  });
  pts.push([S.play - 3, P], [S.play + 3, P], [S.play + 26, R], [durationInFrames, R]);
  const soft = easing("travel");
  const cur = (i: 0 | 1) => interpolate(f, pts.map((q) => q[0]), pts.map((q) => q[1][i]), { easing: soft, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const press = Math.min(1, S.clicks.reduce((m, c) => Math.max(m, bump(f, c, 3.5)), bump(f, S.play, 3.5)));
  const playPress = bump(f, S.play, 4);

  const tl = g.tl;
  const T = (n: number) => n * u;
  const easeLabel = p.ease ? p.ease[0].toUpperCase() + p.ease.slice(1) : "Smooth";
  const hair = `${Math.max(1, u)}px solid ${LINE}`;

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS, overflow: "hidden" }}>
      {/* block title, top-left, as on the film's colour cards */}
      <div style={{ position: "absolute", left: T(g.title.x), top: T(g.title.y), fontSize: T(g.title.size), fontWeight: 400, letterSpacing: "-0.04em", lineHeight: 1, color: p.titleColor, whiteSpace: "nowrap" }}>{p.title}</div>

      {/* the linked preview */}
      <RecordCard x={T(g.card.x)} y={T(g.card.y)} s={u * g.card.scale} variant={g.card.variant} accent={p.accent} labelColor={p.titleColor} badgeText={p.background} v={rows.map((r) => r.v)} rot={rot} />

      {/* the Motion timeline */}
      <div style={{ position: "absolute", left: T(tl.x), top: T(tl.y), width: T(tl.w), height: T(tl.h), background: "#FFFFFF", borderRadius: T(20), border: hair, boxSizing: "border-box", boxShadow: `0 ${T(1)}px ${T(2)}px rgba(0,0,0,0.04), 0 ${T(8)}px ${T(24)}px rgba(0,0,0,0.06)`, overflow: "hidden", color: INK }}>
        {/* header */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: T(tl.head), display: "flex", alignItems: "center", gap: T(14), padding: `0 ${T(24)}px`, borderBottom: hair, boxSizing: "border-box" }}>
          <div style={{ width: T(36), height: T(36), borderRadius: T(9), background: p.accent, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 - 0.1 * playPress})`, flexShrink: 0 }}>
            <svg width={T(14)} height={T(14)} viewBox="0 0 10 10">
              <path d={playing ? "M2 1.2h2.1v7.6H2zM5.9 1.2H8v7.6H5.9z" : "M2.2 1l6.6 4-6.6 4z"} fill="#FFFFFF" />
            </svg>
          </div>
          <span style={{ fontSize: T(21), fontWeight: 600, letterSpacing: "-0.01em" }}>Motion</span>
          <span style={{ fontFamily: FONT_MONO, fontSize: T(16), color: INK2, marginLeft: T(4) }}>
            {playhead.toFixed(2)}s<span style={{ color: FAINT }}> / {DUR.toFixed(2)}s</span>
          </span>
          <span style={{ marginLeft: "auto", fontSize: T(15), color: SUB, whiteSpace: "nowrap" }}>
            {easeLabel} · {keyCount} keyframe{keyCount === 1 ? "" : "s"}
          </span>
        </div>

        {/* ruler */}
        <div style={{ position: "absolute", left: 0, right: 0, top: T(tl.head), height: T(tl.ruler), borderBottom: hair, boxSizing: "border-box" }}>
          <span style={{ position: "absolute", left: T(24), top: 0, lineHeight: `${T(tl.ruler)}px`, fontSize: T(13), fontWeight: 500, color: SUB }}>Layers</span>
          <svg width={T(tl.w - x0)} height={T(tl.ruler)} style={{ position: "absolute", left: T(x0), top: 0, overflow: "visible" }}>
            {/* ticks every 0.1s as two paths (keeps the DOM small), labels every 0.2s */}
            {[0, 1].map((odd) => (
              <path
                key={odd}
                d={Array.from({ length: odd ? 8 : 9 }, (_, k) => {
                  const x = T((k * 2 + odd) * 0.1 * px);
                  return `M${x} ${T(tl.ruler - (odd ? 6 : 10))}V${T(tl.ruler)}`;
                }).join("")}
                stroke={odd ? "#E1E2E6" : "#C9CBD1"}
                strokeWidth={Math.max(1, u)}
                fill="none"
              />
            ))}
            {Array.from({ length: 9 }, (_, k) => (
              <text key={k} x={T(k * 0.2 * px + 5)} y={T(tl.ruler * 0.5)} fontFamily={FONT_MONO} fontSize={T(13)} fill={FAINT}>
                {(k * 0.2).toFixed(1)}
              </text>
            ))}
          </svg>
        </div>

        {/* label column divider */}
        <div style={{ position: "absolute", left: T(tl.labelW), top: T(tl.head), bottom: 0, width: Math.max(1, u), background: LINE }} />

        {/* rows */}
        {rows.map((row, r) => (
          <div key={r} style={{ position: "absolute", left: 0, right: 0, top: T(tl.head + tl.ruler + r * rowH), height: T(rowH), borderBottom: r < 4 ? `${Math.max(1, u)}px solid ${ROWLINE}` : undefined, background: alpha(p.accent, 0.06 * row.hi), boxSizing: "border-box" }}>
            <div style={{ position: "absolute", left: T(24), top: 0, bottom: 0, width: T(tl.labelW - 36), display: "flex", alignItems: "center", gap: T(12) }}>
              <svg width={T(16)} height={T(16)} viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
                <path d={ICONS[r]} fill="none" stroke={row.sel ? p.accent : "#9A9CA3"} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontSize: T(19), color: row.sel ? INK : INK2, fontWeight: row.sel ? 500 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{names[r]}</span>
            </div>
            {row.bar > 0 ? (
              <div style={{ position: "absolute", left: T(x0 + START[r] * px), top: T(rowH / 2 - 4), width: T(LEN[r] * px * row.bar), height: T(8), borderRadius: T(4), background: alpha(p.accent, 0.2) }} />
            ) : null}
          </div>
        ))}

        {/* keyframe diamonds */}
        {rows.flatMap((row, r) =>
          [
            { k: row.a, t: START[r], sel: row.sel },
            { k: row.b, t: START[r] + LEN[r], sel: false },
          ].map(({ k, t, sel }, j) =>
            k.o > 0 ? (
              <div
                key={`${r}-${j}`}
                style={{
                  position: "absolute",
                  left: T(x0 + t * px - 10),
                  top: T(rowY(r) - 10),
                  width: T(20),
                  height: T(20),
                  boxSizing: "border-box",
                  borderRadius: T(3),
                  background: sel ? p.accent : "#FFFFFF",
                  border: `${T(3)}px solid ${p.accent}`,
                  opacity: k.o,
                  transform: `rotate(45deg) scale(${Math.max(0, k.s)})`,
                }}
              />
            ) : null,
          ),
        )}

        {/* playhead */}
        <div style={{ position: "absolute", left: T(x0 + playhead * px) - Math.max(1, u), top: T(tl.head + 4), bottom: 0, width: Math.max(2, T(2)), background: PLAYHEAD }}>
          <div style={{ position: "absolute", left: -T(7), top: 0, width: T(16), height: T(18), background: PLAYHEAD, borderRadius: T(3), clipPath: "polygon(0 0, 100% 0, 100% 62%, 50% 100%, 0 62%)" }} />
        </div>

        {/* name-tag cursor */}
        <div style={{ position: "absolute", left: T(cur(0)), top: T(cur(1)), transform: `scale(${1 - 0.1 * press})`, transformOrigin: "0 0" }}>
          <svg width={T(28)} height={T(28)} viewBox="0 0 24 24" style={{ position: "absolute", left: -T(3), top: -T(2.5), overflow: "visible" }}>
            <path d="M3 2l18 7.5-8 2.2L9.5 20z" fill={p.accent} stroke="#FFFFFF" strokeWidth={1.6} strokeLinejoin="round" />
          </svg>
          <div style={{ position: "absolute", left: T(22), top: T(22), background: p.accent, color: "#FFFFFF", fontSize: T(16), fontWeight: 500, lineHeight: 1, padding: `${T(6)}px ${T(11)}px`, borderRadius: T(7), whiteSpace: "nowrap", boxShadow: `0 ${T(2)}px ${T(6)}px rgba(0,0,0,0.12)` }}>{p.cursorName}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
