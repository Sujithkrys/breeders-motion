import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STROKE, alpha, progress, useLayout } from "../../kit";
import type { Ratio } from "../../types";

export type DateRangePickerProps = {
  background: string;
  card: string;
  fill: string;
  line: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  onAccent: string;
  month: string; // "October 2026"
  preset1: string;
  preset2: string;
  preset3: string; // the one the cursor clicks: the last 7 days up to today
  ease: string;
};

// ---------- geometry (design px; k = scale × u) ----------
// 16:9 puts the presets in a side column; 1:1 and 9:16 put them in a chip row above the month.
export const SCALE: Record<Ratio, number> = { "16:9": 1.7, "1:1": 1.7, "9:16": 1.72 };
export const CELL_H = 52;
export const CAP = 44;
export const HEAD_H = 84;
export const PANEL_W = 200;
export const layoutFor = (side: boolean, rows: number) => {
  const cell = side ? 72 : 70;
  const gridL = side ? PANEL_W + 28 : 25;
  const cw = side ? PANEL_W + 56 + 7 * cell : 540;
  const monthY = side ? HEAD_H + 24 : HEAD_H + 80;
  const gridY = monthY + 68;
  return { cell, gridL, cw, monthY, gridY, ch: gridY + rows * CELL_H + 24 };
};

// ---------- the calendar ----------
export const TODAY = 22;
export const DRAG = { from: 8, to: 15 } as const; // the days the cursor drags across
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const parseMonth = (label: string) => {
  const l = label.toLowerCase();
  let m = MONTHS.findIndex((n) => l.includes(n.slice(0, 3).toLowerCase()));
  if (m < 0) m = 9;
  const y = Number((label.match(/\d{4}/) ?? [])[0]) || 2026;
  const lead = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7; // Monday first
  const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const prevDays = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const rows = Math.max(5, Math.ceil((lead + days) / 7));
  return { short: MONTHS[m].slice(0, 3), lead, days, prevDays, rows, today: Math.min(TODAY, days) };
};
export const readout = (short: string, a: number, b: number) => ({ main: `${short} ${a} – ${short} ${b}`, tail: `· ${b - a + 1} days` });

// ---------- timeline (180-frame loop) ----------
export const T = {
  inA: 8, inB: 24, press: 26, dragA: 28, dragB: 50, fillA: 30, fillB: 52, release: 54,
  toChipA: 92, toChipB: 110, click: 112, oldOutA: 114, oldOutB: 128, newCapA: 116, newFillA: 118, newFillB: 138, newEndA: 136,
  homeA: 142, homeB: 160, resetA: 150, resetB: 164,
} as const;
export const WEEKDAYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

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

type Pop = { scale: number; on: number };
type Range = { s: number; end: number; e: number; on: number; capS: Pop; capE: Pop };

export const DateRangePicker: React.FC<DateRangePickerProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, ratio, height } = useLayout();
  const side = ratio === "16:9";
  const cal = parseMonth(p.month);
  const L = layoutFor(side, cal.rows);
  const k = Math.min(SCALE[ratio], (height * 0.9) / (u * L.ch)) * u; // shrink if a 6-row month runs tall
  const dark = isDark(p.background);
  const hair = Math.max(1, u);
  const seg = (a: number, b: number, e: string = p.ease) => progress(frame, a, b, e);
  // A cap pops in: scales 0.6 → 1.08 → 1 on the spring.
  const pop = (a: number): Pop => {
    const up = progress(frame, a, a + 10, "spring");
    return { scale: 0.6 + 0.4 * up + 0.08 * (up - progress(frame, a + 6, a + 16, "spring")), on: up };
  };
  const bump = (at: number) => interpolate(frame, [at - 3, at, at + 5], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // ---- ranges (cell indices)
  const idx = (day: number) => cal.lead + day - 1;
  const sA = idx(DRAG.from);
  const eA = idx(Math.min(DRAG.to, cal.days));
  const sB = idx(Math.max(1, cal.today - 6));
  const eB = idx(cal.today);
  const reset = 1 - seg(T.resetA, T.resetB, "exit");
  const capA0 = pop(T.press);
  const capA1 = pop(T.release);
  const capB0 = pop(T.newCapA);
  const capB1 = pop(T.newEndA);
  const rA: Range = {
    s: sA,
    end: eA,
    e: sA + (eA - sA) * seg(T.fillA, T.fillB),
    on: (frame >= T.press ? 1 : 0) * (1 - seg(T.oldOutA, T.oldOutB, "exit")),
    capS: capA0,
    capE: capA1,
  };
  const rB: Range = {
    s: sB,
    end: eB,
    e: sB + (eB - sB) * seg(T.newFillA, T.newFillB),
    on: (frame >= T.newCapA ? 1 : 0) * reset,
    capS: capB0,
    capE: capB1,
  };
  const ranges = [rA, rB].filter((r) => r.on > 0.001);

  const cellX = (i: number) => L.gridL + (i % 7) * L.cell + L.cell / 2;
  const cellY = (i: number) => L.gridY + Math.floor(i / 7) * CELL_H + CELL_H / 2;
  const band = alpha(p.accent, dark ? 0.22 : 0.12);

  // ---- readout states
  const stA = readout(cal.short, DRAG.from, Math.min(DRAG.to, cal.days));
  const stB = readout(cal.short, Math.max(1, cal.today - 6), cal.today);
  const inA = seg(T.release, T.release + 16, "enter") * (1 - seg(T.click + 2, T.click + 14, "exit"));
  const inB = seg(T.click + 4, T.click + 20, "enter") * reset;
  const inP = 1 - clamp01(seg(T.release - 2, T.release + 8, "exit") - seg(T.resetA + 2, T.resetB + 2, "enter"));

  // ---- presets
  const presets = [p.preset1, p.preset2, p.preset3];
  const fsChip = 15;
  const chipW = presets.map((t) => (side ? PANEL_W - 40 : t.length * fsChip * 0.56 + 30));
  const chips = presets.map((t, i) => {
    if (side) return { t, x: 20, y: HEAD_H + 22 + i * 44, w: chipW[i], h: 36 };
    const x = L.gridL + chipW.slice(0, i).reduce((a, b) => a + b + 8, 0);
    return { t, x, y: HEAD_H + 22, w: chipW[i], h: 36 };
  });
  const chipOn = seg(T.click, T.click + 12, "enter") * reset;

  // ---- cursor (design coords)
  const home: Pt = side ? [L.cw * 0.84, L.ch - 30] : [L.cw * 0.8, L.ch - 22];
  const at = (i: number): Pt => [cellX(i) + 4, cellY(i) + 8];
  const chipPt: Pt = [chips[2].x + chips[2].w * 0.62, chips[2].y + chips[2].h * 0.62];
  let cur: Pt = home;
  if (frame >= T.homeA) cur = glide(chipPt, home, seg(T.homeA, T.homeB, "travel"));
  else if (frame >= T.toChipA) cur = glide(at(eA), chipPt, seg(T.toChipA, T.toChipB, "travel"));
  else if (frame >= T.dragA) cur = glide(at(sA), at(eA), seg(T.dragA, T.dragB, p.ease));
  else if (frame >= T.inA) cur = glide(home, at(sA), seg(T.inA, T.inB, "travel"));
  const held = frame >= T.press && frame <= T.release ? 1 : 0;
  const press = Math.max(held * 0.5, bump(T.press), bump(T.release), bump(T.click));

  // ---- cells: one SVG of day numbers
  const capOn = (i: number) => ranges.reduce((m, r) => Math.max(m, i === r.s ? r.on * r.capS.on : 0, i === r.end ? r.on * r.capE.on : 0), 0);
  const cells = Array.from({ length: cal.rows * 7 }, (_, i) => {
    const d = i - cal.lead + 1;
    const out = d < 1 || d > cal.days;
    const day = d < 1 ? cal.prevDays + d : d > cal.days ? d - cal.days : d;
    const c = capOn(i);
    return { i, day, out, color: out ? p.ink3 : interpolateColors(c, [0, 1], [p.ink, p.onAccent]), weight: c > 0.5 ? 500 : 400 };
  });

  const abs = (l: number, t: number, w: number, h: number): React.CSSProperties => ({ position: "absolute", left: l * k, top: t * k, width: w * k, height: h * k });
  const line = (l: number, t: number, w: number, h: number) => <div style={{ ...abs(l, t, w, h), background: p.line }} />;

  const bandRows = (r: Range) => {
    const out: React.ReactNode[] = [];
    for (let row = 0; row < cal.rows; row++) {
      const a = Math.max(r.s, row * 7 - 0.5);
      const b = Math.min(r.e, row * 7 + 6.5);
      if (b - a < 0.02) continue;
      const x0 = L.gridL + (a - row * 7 + 0.5) * L.cell;
      const x1 = L.gridL + (b - row * 7 + 0.5) * L.cell;
      out.push(
        <div
          key={`b${row}`}
          style={{ ...abs(x0, L.gridY + row * CELL_H + (CELL_H - CAP) / 2, x1 - x0, CAP), background: band, borderRadius: RADIUS.button * u, opacity: r.on }}
        />,
      );
    }
    return out;
  };
  const capDiv = (key: string, i: number, c: Pop, on: number) =>
    c.on > 0.001 ? (
      <div
        key={key}
        style={{ ...abs(cellX(i) - CAP / 2, cellY(i) - CAP / 2, CAP, CAP), background: p.accent, borderRadius: RADIUS.button * u, opacity: on * clamp01(c.on * 1.5), transform: `scale(${c.scale})` }}
      />
    ) : null;

  const chev = (x: number, flip: boolean) => (
    <svg style={{ ...abs(x, L.monthY - 2, 28, 28) }} viewBox="0 0 28 28">
      <path d={flip ? "M12 9l5 5-5 5" : "M16 9l-5 5 5 5"} fill="none" stroke={p.ink2} strokeWidth={(STROKE.ring * u) / k} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  const readLine = (main: string, tail: string, o: number, mainColor: string) =>
    o > 0.001 ? (
      <div style={{ ...abs(28, 26, L.cw - 56, 40), display: "flex", alignItems: "center", gap: 10 * k, opacity: o, transform: `translateY(${(1 - o) * 10 * k}px)`, whiteSpace: "nowrap", fontSize: 28 * k, letterSpacing: "-0.03em" }}>
        <span style={{ color: mainColor, fontWeight: 500 }}>{main}</span>
        {tail !== "" ? <span style={{ color: p.ink2, fontWeight: 400 }}>{tail}</span> : null}
      </div>
    ) : null;

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div
        style={{
          position: "relative",
          width: L.cw * k,
          height: L.ch * k,
          background: p.card,
          borderRadius: RADIUS.card * u,
          border: `${hair}px solid ${p.line}`,
          boxSizing: "border-box",
          boxShadow: dark ? "none" : `0 ${u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)`,
        }}
      >
        {/* readout */}
        {readLine("Select dates", "", inP, p.ink3)}
        {readLine(stA.main, stA.tail, inA, p.ink)}
        {readLine(stB.main, stB.tail, inB, p.ink)}
        {line(0, HEAD_H, L.cw, hair / k)}
        {side ? line(PANEL_W, HEAD_H, hair / k, L.ch - HEAD_H) : null}

        {/* presets */}
        {chips.map((c, i) => {
          const on = i === 2 ? chipOn : 0;
          return (
            <div
              key={`c${i}`}
              style={{
                ...abs(c.x, c.y, c.w, c.h),
                borderRadius: (side ? RADIUS.button : RADIUS.chip) * u,
                background: on > 0.001 ? alpha(p.fill, on) : "transparent",
                boxShadow: side ? undefined : `inset 0 0 0 ${hair}px ${p.line}`,
                display: "flex",
                alignItems: "center",
                justifyContent: side ? "flex-start" : "center",
                paddingLeft: side ? 14 * k : 0,
                boxSizing: "border-box",
                fontSize: fsChip * k,
                fontWeight: 500,
                color: interpolateColors(on, [0, 1], [p.ink2, p.ink]),
                whiteSpace: "nowrap",
                transform: `scale(${1 - 0.03 * bump(T.click) * (i === 2 ? 1 : 0)})`,
              }}
            >
              {c.t}
            </div>
          );
        })}

        {/* month */}
        <div style={{ ...abs(L.gridL + 10, L.monthY, 7 * L.cell - 80, 24), fontSize: 16 * k, fontWeight: 500, color: p.ink, whiteSpace: "nowrap", lineHeight: `${24 * k}px` }}>{p.month}</div>
        {chev(L.gridL + 7 * L.cell - 66, false)}
        {chev(L.gridL + 7 * L.cell - 34, true)}

        {/* range layers: bands, then caps */}
        {ranges.map((r) => (
          <React.Fragment key={`band${r.s}`}>{bandRows(r)}</React.Fragment>
        ))}
        {ranges.map((r) => (
          <React.Fragment key={`cap${r.s}`}>
            {capDiv("s", r.s, r.capS, r.on)}
            {capDiv("e", r.end, r.capE, r.on)}
          </React.Fragment>
        ))}

        {/* weekdays + day numbers */}
        <svg width={L.cw * k} height={L.ch * k} style={{ position: "absolute", left: 0, top: 0 }}>
          {WEEKDAYS.map((w, i) => (
            <text key={w} x={(L.gridL + i * L.cell + L.cell / 2) * k} y={(L.monthY + 50) * k} textAnchor="middle" fontFamily={FONT_MONO} fontSize={11 * k} letterSpacing={`${0.1 * 11 * k}`} fill={p.ink3}>
              {w}
            </text>
          ))}
          {cells.map((c) => (
            <text key={c.i} x={cellX(c.i) * k} y={(cellY(c.i) + 5.5) * k} textAnchor="middle" fontFamily={FONT_SANS} fontSize={16 * k} fontWeight={c.weight} fill={c.color}>
              {`${c.day}`}
            </text>
          ))}
          <circle cx={cellX(idx(cal.today)) * k} cy={(cellY(idx(cal.today)) + 14) * k} r={2.2 * k} fill={interpolateColors(capOn(idx(cal.today)), [0, 1], [p.accent, p.onAccent])} />
        </svg>

        {/* cursor */}
        <svg
          width={30 * u}
          height={41 * u}
          viewBox="0 0 16 22"
          style={{ position: "absolute", left: cur[0] * k - 2 * u, top: cur[1] * k - 2 * u, overflow: "visible", transformOrigin: "0 0", transform: `scale(${1 - 0.12 * press})` }}
        >
          <path d="M1 1V17.4L5.1 13.6 7.9 20.2 10.7 19 7.9 12.5H13.6Z" fill={p.ink} stroke={p.card} strokeWidth={1.3} strokeLinejoin="round" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
