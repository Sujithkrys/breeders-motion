import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STROKE, mix, progress, useLayout } from "../../kit";
import type { Ratio } from "../../types";

export type TaskTabsProps = {
  background: string;
  card: string;
  fill: string;
  line: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  onAccent: string;
  date: string;
  group: string;
  task: string; // the task the cursor checks
  todoLabel: string;
  doneLabel: string;
  todoCount: number;
  ease: string;
};

// ---------- geometry (design px; k = scale × u) ----------
export const SCALE: Record<Ratio, number> = { "16:9": 2.1, "1:1": 1.6, "9:16": 1.65 };
export const CW = 560;
export const CH = 404;
export const PAD = 28;
export const TABS_TOP = 62;
export const TABS_H = 48;
export const LIST_TOP = 132;
export const HEAD_H = 34;
export const ROW_H = 42;
const TAB_W = (CW - 2 * PAD - 8) / 4;
export const tabCenter = (i: number) => PAD + 4 + TAB_W * i + TAB_W / 2;

// ---------- timeline (180-frame loop) ----------
export const T = {
  mv1A: 8, mv1B: 24, click1: 27, checkA: 28, checkB: 36, strikeA: 29, strikeB: 43, colA: 46, colB: 64, cnt1A: 52, cnt1B: 60,
  mv2A: 60, mv2B: 76, click2: 79, tab1A: 80, tab1B: 98, out1A: 80, out1B: 92, in1A: 88, in1B: 106,
  mv3A: 100, mv3B: 114, click3: 117, unA: 118, unB: 126, unStrikeB: 130, cnt2A: 120, cnt2B: 128,
  mv4A: 126, mv4B: 140, click4: 143, tab2A: 144, tab2B: 162, out2A: 144, out2B: 156, in2A: 148, in2B: 166,
  homeA: 148, homeB: 166,
} as const;

export const OTHER_TODO = ["Review handoff notes", "Book flights for the offsite"];
export const DONE = ["Update the pricing page", "Send the weekly report", "Plan the Q4 roadmap", "Reply to design feedback"];

const lum = (hex: string) => {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const n = parseInt(f, 16);
  if (Number.isNaN(n)) return 1;
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
};
export const isDark = (hex: string) => lum(hex) < 0.4;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
type Pt = [number, number];
const glide = (a: Pt, b: Pt, t: number): Pt => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const bow = Math.sin(Math.PI * clamp01(t)) * 0.06;
  return [a[0] + dx * t - dy * bow, a[1] + dy * t + dx * bow];
};

// A count that slides up to its new value.
const Count: React.FC<{ from: number; to: number; t: number; k: number; color: string }> = ({ from, to, t, k, color }) => {
  const h = 14 * k;
  const st: React.CSSProperties = { position: "absolute", left: 0, right: 0, textAlign: "center" };
  return (
    <span style={{ position: "relative", display: "inline-block", height: h, lineHeight: `${h}px`, overflow: "hidden", minWidth: 9 * k, fontFamily: FONT_MONO, fontSize: 12 * k, color, verticalAlign: "middle" }}>
      <span style={{ visibility: "hidden" }}>{Math.max(from, to)}</span>
      {t < 1 ? <span style={{ ...st, top: -t * h, opacity: 1 - t }}>{from}</span> : null}
      {t > 0 ? <span style={{ ...st, top: (1 - t) * h, opacity: t }}>{to}</span> : null}
    </span>
  );
};

export const TaskTabs: React.FC<TaskTabsProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, ratio } = useLayout();
  const k = SCALE[ratio] * u;
  const dark = isDark(p.background);
  const hair = Math.max(1, u);
  const shadow = dark ? "none" : `0 ${u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)`;
  const chipShadow = dark ? "none" : `0 ${u}px ${2 * u}px rgba(0,0,0,0.06), 0 ${2 * u}px ${6 * u}px rgba(0,0,0,0.05)`;
  const todo = Math.min(9, Math.max(2, Math.round(Number(p.todoCount) || 3)));
  const done = DONE.length;
  const seg = (a: number, b: number, e: string = p.ease) => progress(frame, a, b, e);
  const bump = (at: number) => interpolate(frame, [at - 3, at, at + 4], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const press = Math.max(bump(T.click1), bump(T.click2), bump(T.click3), bump(T.click4));

  // task state
  const checked = clamp01(seg(T.checkA, T.checkB, "enter") - seg(T.unA, T.unB, "exit"));
  const strike = frame < T.unA ? seg(T.strikeA, T.strikeB, "enter") : 1 - seg(T.unA, T.unStrikeB, "travel");
  const collapse = seg(T.colA, T.colB, "travel");
  const rowFade = 1 - seg(T.colA, T.colA + 12, "exit");
  const tab = clamp01(seg(T.tab1A, T.tab1B) - seg(T.tab2A, T.tab2B)); // 0 = to-do, 1 = completed
  const todoList = frame < T.tab2A ? 1 - seg(T.out1A, T.out1B, "exit") : seg(T.in2A, T.in2B, "enter");
  const doneList = frame < T.tab2A ? seg(T.in1A, T.in1B, "enter") : 1 - seg(T.out2A, T.out2B, "exit");
  // after the round trip the to-do list shows the task restored
  const restored = frame >= T.tab2A;
  const c1 = seg(T.cnt1A, T.cnt1B, "enter");
  const c2 = seg(T.cnt2A, T.cnt2B, "enter");

  // cursor (design coords, relative to the card)
  const P0: Pt = [CW * 0.8, CH * 0.86];
  const box = (rowTop: number): Pt => [PAD + 12 + 3, rowTop + ROW_H / 2 + 4];
  const Ptask = box(LIST_TOP + HEAD_H + ROW_H);
  const Pdone = box(LIST_TOP + HEAD_H);
  const tabPt = (i: number): Pt => [tabCenter(i) + 4, TABS_TOP + TABS_H / 2 + 6];
  let cur: Pt = P0;
  if (frame >= T.homeA) cur = glide(tabPt(0), P0, seg(T.homeA, T.homeB, "travel"));
  else if (frame >= T.mv4A) cur = glide(Pdone, tabPt(0), seg(T.mv4A, T.mv4B, "travel"));
  else if (frame >= T.mv3A) cur = glide(tabPt(1), Pdone, seg(T.mv3A, T.mv3B, "travel"));
  else if (frame >= T.mv2A) cur = glide(Ptask, tabPt(1), seg(T.mv2A, T.mv2B, "travel"));
  else if (frame >= T.mv1A) cur = glide(P0, Ptask, seg(T.mv1A, T.mv1B, "travel"));

  const abs = (left: number, top: number, width: number, height: number): React.CSSProperties => ({ position: "absolute", left: left * k, top: top * k, width: width * k, height: height * k });

  const check = (on: number) => (
    <div style={{ position: "relative", width: 20 * k, height: 20 * k, flexShrink: 0 }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: RADIUS.chip * u, border: `${STROKE.ring * u}px solid ${p.ink3}`, boxSizing: "border-box", opacity: 1 - on * 0.999 }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: RADIUS.chip * u, background: p.accent, opacity: on, transform: `scale(${mix(0.6, 1, on)})` }} />
      <svg width={20 * k} height={20 * k} viewBox="0 0 20 20" style={{ position: "absolute", left: 0, top: 0, opacity: on }}>
        <path d="M5.5 10.4 8.6 13.4 14.6 6.8" fill="none" stroke={p.onAccent} strokeWidth={(STROKE.ring * u) / k} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={14} strokeDashoffset={14 * (1 - on)} />
      </svg>
    </div>
  );

  const row = (key: string, text: string, on: number, strikeT: number, height: number = ROW_H, opacity = 1) => (
    <div key={key} style={{ height: height * k, overflow: "hidden", opacity, display: "flex", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 * k, height: ROW_H * k, flexShrink: 0, paddingLeft: 2 * k }}>
        {check(on)}
        <span style={{ position: "relative", fontSize: 15 * k, color: interpolateColors(strikeT, [0, 1], [p.ink, p.ink3]), whiteSpace: "nowrap" }}>
          {text}
          <span style={{ position: "absolute", left: 0, top: "52%", height: Math.max(1, STROKE.hair * u), width: `${strikeT * 100}%`, background: p.ink3 }} />
        </span>
      </div>
    </div>
  );

  const head = (key: string, label: string) => (
    <div key={key} style={{ height: HEAD_H * k, display: "flex", alignItems: "center", gap: 8 * k, fontSize: 14 * k, fontWeight: 500, color: p.ink, whiteSpace: "nowrap" }}>
      <svg width={14 * k} height={14 * k} viewBox="0 0 14 14">
        <path d="M3.5 5.5 7 9l3.5-3.5" fill="none" stroke={p.ink2} strokeWidth={STROKE.hair} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </div>
  );

  const tabs: { label: string; node: React.ReactNode }[] = [
    { label: p.todoLabel, node: <Count from={c2 > 0 ? todo - 1 : todo} to={c2 > 0 ? todo : todo - 1} t={c2 > 0 ? c2 : c1} k={k} color={p.ink3} /> },
    { label: p.doneLabel, node: <Count from={c2 > 0 ? done + 1 : done} to={c2 > 0 ? done : done + 1} t={c2 > 0 ? c2 : c1} k={k} color={p.ink3} /> },
    { label: "Pending", node: <span style={{ fontFamily: FONT_MONO, fontSize: 12 * k, color: p.ink3 }}>1</span> },
    { label: "On hold", node: <span style={{ fontFamily: FONT_MONO, fontSize: 12 * k, color: p.ink3 }}>2</span> },
  ];

  const listShift = (o: number) => `translateY(${(1 - o) * 10 * k}px)`;
  const taskOn = restored ? 0 : checked;
  const taskStrike = restored ? 0 : strike;

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
          boxShadow: shadow,
          color: p.ink,
        }}
      >
        <div style={{ ...abs(PAD, 24, CW - 2 * PAD, 20), fontSize: 13 * k, color: p.ink3, whiteSpace: "nowrap" }}>{p.date}</div>

        {/* tabs */}
        <div style={{ ...abs(PAD, TABS_TOP, CW - 2 * PAD, TABS_H), borderRadius: RADIUS.button * u, background: p.fill }} />
        <div
          style={{
            ...abs(PAD + 4 + TAB_W * tab, TABS_TOP + 4, TAB_W, TABS_H - 8),
            borderRadius: RADIUS.chip * u,
            background: p.card,
            border: dark ? `${hair}px solid ${p.line}` : undefined,
            boxSizing: "border-box",
            boxShadow: chipShadow,
          }}
        />
        {tabs.map((t, i) => {
          const on = clamp01(1 - Math.abs(tab - i));
          return (
            <div key={i} style={{ ...abs(PAD + 4 + TAB_W * i, TABS_TOP + 4, TAB_W, TABS_H - 8), display: "flex", alignItems: "center", justifyContent: "center", gap: 7 * k, whiteSpace: "nowrap" }}>
              <span style={{ fontSize: 14 * k, fontWeight: 500, color: on > 0.5 ? p.ink : p.ink2 }}>{t.label}</span>
              {t.node}
            </div>
          );
        })}

        {/* to-do list */}
        {todoList > 0.001 ? (
          <div style={{ ...abs(PAD, LIST_TOP, CW - 2 * PAD, CH - LIST_TOP - 20), opacity: todoList, transform: listShift(todoList) }}>
            {head("h1", p.group)}
            {row("a", OTHER_TODO[0], 0, 0)}
            {row("b", p.task, taskOn, taskStrike, restored ? ROW_H : ROW_H * (1 - collapse), restored ? 1 : rowFade)}
            {head("h2", "Personal")}
            {row("c", OTHER_TODO[1], 0, 0)}
          </div>
        ) : null}

        {/* completed list */}
        {doneList > 0.001 ? (
          <div style={{ ...abs(PAD, LIST_TOP, CW - 2 * PAD, CH - LIST_TOP - 20), opacity: doneList, transform: listShift(doneList) }}>
            {head("h0", "Today")}
            {row("b", p.task, checked, strike)}
            {DONE.map((d, i) => row(`d${i}`, d, 1, 1))}
          </div>
        ) : null}

        {/* cursor */}
        <svg
          width={16 * k}
          height={22 * k}
          viewBox="0 0 16 22"
          style={{ position: "absolute", left: cur[0] * k - k, top: cur[1] * k - k, overflow: "visible", transformOrigin: "0 0", transform: `scale(${1 - 0.12 * press})`, zIndex: 10 }}
        >
          <path d="M1 1V17.4L5.1 13.6 7.9 20.2 10.7 19 7.9 12.5H13.6Z" fill={p.ink} stroke={p.card} strokeWidth={STROKE.hair} strokeLinejoin="round" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
