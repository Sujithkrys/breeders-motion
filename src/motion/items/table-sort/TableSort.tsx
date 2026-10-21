import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STROKE, alpha, mix, progress, useLayout } from "../../kit";
import type { Ratio } from "../../types";

export type TableSortProps = {
  background: string;
  card: string;
  fill: string;
  line: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  title: string;
  stagger: number; // frames between rows as they slide
  ease: string;
};

// ---------- geometry (design px; k = scale × u) ----------
export const SCALE: Record<Ratio, number> = { "16:9": 1.75, "1:1": 1.4, "9:16": 1.4 };
export const CW = 680;
export const PAD = 28;
export const HEAD_Y = 76;
export const HEAD_H = 40;
export const ROW_H = 56;
export const ROWS_Y = HEAD_Y + HEAD_H;
export const CH = ROWS_Y + 6 * ROW_H + 18;
export const COL = { name: PAD + 8, plan: 300, seatsR: 470, mrrR: CW - PAD - 12 } as const;

// ---------- data ----------
export const ROWS = [
  { name: "Northwind", initials: "N", plan: "Team", seats: 24, mrr: 4320 },
  { name: "Acme Labs", initials: "AL", plan: "Enterprise", seats: 180, mrr: 21600 },
  { name: "Lumen", initials: "L", plan: "Pro", seats: 12, mrr: 1140 },
  { name: "Parcel", initials: "P", plan: "Team", seats: 48, mrr: 8640 },
  { name: "Halcyon", initials: "H", plan: "Enterprise", seats: 96, mrr: 14400 },
  { name: "Fieldnote", initials: "F", plan: "Pro", seats: 6, mrr: 570 },
];
export const money = (n: number) => `$${n.toLocaleString("en-US")}`;
const rankBy = (cmp: (a: number, b: number) => number) => {
  const order = ROWS.map((_, i) => i).sort(cmp);
  const rank: number[] = [];
  order.forEach((r, i) => (rank[r] = i));
  return rank;
};
const ORIGINAL = ROWS.map((_, i) => i);
const ASC = rankBy((a, b) => ROWS[a].mrr - ROWS[b].mrr);
const DESC = rankBy((a, b) => ROWS[b].mrr - ROWS[a].mrr);

// ---------- timeline (180-frame loop): three header clicks cycle ascending → descending → unsorted ----------
export const T = { inA: 8, inB: 24, homeA: 128, homeB: 148 } as const;
export const SORTS: { click: number; at: number; rank: number[]; label: string }[] = [
  { click: 28, at: 30, rank: ASC, label: "ascending" },
  { click: 76, at: 78, rank: DESC, label: "descending" },
  { click: 120, at: 122, rank: ORIGINAL, label: "unsorted" },
];
export const MOVE = 24; // frames each row takes to slide
export const HILITE = { inEnd: 6, outA: 14, outB: 26 } as const;
export const maxStagger = (n: number) => Math.min(4, Math.max(0, Number(n) || 0));

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
export const isDark = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  if (Number.isNaN(n)) return false;
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.4;
};
type Pt = [number, number];
const glide = (a: Pt, b: Pt, t: number): Pt => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const bow = Math.sin(Math.PI * clamp01(t)) * 0.08;
  return [a[0] + dx * t - dy * bow, a[1] + dy * t + dx * bow];
};

export const TableSort: React.FC<TableSortProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, ratio } = useLayout();
  const k = SCALE[ratio] * u;
  const dark = isDark(p.background);
  const hair = Math.max(1, u);
  const st = maxStagger(p.stagger);
  const bump = (c: number) => interpolate(frame, [c - 3, c, c + 5], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // ---- each row's slot (fractional while sliding) and its highlight
  const rows = ROWS.map((r, i) => {
    let prev = ORIGINAL[i];
    let pos = prev;
    let hl = 0;
    let lift = 0;
    for (const s of SORTS) {
      if (frame < s.at) break;
      const next = s.rank[i];
      const a = s.at + st * next;
      const t = progress(frame, a, a + MOVE, p.ease);
      pos = mix(prev, next, t);
      if (next !== prev) {
        hl = progress(frame, a, a + HILITE.inEnd, "enter") * (1 - progress(frame, a + HILITE.outA, a + HILITE.outB, "exit"));
        lift = Math.sin(Math.PI * clamp01(t));
      } else {
        hl = 0;
        lift = 0;
      }
      prev = next;
    }
    return { ...r, i, pos, hl, lift };
  });

  // ---- sort state: arrow appears on click 1, flips on click 2, leaves on click 3
  const [c1, c2, c3] = SORTS;
  const arrowOn = progress(frame, c1.click, c1.click + 12, "enter") * (1 - progress(frame, c3.click, c3.click + 12, "exit"));
  const flip = progress(frame, c2.click, c2.click + 14, "travel");
  const active = arrowOn;

  // ---- cursor (design coords)
  const headPt: Pt = [COL.mrrR - 18, HEAD_Y + HEAD_H * 0.62];
  const home: Pt = [CW * 0.8, CH + 30];
  let cur: Pt = home;
  if (frame >= T.homeA) cur = glide(headPt, home, progress(frame, T.homeA, T.homeB, "travel"));
  else if (frame >= T.inA) cur = glide(home, headPt, progress(frame, T.inA, T.inB, "travel"));
  const press = Math.max(...SORTS.map((s) => bump(s.click)));

  const abs = (l: number, t: number, w: number, h: number): React.CSSProperties => ({ position: "absolute", left: l * k, top: t * k, width: w * k, height: h * k });
  const headLabel: React.CSSProperties = { fontFamily: FONT_MONO, fontSize: 11 * k, letterSpacing: "0.1em", color: p.ink3, whiteSpace: "nowrap" };

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div
        style={{
          position: "relative",
          width: CW * k,
          height: CH * k,
          background: p.card,
          borderRadius: RADIUS.card * u,
          border: `${hair}px solid ${p.line}`,
          boxSizing: "border-box",
          boxShadow: dark ? "none" : `0 ${u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)`,
        }}
      >
        {/* title */}
        <div style={{ ...abs(PAD + 8, 26, CW - 2 * PAD - 120, 28), fontSize: 20 * k, fontWeight: 500, letterSpacing: "-0.02em", color: p.ink, whiteSpace: "nowrap", lineHeight: `${28 * k}px` }}>{p.title}</div>
        <div style={{ ...abs(CW - PAD - 132, 26, 120, 28), ...headLabel, textAlign: "right", lineHeight: `${28 * k}px` }}>{`${ROWS.length} ROWS`}</div>

        {/* rows (opaque, so a sliding row passes cleanly over the others) */}
        {[...rows]
          .sort((a, b) => a.lift - b.lift)
          .map((r) => {
            const top = ROWS_Y + r.pos * ROW_H;
            return (
              <div key={r.name} style={{ ...abs(0, top, CW, ROW_H) }}>
                <div style={{ position: "absolute", left: (PAD - 10) * k, right: (PAD - 10) * k, top: 0, bottom: 0, background: p.card }} />
                <div style={{ position: "absolute", left: PAD * k, right: PAD * k, top: 0, height: hair, background: p.line }} />
                <div style={{ position: "absolute", left: (PAD - 6) * k, right: (PAD - 6) * k, top: 6 * k, bottom: 6 * k, borderRadius: RADIUS.button * u, background: alpha(p.accent, (dark ? 0.16 : 0.08) * r.hl) }} />
                <div style={{ ...abs(COL.name, (ROW_H - 30) / 2, 30, 30), borderRadius: "50%", background: p.fill, color: p.ink2, fontSize: 11 * k, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>{r.initials}</div>
                <div style={{ ...abs(COL.name + 44, 0, 200, ROW_H), display: "flex", alignItems: "center", fontSize: 15 * k, fontWeight: 500, color: p.ink, whiteSpace: "nowrap" }}>{r.name}</div>
                <div style={{ ...abs(COL.plan, 0, 140, ROW_H), display: "flex", alignItems: "center" }}>
                  <span style={{ height: 26 * k, lineHeight: `${26 * k}px`, padding: `0 ${10 * k}px`, borderRadius: RADIUS.chip * u, background: p.fill, color: p.ink2, fontSize: 13 * k, fontWeight: 500, whiteSpace: "nowrap" }}>{r.plan}</span>
                </div>
                <div style={{ ...abs(COL.seatsR - 100, 0, 100, ROW_H), display: "flex", alignItems: "center", justifyContent: "flex-end", fontSize: 15 * k, color: p.ink2 }}>{`${r.seats}`}</div>
                <div
                  style={{
                    ...abs(COL.mrrR - 140, 0, 140, ROW_H),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    fontSize: 15 * k,
                    fontWeight: 500,
                    color: interpolateColors(active, [0, 1], [p.ink2, p.ink]),
                  }}
                >
                  {money(r.mrr)}
                </div>
              </div>
            );
          })}

        {/* header (above the rows) */}
        <div style={{ ...abs(PAD - 10, HEAD_Y, CW - 2 * (PAD - 10), HEAD_H), background: p.card }} />
        <div style={{ ...abs(COL.name, HEAD_Y, 120, HEAD_H), ...headLabel, display: "flex", alignItems: "center" }}>NAME</div>
        <div style={{ ...abs(COL.plan, HEAD_Y, 120, HEAD_H), ...headLabel, display: "flex", alignItems: "center" }}>PLAN</div>
        <div style={{ ...abs(COL.seatsR - 120, HEAD_Y, 120, HEAD_H), ...headLabel, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>SEATS</div>
        <div
          style={{
            ...abs(COL.mrrR - 120, HEAD_Y, 120, HEAD_H),
            ...headLabel,
            color: interpolateColors(active, [0, 1], [p.ink3, p.ink]),
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 6 * k,
          }}
        >
          <svg width={12 * k} height={12 * k} viewBox="0 0 12 12" style={{ opacity: arrowOn, transform: `translateY(${(1 - arrowOn) * 4 * k}px) rotate(${180 * flip}deg)` }}>
            <path d="M6 10V2M2.5 5.5 6 2l3.5 3.5" fill="none" stroke={p.accent} strokeWidth={(STROKE.ring * u) / k} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>MRR</span>
        </div>
        <div style={{ ...abs(PAD, ROWS_Y, CW - 2 * PAD, hair / k), background: p.line }} />

        {/* cursor */}
        <svg
          width={30 * u}
          height={41 * u}
          viewBox="0 0 16 22"
          style={{ position: "absolute", left: cur[0] * k - 2 * u, top: cur[1] * k - 2 * u, overflow: "visible", transformOrigin: "0 0", transform: `scale(${1 - 0.12 * press})`, zIndex: 10 }}
        >
          <path d="M1 1V17.4L5.1 13.6 7.9 20.2 10.7 19 7.9 12.5H13.6Z" fill={p.ink} stroke={p.card} strokeWidth={1.3} strokeLinejoin="round" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
