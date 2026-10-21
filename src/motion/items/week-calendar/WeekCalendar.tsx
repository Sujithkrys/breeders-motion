import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STROKE, alpha, progress, useLayout } from "../../kit";
import type { Ratio } from "../../types";

export type WeekCalendarProps = {
  background: string;
  card: string;
  fill: string;
  line: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  onAccent: string;
  week: string; // "Oct 19 – 23, 2026"
  newTitle: string;
  stagger: number; // frames between events dropping in
  ease: string;
};

// ---------- geometry (design px; k = scale × u) ----------
export const GEO: Record<Ratio, { cw: number; from: number; to: number; hourH: number; scale: number }> = {
  "16:9": { cw: 780, from: 9, to: 17, hourH: 50, scale: 1.6 },
  "1:1": { cw: 600, from: 9, to: 17, hourH: 46, scale: 1.55 },
  "9:16": { cw: 600, from: 8, to: 18, hourH: 62, scale: 1.55 },
};
export const PAD = 24;
export const GUTTER = 56;
export const DAYS_Y = 66;
export const GRID_Y = 124;
export const TODAY = 3; // Thursday
export const DAY_NAMES = ["MON", "TUE", "WED", "THU", "FRI"];

// ---------- the week ----------
export type CalEvent = { d: number; a: number; b: number; t: string; accent?: boolean };
export const EVENTS: CalEvent[] = [
  { d: 0, a: 9, b: 10, t: "Weekly sync" },
  { d: 1, a: 10.5, b: 12, t: "Roadmap review", accent: true },
  { d: 2, a: 9.5, b: 10.5, t: "1:1 with Maya" },
  { d: 0, a: 13, b: 14.5, t: "Customer call" },
  { d: 4, a: 11, b: 12, t: "Launch prep", accent: true },
  { d: 2, a: 14, b: 15.5, t: "Focus time" },
  { d: 1, a: 15, b: 16, t: "Hiring loop" },
];
export const DRAFT = { d: 3, a: 14, b: 15.5 } as const;
export const NOW = { from: 11 + 18 / 60, to: 11 + 30 / 60 } as const; // the now line drifts 12 minutes over the loop

// ---------- timeline (180-frame loop) ----------
export const T = {
  nowIn: 14, dropA: 8, drop: 20,
  inA: 52, inB: 68, press: 70, dragA: 72, dragB: 96, release: 98,
  typeA: 102, typeEnd: 138, commit: 140, homeA: 104, homeB: 124,
  exitA: 150, exitB: 164,
} as const;

export const hourText = (h: number) => {
  const hh = Math.floor(h + 1e-6);
  const mm = Math.round((h - hh) * 60);
  const h12 = ((hh + 11) % 12) + 1;
  return mm === 0 ? `${h12}` : `${h12}:${String(mm).padStart(2, "0")}`;
};
export const ampm = (h: number) => (Math.floor(h + 1e-6) >= 12 ? "PM" : "AM");
export const span = (a: number, b: number) => `${hourText(a)} – ${hourText(b)} ${ampm(b)}`;
export const clock = (h: number) => `${hourText(h)} ${ampm(h)}`;
export const firstDay = (week: string) => {
  const m = week.match(/\d{1,2}/);
  const n = m ? Number(m[0]) : 19;
  return n >= 1 && n <= 31 ? n : 19;
};

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

export const WeekCalendar: React.FC<WeekCalendarProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, ratio } = useLayout();
  const g = GEO[ratio];
  const k = g.scale * u;
  const dark = isDark(p.background);
  const hair = Math.max(1, u);
  const hours = g.to - g.from;
  const CW = g.cw;
  const CH = GRID_Y + hours * g.hourH + 20;
  const colW = (CW - 2 * PAD - GUTTER) / 5;
  const colX = (d: number) => PAD + GUTTER + d * colW;
  const yOf = (h: number) => GRID_Y + (h - g.from) * g.hourH;
  const st = Math.min(6, Math.max(2, Math.round(Number(p.stagger) || 5)));
  const day0 = firstDay(p.week);
  const bump = (c: number) => interpolate(frame, [c - 3, c, c + 5], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const exit = 1 - progress(frame, T.exitA, T.exitB, "exit");
  const nowOn = progress(frame, 0, T.nowIn, "enter") * exit;
  const nowH = NOW.from + (NOW.to - NOW.from) * (frame / 180);
  const nowY = yOf(nowH);
  const nowLabel = `${hourText(Math.floor(nowH))}:${String(Math.floor((nowH % 1) * 60)).padStart(2, "0")}`;

  // ---- cursor + the drafted event
  const top = yOf(DRAFT.a);
  const minB = top + g.hourH * 0.25;
  const dragT = progress(frame, T.dragA, T.dragB, "travel");
  const bottom = frame < T.dragA ? minB : minB + (yOf(DRAFT.b) - minB) * dragT;
  const grabX = colX(DRAFT.d) + colW * 0.55;
  const home: Pt = [CW * 0.84, CH + 26];
  const startPt: Pt = [grabX, minB + 2];
  const endPt: Pt = [grabX, yOf(DRAFT.b) + 2];
  let cur: Pt = home;
  if (frame >= T.homeA) cur = glide(endPt, home, progress(frame, T.homeA, T.homeB, "travel"));
  else if (frame >= T.dragA) cur = [grabX, bottom + 2];
  else if (frame >= T.press) cur = startPt;
  else if (frame >= T.inA) cur = glide(home, startPt, progress(frame, T.inA, T.inB, "travel"));
  const held = frame >= T.press && frame <= T.release ? 0.5 : 0;
  const press = Math.max(held, bump(T.press), bump(T.release));
  const draftIn = progress(frame, T.press, T.press + 10, "spring");
  const draftOn = frame >= T.press ? exit : 0;
  const snapped = Math.max(DRAFT.a + 0.25, Math.round(((bottom - GRID_Y) / g.hourH + g.from) * 4) / 4);
  const title = p.newTitle;
  const typed = Math.max(0, Math.min(title.length, Math.floor(((frame - T.typeA) / Math.max(1, T.typeEnd - T.typeA)) * (title.length + 0.999))));
  const editing = frame >= T.release && frame < T.commit;
  const caretOn = editing && frame >= T.typeA - 2 && (frame <= T.typeEnd || Math.floor(frame / 8) % 2 === 0);
  const ring = clamp01(progress(frame, T.press, T.press + 6, "enter") - progress(frame, T.commit, T.commit + 12, "exit"));

  const abs = (l: number, t: number, w: number, h: number): React.CSSProperties => ({ position: "absolute", left: l * k, top: t * k, width: w * k, height: h * k });
  const tint = alpha(p.accent, dark ? 0.2 : 0.12);

  const block = (key: string, e: { d: number; a: number; b: number }, label: string, time: string, accent: boolean, style: React.CSSProperties, extra?: React.ReactNode) => {
    const x = colX(e.d) + 3;
    const y = yOf(e.a) + 2;
    return (
      <div
        key={key}
        style={{
          ...abs(x, y, colW - 6, (e.b - e.a) * g.hourH - 4),
          borderRadius: RADIUS.chip * u,
          background: accent ? tint : p.fill,
          overflow: "hidden",
          boxSizing: "border-box",
          padding: `${6 * k}px ${8 * k}px ${6 * k}px ${(accent ? 11 : 8) * k}px`,
          ...style,
        }}
      >
        {accent ? <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: STROKE.bar * u, background: p.accent }} /> : null}
        <div style={{ display: "flex", alignItems: "center", height: 16 * k, fontSize: 12.5 * k, fontWeight: 500, color: p.ink, whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>
          {label !== "" ? <span>{label}</span> : null}
          {extra}
        </div>
        <div style={{ fontSize: 11 * k, color: p.ink2, whiteSpace: "nowrap", marginTop: 2 * k }}>{time}</div>
      </div>
    );
  };

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
        {/* title row */}
        <div style={{ ...abs(PAD + 4, 22, CW - 2 * PAD - 90, 28), fontSize: 20 * k, fontWeight: 500, letterSpacing: "-0.02em", color: p.ink, whiteSpace: "nowrap", lineHeight: `${28 * k}px` }}>{p.week}</div>
        <svg style={{ ...abs(CW - PAD - 64, 22, 64, 28) }} viewBox="0 0 64 28">
          <path d="M22 9l-5 5 5 5M42 9l5 5-5 5" fill="none" stroke={p.ink2} strokeWidth={(STROKE.ring * u) / k} strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* grid, day headers and hour labels: one SVG */}
        <svg width={CW * k} height={CH * k} style={{ position: "absolute", left: 0, top: 0 }}>
          {Array.from({ length: hours + 1 }, (_, i) => (
            <line key={`h${i}`} x1={(PAD + GUTTER) * k} x2={(CW - PAD) * k} y1={yOf(g.from + i) * k} y2={yOf(g.from + i) * k} stroke={p.line} strokeWidth={STROKE.hair * u} />
          ))}
          {Array.from({ length: 6 }, (_, i) => (
            <line key={`v${i}`} x1={colX(i) * k} x2={colX(i) * k} y1={(DAYS_Y + 6) * k} y2={yOf(g.to) * k} stroke={p.line} strokeWidth={STROKE.hair * u} />
          ))}
          {Array.from({ length: hours }, (_, i) => (
            <text key={`l${i}`} x={(PAD + GUTTER - 10) * k} y={(yOf(g.from + i) + 4) * k} textAnchor="end" fontFamily={FONT_MONO} fontSize={10.5 * k} letterSpacing={`${0.04 * 10.5 * k}`} fill={p.ink3}>
              {clock(g.from + i)}
            </text>
          ))}
          {DAY_NAMES.map((n, i) => (
            <text key={n} x={(colX(i) + 10) * k} y={(DAYS_Y + 26) * k} fontFamily={FONT_MONO} fontSize={11 * k} letterSpacing={`${0.1 * 11 * k}`} fill={p.ink3}>
              {n}
            </text>
          ))}
          {DAY_NAMES.map((n, i) =>
            i === TODAY ? (
              <circle key={`c${n}`} cx={(colX(i) + 10 + 32 + 13) * k} cy={(DAYS_Y + 22) * k} r={13 * k} fill={p.accent} />
            ) : null,
          )}
          {DAY_NAMES.map((n, i) => (
            <text key={`d${n}`} x={(colX(i) + 10 + 32 + 13) * k} y={(DAYS_Y + 27.5) * k} textAnchor="middle" fontFamily={FONT_SANS} fontSize={15 * k} fontWeight={500} fill={i === TODAY ? p.onAccent : p.ink}>
              {`${day0 + i}`}
            </text>
          ))}
        </svg>

        {/* events drop in one by one */}
        {EVENTS.map((e, i) => {
          const a = T.dropA + i * st;
          const t = progress(frame, a, a + T.drop, p.ease);
          const o = clamp01(t * 1.6) * exit;
          if (o <= 0.001) return null;
          return block(`e${i}`, e, e.t, span(e.a, e.b), !!e.accent, { opacity: o, transform: `translateY(${-(1 - t) * 24 * k}px)` });
        })}

        {/* the drafted event: grows with the drag, then its title types in */}
        {draftOn > 0.001
          ? block(
              "draft",
              { d: DRAFT.d, a: DRAFT.a, b: DRAFT.a + (bottom - top + 4) / g.hourH },
              title.slice(0, typed),
              span(DRAFT.a, snapped),
              true,
              {
                opacity: draftOn * clamp01(draftIn * 1.5),
                transform: `scale(${0.94 + 0.06 * draftIn})`,
                transformOrigin: "50% 0%",
                boxShadow: `inset 0 0 0 ${STROKE.ring * u}px ${alpha(p.accent, ring)}`,
              },
              caretOn ? <span style={{ display: "inline-block", width: Math.max(1.5, STROKE.hair) * u, height: 14 * k, marginLeft: typed > 0 ? 1 * k : 0, background: p.accent }} /> : null,
            )
          : null}

        {/* now line */}
        {nowOn > 0.001 ? (
          <svg width={CW * k} height={CH * k} style={{ position: "absolute", left: 0, top: 0, opacity: nowOn, overflow: "visible" }}>
            <line x1={(PAD + GUTTER) * k} x2={(CW - PAD) * k} y1={nowY * k} y2={nowY * k} stroke={alpha(p.accent, 0.3)} strokeWidth={STROKE.hair * u} />
            <line x1={colX(TODAY) * k} x2={colX(TODAY + 1) * k} y1={nowY * k} y2={nowY * k} stroke={p.accent} strokeWidth={STROKE.ring * u} strokeLinecap="round" />
            <circle cx={colX(TODAY) * k} cy={nowY * k} r={4 * k} fill={p.accent} />
            <text x={(PAD + GUTTER - 10) * k} y={(nowY + 3.5) * k} textAnchor="end" fontFamily={FONT_MONO} fontSize={10.5 * k} fill={p.accent}>
              {nowLabel}
            </text>
          </svg>
        ) : null}

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
