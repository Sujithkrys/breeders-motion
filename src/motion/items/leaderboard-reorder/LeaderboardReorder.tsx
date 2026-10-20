import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, alpha, mix, progress, useLayout } from "../../kit";

export type LeaderboardReorderProps = {
  background: string;
  card: string;
  line: string;
  fill: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  onAccent: string;
  success: string;
  error: string;
  title: string;
  names: string;
  from: string;
  to: string;
  stagger: number; // frames between rows on the way in
  ease: string;
};

const DEFAULT_NAMES = ["Atlas", "Lumen", "Orbit", "Kestrel", "Nova", "Juniper", "Harbor"];
const DEFAULT_FROM = [82, 74, 61, 55, 40];
const DEFAULT_TO = [71, 96, 58, 83, 64];

// Timing in frames (180-frame clip): card and rows enter, values and order travel T0 → T1, chips land, then hold.
export const LB = { cardIn: 20, headA: 4, headB: 24, slotA: 8, slotIn: 18, rowA: 8, rowIn: 24, T0: 72, T1: 120, chipLead: 2, chipIn: 20 } as const;
// Non-leader bars mix the track toward ink3 by this much.
export const BAR_GREY = 0.6;

const parseList = (s: string) =>
  String(s)
    .split(",")
    .map((x) => x.trim())
    .filter((x) => x !== "" && Number.isFinite(parseFloat(x)))
    .slice(0, 7);

// Rows = the shorter of the two value lists (3–7); names fill in from defaults when missing.
export const parseBoard = (names: string, from: string, to: string) => {
  let a = parseList(from);
  let b = parseList(to);
  if (Math.min(a.length, b.length) < 3) {
    a = DEFAULT_FROM.map(String);
    b = DEFAULT_TO.map(String);
  }
  const n = Math.min(a.length, b.length);
  const nm = String(names).split(",").map((x) => x.trim());
  const decimals = Math.min(2, Math.max(...[...a.slice(0, n), ...b.slice(0, n)].map((x) => (x.split(".")[1] ?? "").length)));
  return {
    n,
    decimals,
    rows: Array.from({ length: n }, (_, i) => ({
      name: nm[i] || DEFAULT_NAMES[i],
      from: Math.max(0, parseFloat(a[i])),
      to: Math.max(0, parseFloat(b[i])),
    })),
  };
};

export const ranksOf = (vals: number[]) => {
  const order = vals.map((v, i) => ({ v, i })).sort((x, y) => y.v - x.v || x.i - y.i);
  const rank: number[] = new Array(vals.length).fill(0);
  order.forEach((o, r) => {
    rank[o.i] = r;
  });
  return rank;
};

// Long boards tighten the intro stagger so every row is in before the reorder starts.
export const introStagger = (stagger: number, n: number) => Math.min(stagger, 32 / Math.max(1, n - 1));

const fmt = (n: number, d = 0) => {
  const [int, frac] = Math.abs(n).toFixed(d).split(".");
  return (n < 0 ? "-" : "") + int.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (frac ? `.${frac}` : "");
};

// ---------- colour helpers (inputs are props) ----------
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

// Layout in px. Header and rows sit inside one card, centred.
export const boardLayout = (width: number, height: number, n: number) => {
  const u = Math.min(width, height) / 1080;
  const vertical = height > width;
  const wide = width > height;
  const pad = (wide ? 64 : 56) * u;
  const blockW = (wide ? 1240 : vertical ? 840 : 820) * u;
  const cardW = blockW + 2 * pad;
  const headerH = (wide ? 110 : 104) * u;
  const headGap = (wide ? 40 : 36) * u;
  const maxCardH = height - 2 * (wide ? 80 : vertical ? 200 : 60) * u;
  const availH = maxCardH - 2 * pad - headerH - headGap;
  const rowH = Math.min((vertical ? 150 : wide ? 110 : 104) * u, availH / n);
  const cardH = 2 * pad + headerH + headGap + n * rowH;
  const cardLeft = (width - cardW) / 2;
  const cardTop = (height - cardH) / 2;
  const left = cardLeft + pad;
  const headerTop = cardTop + pad;
  const rowsTop = headerTop + headerH + headGap;
  const badge = (wide ? 48 : 44) * u;
  const x0 = left + badge + 28 * u;
  const nameW = (wide ? 230 : 190) * u;
  const barX = vertical ? x0 : x0 + nameW;
  const chipW = 92 * u;
  const right = left + blockW;
  const trackW = vertical ? right - x0 : right - barX - 130 * u - chipW;
  const barH = (vertical ? 20 : 24) * u;
  return { u, vertical, wide, pad, blockW, cardW, cardH, cardLeft, cardTop, left, right, headerTop, headerH, rowsTop, rowH, badge, x0, nameW, trackW, barH };
};

const Arrow: React.FC<{ up: boolean; size: number; color: string }> = ({ up, size, color }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" style={{ transform: up ? undefined : "rotate(180deg)" }}>
    <path d="M6 2.5 L10 8.5 L2 8.5 Z" fill={color} />
  </svg>
);

export const LeaderboardReorder: React.FC<LeaderboardReorderProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height } = useLayout();
  const { n, decimals, rows } = parseBoard(p.names, p.from, p.to);
  const rankFrom = ranksOf(rows.map((r) => r.from));
  const rankTo = ranksOf(rows.map((r) => r.to));
  const scaleMax = Math.max(...rows.map((r) => Math.max(r.from, r.to)), 1e-6);
  const L = boardLayout(width, height, n);
  const { u, vertical, wide, left, right, rowsTop, rowH, badge, x0, nameW, trackW, barH } = L;
  const dark = isDarkHex(p.background);
  const barGrey = mixHex(p.fill, p.ink3, BAR_GREY);

  const st = introStagger(p.stagger, n);
  const t = progress(frame, LB.T0, LB.T1, p.ease);
  const lift = Math.sin(Math.PI * Math.min(1, progress(frame, LB.T0, LB.T1, "enter")));
  const chipOn = progress(frame, LB.T1 - LB.chipLead, LB.T1 - LB.chipLead + LB.chipIn, "enter");
  const cardOn = progress(frame, 0, LB.cardIn, "enter");
  const head = progress(frame, LB.headA, LB.headB, "enter");
  const mono: React.CSSProperties = { fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums" };

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
      <div style={{ position: "absolute", left, width: L.blockW, top: L.headerTop, display: "flex", flexDirection: "column", gap: 14 * u, opacity: head, transform: `translateY(${(1 - head) * 16 * u}px)` }}>
        <span style={{ ...mono, fontSize: 18 * u, letterSpacing: "0.12em", textTransform: "uppercase", color: p.ink3 }}>Top {n} · ranked</span>
        <span style={{ fontSize: (wide ? 48 : 44) * u, fontWeight: 400, letterSpacing: "-0.035em", lineHeight: 1.1, whiteSpace: "nowrap" }}>{p.title}</span>
      </div>

      {/* static rank slots */}
      {rows.map((_, slot) => {
        const on = progress(frame, LB.slotA + slot * st, LB.slotA + slot * st + LB.slotIn, "enter");
        const lead = slot === 0;
        return (
          <div
            key={`slot-${slot}`}
            style={{
              position: "absolute",
              left,
              top: rowsTop + slot * rowH + (rowH - badge) / 2,
              width: badge,
              height: badge,
              borderRadius: 999,
              background: lead ? p.accent : p.fill,
              color: lead ? p.onAccent : p.ink2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ...mono,
              fontSize: 20 * u,
              fontWeight: 500,
              opacity: on,
              transform: `scale(${0.8 + 0.2 * on})`,
            }}
          >
            {slot + 1}
          </div>
        );
      })}

      {rows.map((r, i) => {
        const intro = progress(frame, LB.rowA + rankFrom[i] * st, LB.rowA + rankFrom[i] * st + LB.rowIn, "enter");
        const pos = mix(rankFrom[i], rankTo[i], t);
        const v = mix(r.from, r.to, t) * intro;
        const len = Math.max(0, (v / scaleMax) * trackW);
        const lead = Math.max(0, Math.min(1, 1 - Math.abs(pos)));
        const moved = rankTo[i] - rankFrom[i];
        const lifting = moved !== 0 ? lift : 0;
        const delta = -moved;
        const dc = delta > 0 ? p.success : p.error;
        const valueStyle: React.CSSProperties = { ...mono, fontWeight: lead > 0.5 ? 600 : 500, color: mixHex(p.ink2, p.ink, lead), whiteSpace: "nowrap" };
        const nameEl = (
          <span style={{ fontSize: (vertical ? 30 : 28) * u, fontWeight: lead > 0.5 ? 500 : 400, letterSpacing: "-0.015em", color: p.ink, whiteSpace: "nowrap", overflow: "hidden" }}>{r.name}</span>
        );
        const chipEl =
          delta !== 0 ? (
            <span
              style={{
                ...mono,
                display: "flex",
                alignItems: "center",
                gap: 4 * u,
                fontSize: 18 * u,
                fontWeight: 500,
                color: dc,
                background: alpha(dc, 0.12),
                padding: `${5 * u}px ${12 * u}px ${5 * u}px ${9 * u}px`,
                borderRadius: 999,
                opacity: chipOn,
                transform: `scale(${0.8 + 0.2 * chipOn})`,
              }}
            >
              <Arrow up={delta > 0} size={12 * u} color={dc} />
              {Math.abs(delta)}
            </span>
          ) : null;
        const barEl = (
          <div style={{ position: "relative", width: trackW, height: barH, borderRadius: RADIUS.chip * u, background: p.fill }}>
            <div style={{ position: "absolute", left: 0, top: 0, height: barH, width: len, borderRadius: RADIUS.chip * u, background: barGrey }} />
            <div style={{ position: "absolute", left: 0, top: 0, height: barH, width: len, borderRadius: RADIUS.chip * u, background: p.accent, opacity: lead }} />
            {!vertical && <span style={{ ...valueStyle, position: "absolute", left: len + 18 * u, top: (barH - 30 * u) / 2, fontSize: 24 * u, lineHeight: `${30 * u}px` }}>{fmt(v, decimals)}</span>}
          </div>
        );
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x0,
              width: right - x0,
              top: rowsTop + pos * rowH,
              height: rowH,
              zIndex: moved < 0 ? 3 : moved === 0 ? 2 : 1,
              opacity: intro,
              transform: `translateX(${(1 - intro) * 40 * u}px) scale(${1 + 0.02 * lifting})`,
              transformOrigin: "left center",
              display: "flex",
              flexDirection: vertical ? "column" : "row",
              justifyContent: "center",
              alignItems: vertical ? "stretch" : "center",
              gap: vertical ? 14 * u : 0,
            }}
          >
            {vertical ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 16 * u }}>
                  {nameEl}
                  {chipEl}
                  <span style={{ flex: 1 }} />
                  <span style={{ ...valueStyle, fontSize: 26 * u }}>{fmt(v, decimals)}</span>
                </div>
                {barEl}
              </>
            ) : (
              <>
                <div style={{ width: nameW - 24 * u, marginRight: 24 * u, display: "flex", overflow: "hidden" }}>{nameEl}</div>
                {barEl}
                <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>{chipEl}</div>
              </>
            )}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
