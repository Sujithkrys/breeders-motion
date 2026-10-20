import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, alpha, mix, progress, useLayout } from "../../kit";

export type LeaderboardReorderProps = {
  background: string;
  ink: string;
  muted: string;
  track: string;
  bar: string;
  accent: string;
  accentInk: string;
  pos: string;
  neg: string;
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

const fmt = (n: number, d = 0) => {
  const [int, frac] = Math.abs(n).toFixed(d).split(".");
  return (n < 0 ? "-" : "") + int.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (frac ? `.${frac}` : "");
};

const Arrow: React.FC<{ up: boolean; size: number; color: string }> = ({ up, size, color }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" style={{ transform: up ? undefined : "rotate(180deg)" }}>
    <path d="M6 2.5 L10 8.5 L2 8.5 Z" fill={color} />
  </svg>
);

export const LeaderboardReorder: React.FC<LeaderboardReorderProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, u, ratio, isVertical } = useLayout();
  const { n, decimals, rows } = parseBoard(p.names, p.from, p.to);
  const rankFrom = ranksOf(rows.map((r) => r.from));
  const rankTo = ranksOf(rows.map((r) => r.to));
  const scaleMax = Math.max(...rows.map((r) => Math.max(r.from, r.to)), 1e-6);

  const wide = ratio === "16:9";
  const blockW = (wide ? 1240 : isVertical ? 900 : 920) * u;
  const left = (width - blockW) / 2;
  const right = left + blockW;
  const headerTop = (wide ? 110 : isVertical ? 220 : 84) * u;
  const rowsTop = headerTop + (wide ? 200 : isVertical ? 260 : 190) * u;
  const availH = height - rowsTop - (wide ? 90 : isVertical ? 240 : 70) * u;
  const rowH = Math.min((isVertical ? 176 : 120) * u, availH / n);
  const badge = (wide ? 56 : 52) * u;
  const x0 = left + badge + 28 * u;
  const nameW = (wide ? 250 : 200) * u;
  const barX = isVertical ? x0 : x0 + nameW;
  const chipW = 92 * u;
  const trackW = isVertical ? right - x0 : right - barX - 150 * u - chipW;
  const barH = (isVertical ? 30 : 40) * u;

  // Intro must finish before the reorder starts, so long boards tighten the stagger.
  const st = Math.min(p.stagger, 32 / Math.max(1, n - 1));
  const T0 = 72;
  const T1 = 120;
  const t = progress(frame, T0, T1, p.ease);
  const lift = Math.sin(Math.PI * Math.min(1, progress(frame, T0, T1, "smooth")));
  const chipOn = progress(frame, T1 - 4, T1 + 12, "smooth");
  const head = progress(frame, 0, 22, "smooth");
  const mono: React.CSSProperties = { fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums" };

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS, color: p.ink }}>
      <div style={{ position: "absolute", left, width: blockW, top: headerTop, display: "flex", flexDirection: "column", gap: 14 * u, opacity: head, transform: `translateY(${(1 - head) * 24 * u}px)` }}>
        <span style={{ ...mono, fontSize: 20 * u, letterSpacing: "0.14em", textTransform: "uppercase", color: p.muted }}>Top {n} · ranked</span>
        <span style={{ fontSize: (wide ? 68 : 60) * u, fontWeight: 650, letterSpacing: "-0.04em", lineHeight: 1.02 }}>{p.title}</span>
      </div>

      {/* static rank slots */}
      {rows.map((_, slot) => {
        const on = progress(frame, 8 + slot * st, 26 + slot * st, "smooth");
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
              borderRadius: "50%",
              background: lead ? p.accent : p.track,
              color: lead ? p.accentInk : p.muted,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ...mono,
              fontSize: 22 * u,
              fontWeight: 600,
              opacity: on,
              transform: `scale(${0.7 + 0.3 * on})`,
            }}
          >
            {slot + 1}
          </div>
        );
      })}

      {rows.map((r, i) => {
        const intro = progress(frame, 8 + rankFrom[i] * st, 32 + rankFrom[i] * st, "smooth");
        const pos = mix(rankFrom[i], rankTo[i], t);
        const v = mix(r.from, r.to, t) * intro;
        const len = Math.max(0, (v / scaleMax) * trackW);
        const lead = Math.max(0, Math.min(1, 1 - Math.abs(pos)));
        const moved = rankTo[i] - rankFrom[i];
        const lifting = moved !== 0 ? lift : 0;
        const delta = -moved;
        const dc = delta > 0 ? p.pos : p.neg;
        const nameEl = <span style={{ fontSize: (isVertical ? 32 : 30) * u, fontWeight: lead > 0.5 ? 650 : 500, letterSpacing: "-0.02em", whiteSpace: "nowrap", overflow: "hidden" }}>{r.name}</span>;
        const chipEl =
          delta !== 0 ? (
            <span
              style={{
                ...mono,
                display: "flex",
                alignItems: "center",
                gap: 4 * u,
                fontSize: 20 * u,
                fontWeight: 600,
                color: dc,
                background: alpha(dc, 0.14),
                padding: `${5 * u}px ${12 * u}px ${5 * u}px ${8 * u}px`,
                borderRadius: 999,
                opacity: chipOn,
                transform: `scale(${0.8 + 0.2 * chipOn})`,
              }}
            >
              <Arrow up={delta > 0} size={14 * u} color={dc} />
              {Math.abs(delta)}
            </span>
          ) : null;
        const barEl = (
          <div style={{ position: "relative", width: trackW, height: barH, borderRadius: barH * 0.3, background: alpha(p.track, 0.6) }}>
            <div style={{ position: "absolute", left: 0, top: 0, height: barH, width: len, borderRadius: barH * 0.3, background: `linear-gradient(90deg, ${alpha(p.bar, 0.7)}, ${p.bar})` }} />
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                height: barH,
                width: len,
                borderRadius: barH * 0.3,
                background: `linear-gradient(90deg, ${alpha(p.accent, 0.75)}, ${p.accent})`,
                boxShadow: `0 ${10 * u}px ${30 * u}px ${alpha(p.accent, 0.35 * lead)}`,
                opacity: lead,
              }}
            />
            {!isVertical && (
              <span style={{ ...mono, position: "absolute", left: len + 18 * u, top: (barH - 30 * u) / 2, fontSize: 26 * u, lineHeight: `${30 * u}px`, fontWeight: 600, whiteSpace: "nowrap" }}>{fmt(v, decimals)}</span>
            )}
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
              flexDirection: isVertical ? "column" : "row",
              justifyContent: "center",
              alignItems: isVertical ? "stretch" : "center",
              gap: isVertical ? 14 * u : 0,
            }}
          >
            {isVertical ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 16 * u }}>
                  {nameEl}
                  {chipEl}
                  <span style={{ flex: 1 }} />
                  <span style={{ ...mono, fontSize: 28 * u, fontWeight: 600 }}>{fmt(v, decimals)}</span>
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
