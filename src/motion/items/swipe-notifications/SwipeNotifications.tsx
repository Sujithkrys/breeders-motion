import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STROKE, mix, progress, useLayout } from "../../kit";
import type { Ratio } from "../../types";

export type SwipeNotificationsProps = {
  background: string;
  card: string;
  fill: string;
  line: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  error: string;
  onError: string;
  title1: string;
  title2: string;
  title3: string;
  title4: string;
  ease: string;
};

// ---------- geometry (design px; k = scale × u) ----------
export const SCALE: Record<Ratio, number> = { "16:9": 1.78, "1:1": 1.62, "9:16": 1.72 };
export const ROW_W = 560;
export const ROW_H = 92;
export const GAP = 12;
export const STACK_H = 4 * ROW_H + 3 * GAP;
export const REVEAL = 150; // how far the row is swiped before the fling

export const ROWS = [
  { icon: "M5 6.5h14v12.5H5zM5 10.5h14M9 4v4M15 4v4", body: "Room 4B · 30 min with Maya and Leo", time: "NOW", unread: true },
  { icon: "M5 6h14v9.5H10.5L6.5 19v-3.5H5z", body: "“Love the new tiers. Ship it.”", time: "4M", unread: true },
  { icon: "M4.5 6h15v12h-15zM8 10l2.5 2L8 14M12.5 14.5H16", body: "main · 48 checks passed in 2m 14s", time: "12M", unread: false },
  { icon: "M6 18.5V11M11 18.5V6M16 18.5v-5M4 18.5h16", body: "Revenue is up 12% week over week", time: "1H", unread: false },
];
const ARCHIVE = "M4 5.5h16v4H4zM5.5 9.5v9h13v-9M10 13h4";

// ---------- timeline (150-frame loop) ----------
export const T = {
  mv1A: 6, mv1B: 24, grab: 27,
  dragA: 28, dragB: 50,
  flingA: 58, flingB: 72, release: 60,
  mv2A: 62, mv2B: 84,
  panelA: 68, panelB: 82,
  upA: 70, downA: 100, settle: 20,
  newA: 102, newB: 124,
} as const;

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
  const bow = Math.sin(Math.PI * clamp01(t)) * 0.08;
  return [a[0] + dx * t - dy * bow, a[1] + dy * t + dx * bow];
};

export const SwipeNotifications: React.FC<SwipeNotificationsProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, ratio } = useLayout();
  const k = SCALE[ratio] * u;
  const dark = isDark(p.background);
  const hair = Math.max(1, u);
  const titles = [p.title1, p.title2, p.title3, p.title4];

  // ---- the swipe
  const offset =
    frame < T.flingA
      ? -REVEAL * progress(frame, T.dragA, T.dragB, p.ease)
      : mix(-REVEAL, -(ROW_W + 140), progress(frame, T.flingA, T.flingB, "exit"));
  const topGone = frame >= T.flingB && frame < T.newA;
  const entering = frame >= T.newA ? progress(frame, T.newA, T.newB, "enter") : 1;
  const topX = frame >= T.newA ? 0 : offset;
  const panelW = Math.min(ROW_W, Math.max(0, -offset + RADIUS.card));
  const panelOn = frame >= T.grab && frame < T.panelB && panelW > RADIUS.card + 0.5;
  const flingFade = 1 - progress(frame, T.flingA + 4, T.flingB, "exit");
  const panelOut = progress(frame, T.panelA, T.panelB, "exit");

  // ---- the stack closes up, then opens again for the new arrival
  const slotOf = (i: number) =>
    i === 0 ? 0 : i - progress(frame, T.upA + 3 * (i - 1), T.upA + 3 * (i - 1) + T.settle, "spring") + progress(frame, T.downA + 3 * (i - 1), T.downA + 3 * (i - 1) + T.settle, "spring");
  const yOf = (s: number) => s * (ROW_H + GAP);

  // ---- cursor (stack coords)
  const grabPt: Pt = [ROW_W * 0.72, ROW_H * 0.55];
  const P0: Pt = [ROW_W * 0.86, STACK_H + 44];
  const releasePt: Pt = [grabPt[0] + mix(-REVEAL, -(ROW_W + 140), progress(T.release, T.flingA, T.flingB, "exit")), grabPt[1]];
  let cur: Pt = P0;
  if (frame >= T.mv2A) cur = glide(releasePt, P0, progress(frame, T.mv2A, T.mv2B, "travel"));
  else if (frame >= T.release) cur = releasePt;
  else if (frame >= T.grab) cur = [grabPt[0] + offset, grabPt[1]];
  else if (frame >= T.mv1A) cur = glide(P0, grabPt, progress(frame, T.mv1A, T.mv1B, "travel"));
  const press = clamp01(
    interpolate(frame, [T.grab - 3, T.grab], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) -
      interpolate(frame, [T.release, T.release + 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  );

  const abs = (left: number, top: number, width: number, height: number): React.CSSProperties => ({ position: "absolute", left: left * k, top: top * k, width: width * k, height: height * k });
  const shadow = dark ? `inset 0 0 0 ${hair}px ${p.line}` : `inset 0 0 0 ${hair}px ${p.line}, 0 ${u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)`;
  const glyph = 48;

  const row = (i: number, x: number, y: number, extra: React.CSSProperties = {}) => {
    const r = ROWS[i];
    return (
      <div key={`r${i}`} style={{ ...abs(x, y, ROW_W, ROW_H), borderRadius: RADIUS.card * u, background: p.card, boxShadow: shadow, ...extra }}>
        <div style={{ ...abs(20, (ROW_H - glyph) / 2, glyph, glyph), borderRadius: RADIUS.button * u, background: p.fill, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={26 * k} height={26 * k} viewBox="0 0 24 24" fill="none" stroke={p.ink} strokeWidth={(STROKE.ring * u * 24) / (26 * k)} strokeLinecap="round" strokeLinejoin="round">
            <path d={r.icon} />
          </svg>
        </div>
        <div style={{ position: "absolute", left: 84 * k, top: 0, height: ROW_H * k, width: (ROW_W - 84 - 76) * k, display: "flex", flexDirection: "column", justifyContent: "center", gap: 5 * k, whiteSpace: "nowrap", overflow: "hidden" }}>
          <span style={{ fontSize: 16 * k, fontWeight: 500, letterSpacing: "-0.01em", color: p.ink, lineHeight: 1.2 }}>{titles[i]}</span>
          <span style={{ fontSize: 14 * k, color: p.ink2, lineHeight: 1.2 }}>{r.body}</span>
        </div>
        <span style={{ position: "absolute", right: 22 * k, top: 25 * k, fontFamily: FONT_MONO, fontSize: 11 * k, letterSpacing: "0.12em", color: p.ink3, lineHeight: 1 }}>{r.time}</span>
        {r.unread ? <span style={{ position: "absolute", right: 24 * k, top: 54 * k, width: 9 * k, height: 9 * k, borderRadius: 999, background: p.accent }} /> : null}
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div style={{ position: "relative", width: ROW_W * k, height: STACK_H * k }}>
        {/* the archive action behind the top row */}
        {panelOn ? (
          <div
            style={{
              ...abs(ROW_W - panelW, 0, panelW, ROW_H),
              borderRadius: RADIUS.card * u,
              background: p.error,
              overflow: "hidden",
              opacity: 1 - panelOut,
              transform: `scale(${1 - 0.05 * panelOut})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingLeft: Math.min(RADIUS.card, panelW / 2) * k,
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 * k, whiteSpace: "nowrap", opacity: clamp01((panelW - 70) / 60), color: p.onError }}>
              <svg width={22 * k} height={22 * k} viewBox="0 0 24 24" fill="none" stroke={p.onError} strokeWidth={(STROKE.ring * u * 24) / (22 * k)} strokeLinecap="round" strokeLinejoin="round">
                <path d={ARCHIVE} />
              </svg>
              <span style={{ fontSize: 15 * k, fontWeight: 500, letterSpacing: "-0.01em" }}>Archive</span>
            </div>
          </div>
        ) : null}

        {[3, 2, 1].map((i) => row(i, 0, yOf(slotOf(i))))}
        {!topGone ? row(0, topX, (1 - entering) * -48, { opacity: frame >= T.newA ? entering : flingFade, zIndex: 5 }) : null}

        {/* cursor */}
        <svg
          width={16 * k}
          height={22 * k}
          viewBox="0 0 16 22"
          style={{ position: "absolute", left: cur[0] * k - k, top: cur[1] * k - k, overflow: "visible", transformOrigin: "0 0", transform: `scale(${1 - 0.12 * press})`, zIndex: 10 }}
        >
          <path d="M1 1V17.4L5.1 13.6 7.9 20.2 10.7 19 7.9 12.5H13.6Z" fill={p.ink} stroke={p.background} strokeWidth={STROKE.hair} strokeLinejoin="round" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
