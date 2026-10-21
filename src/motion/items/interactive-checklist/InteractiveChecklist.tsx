import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STROKE, mix, progress, useLayout } from "../../kit";
import type { Ratio } from "../../types";

export type InteractiveChecklistProps = {
  background: string;
  card: string;
  fill: string;
  line: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  onAccent: string;
  title: string;
  doneTitle: string;
  task1: string;
  task2: string;
  task3: string;
  task4: string;
  task5: string;
};

// ---------- geometry (design px; k = scale × u) ----------
export const SCALE: Record<Ratio, number> = { "16:9": 1.85, "1:1": 1.6, "9:16": 1.7 };
export const CW = 540;
export const PAD = 32;
export const TITLE_TOP = 30;
export const TITLE_H = 30;
export const SUB_TOP = 66;
export const BAR_TOP = 128;
export const LIST_TOP = 152;
export const ROW_H = 50;
export const CH = LIST_TOP + ROW_H * 5 + 14;
export const BOX = 22;
export const INITIALS = ["SK", "MR", "AL", "JP", "DN"];

// ---------- timeline (180-frame loop) ----------
export const CHECKS = [26, 44, 62, 80, 98]; // click frames
export const CHECK_LEN = 14; // spring scale of each box
export const STRIKE_LEN = 12;
export const BAR_LEN = 14;
export const T = { firstA: 8, homeA: 106, homeB: 126, swapA: 106, swapB: 124, resetA: 138, resetB: 156, swapBackB: 154 } as const;

export const isDark = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  if (Number.isNaN(n)) return false;
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.4;
};
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
type Pt = [number, number];
const glide = (a: Pt, b: Pt, t: number): Pt => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const bow = Math.sin(Math.PI * clamp01(t)) * 0.06;
  return [a[0] + dx * t - dy * bow, a[1] + dy * t + dx * bow];
};

export const InteractiveChecklist: React.FC<InteractiveChecklistProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, ratio } = useLayout();
  const k = SCALE[ratio] * u;
  const dark = isDark(p.background);
  const hair = Math.max(1, u);
  const tasks = [p.task1, p.task2, p.task3, p.task4, p.task5];
  const n = tasks.length;

  // ---- per-task state; the reset unticks bottom-up, 3 frames apart
  const off = (i: number) => progress(frame, T.resetA + 3 * (n - 1 - i), T.resetA + 3 * (n - 1 - i) + 12, "exit");
  const box = (i: number) => (frame < T.resetA ? progress(frame, CHECKS[i] + 1, CHECKS[i] + 1 + CHECK_LEN, "spring") : 1 - off(i));
  const tick = (i: number) => (frame < T.resetA ? progress(frame, CHECKS[i] + 3, CHECKS[i] + 13, "travel") : 1 - off(i));
  const strike = (i: number) => (frame < T.resetA ? progress(frame, CHECKS[i] + 3, CHECKS[i] + 3 + STRIKE_LEN, "enter") : 1 - off(i));
  const reset = progress(frame, T.resetA, T.resetB, "travel");
  const bar = (CHECKS.reduce((a, c) => a + progress(frame, c + 2, c + 2 + BAR_LEN, "travel"), 0) / n) * (1 - reset);
  const swap = frame < T.resetA ? progress(frame, T.swapA, T.swapB, "enter") : 1 - progress(frame, T.resetA, T.swapBackB, "travel");

  // ---- count: the latest change slides the old value up and the new one in from below
  let from = 0;
  let to = 0;
  let ct = 1;
  if (frame >= T.resetA) {
    from = n;
    to = 0;
    ct = progress(frame, T.resetA + 2, T.resetA + 12, "travel");
  } else {
    const done = CHECKS.filter((c) => frame >= c + 2).length;
    if (done > 0) {
      from = done - 1;
      to = done;
      ct = progress(frame, CHECKS[done - 1] + 2, CHECKS[done - 1] + 10, "enter");
    }
  }

  // ---- cursor (card coords): rest → each checkbox in turn → rest
  const boxPt = (i: number): Pt => [PAD + BOX / 2 + 2, LIST_TOP + ROW_H * i + ROW_H / 2 + 3];
  const P0: Pt = [CW * 0.78, CH + 34];
  let cur: Pt = P0;
  if (frame >= T.homeA) cur = glide(boxPt(n - 1), P0, progress(frame, T.homeA, T.homeB, "travel"));
  else {
    for (let i = 0; i < n; i++) {
      const a = i === 0 ? T.firstA : CHECKS[i - 1] + 6;
      if (frame >= a) cur = glide(i === 0 ? P0 : boxPt(i - 1), boxPt(i), progress(frame, a, CHECKS[i] - 3, "travel"));
    }
  }
  const bump = (at: number) => interpolate(frame, [at - 3, at, at + 4], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const press = Math.max(...CHECKS.map(bump));

  const abs = (l: number, t: number, w: number, h: number): React.CSSProperties => ({ position: "absolute", left: l * k, top: t * k, width: w * k, height: h * k });
  const shadow = dark ? "none" : `0 ${u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)`;
  const titleStyle: React.CSSProperties = { position: "absolute", left: 0, top: 0, fontSize: 24 * k, lineHeight: `${TITLE_H * k}px`, fontWeight: 500, letterSpacing: "-0.03em", color: p.ink, whiteSpace: "nowrap" };
  const countStyle: React.CSSProperties = { position: "absolute", right: 0, top: 0, lineHeight: `${16 * k}px` };
  const tickSW = (STROKE.ring * u) / k;

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
        }}
      >
        {/* header: title swaps to the done title on the last check */}
        <div style={{ ...abs(PAD, TITLE_TOP, CW - 2 * PAD, TITLE_H), overflow: "hidden" }}>
          <div style={{ ...titleStyle, opacity: 1 - swap, transform: `translateY(${-swap * TITLE_H * k}px)` }}>{p.title}</div>
          <div style={{ ...titleStyle, opacity: swap, transform: `translateY(${(1 - swap) * TITLE_H * k}px)` }}>{p.doneTitle}</div>
        </div>
        <div style={{ ...abs(PAD, SUB_TOP, CW - 2 * PAD, 18), fontSize: 13 * k, color: p.ink3, whiteSpace: "nowrap" }}>Due Friday, Oct 24</div>

        {/* count */}
        <div style={{ ...abs(CW - PAD - 80, BAR_TOP - 24, 80, 16), overflow: "hidden", fontFamily: FONT_MONO, fontSize: 13 * k, letterSpacing: "0.04em", color: p.ink2, textAlign: "right" }}>
          {ct < 1 ? <span style={{ ...countStyle, opacity: 1 - ct, transform: `translateY(${-ct * 16 * k}px)` }}>{`${from}/${n}`}</span> : null}
          <span style={{ ...countStyle, opacity: ct, transform: `translateY(${(1 - ct) * 16 * k}px)` }}>{`${to}/${n}`}</span>
        </div>
        <div style={{ ...abs(PAD, BAR_TOP - 24, 200, 16), fontFamily: FONT_MONO, fontSize: 11 * k, lineHeight: `${16 * k}px`, letterSpacing: "0.12em", color: p.ink3 }}>PROGRESS</div>

        {/* progress bar */}
        <div style={{ position: "absolute", left: PAD * k, top: BAR_TOP * k, width: (CW - 2 * PAD) * k, height: STROKE.bar * u, borderRadius: 999, background: p.fill, overflow: "hidden" }}>
          <div style={{ width: `${bar * 100}%`, height: "100%", borderRadius: 999, background: p.accent }} />
        </div>

        {/* tasks */}
        {tasks.map((task, i) => {
          const on = box(i);
          const tk = tick(i);
          const st = strike(i);
          return (
            <div key={i} style={{ ...abs(PAD, LIST_TOP + ROW_H * i, CW - 2 * PAD, ROW_H), display: "flex", alignItems: "center", gap: 16 * k }}>
              {i > 0 ? <div style={{ position: "absolute", left: (BOX + 16) * k, right: 0, top: 0, height: hair, background: p.line }} /> : null}
              <div style={{ position: "relative", width: BOX * k, height: BOX * k, flexShrink: 0 }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: RADIUS.chip * u, border: `${STROKE.ring * u}px solid ${p.ink3}`, boxSizing: "border-box", opacity: 1 - clamp01(on) }} />
                <div style={{ position: "absolute", inset: 0, borderRadius: RADIUS.chip * u, background: p.accent, opacity: clamp01(on * 2), transform: `scale(${mix(0.5, 1, on)})` }} />
                <svg width={BOX * k} height={BOX * k} viewBox="0 0 22 22" style={{ position: "absolute", left: 0, top: 0 }}>
                  <path d="M6 11.4 9.4 14.7 16 7.6" fill="none" stroke={p.onAccent} strokeWidth={tickSW} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={15} strokeDashoffset={15 * (1 - tk)} opacity={tk > 0 ? 1 : 0} />
                </svg>
              </div>
              <span style={{ position: "relative", flex: "0 1 auto", minWidth: 0, fontSize: 17 * k, letterSpacing: "-0.01em", color: interpolateColors(st, [0, 1], [p.ink, p.ink3]), whiteSpace: "nowrap" }}>
                {task}
                <span style={{ position: "absolute", left: 0, top: "54%", height: Math.max(1, STROKE.hair * u), width: `${st * 100}%`, background: p.ink3 }} />
              </span>
              <span style={{ flex: 1 }} />
              <span
                style={{
                  width: 30 * k,
                  height: 30 * k,
                  borderRadius: 999,
                  background: p.fill,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11 * k,
                  fontWeight: 500,
                  color: p.ink2,
                  opacity: mix(1, 0.6, st),
                }}
              >
                {INITIALS[i]}
              </span>
            </div>
          );
        })}

        {/* cursor */}
        <svg
          width={16 * u * 2.2}
          height={22 * u * 2.2}
          viewBox="0 0 16 22"
          style={{ position: "absolute", left: cur[0] * k - u, top: cur[1] * k - u, overflow: "visible", transformOrigin: "0 0", transform: `scale(${1 - 0.12 * press})`, zIndex: 5 }}
        >
          <path d="M1 1V17.4L5.1 13.6 7.9 20.2 10.7 19 7.9 12.5H13.6Z" fill={p.ink} stroke={p.card} strokeWidth={1.3} strokeLinejoin="round" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
