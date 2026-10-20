import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { FONT_SANS, RADIUS, STROKE, progress, useLayout } from "../../kit";

export type CopyConfirmationProps = {
  background: string;
  fill: string;
  line: string;
  ink: string;
  ink2: string;
  accent: string;
  success: string;
  label: string;
  value: string;
  copied: string;
  ease: string;
};

// ---------- geometry (px at 1080 on the short side) ----------
export const GEO = {
  "16:9": { w: 1180, h: 144, font: 64, label: 32, btn: 104, pad: 48, icon: 44, labelGap: 28 },
  "1:1": { w: 880, h: 120, font: 48, label: 28, btn: 88, pad: 36, icon: 36, labelGap: 24 },
  "9:16": { w: 880, h: 120, font: 48, label: 28, btn: 88, pad: 36, icon: 36, labelGap: 24 },
} as const;
export const SHOW = 16; // characters of the id shown before the ellipsis

// ---------- timeline (frames of a 150-frame loop) ----------
export const T = {
  toBtn: [6, 28], hoverIn: [22, 30], click: 34,
  valueOut: [35, 47], copiedIn: [38, 58], copyIconOut: [35, 47], checkIn: [40, 60],
  hoverOut: [60, 68], toRest: [62, 92],
  copiedOut: [100, 114], valueIn: [104, 124], checkOut: [100, 112], copyIconIn: [106, 124],
} as const;

export const shownValue = (v: string) => (v.length > SHOW ? `${v.slice(0, SHOW)}…` : v);

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
type Pt = [number, number];
const glide = (a: Pt, b: Pt, t: number): Pt => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const bow = Math.sin(Math.PI * clamp01(t)) * 0.08;
  return [a[0] + dx * t - dy * bow, a[1] + dy * t + dx * bow];
};

export const CopyConfirmation: React.FC<CopyConfirmationProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, u, ratio } = useLayout();
  const g = GEO[ratio];
  const seg = (a: readonly [number, number], ease: string) => progress(frame, a[0], a[1], ease);

  // ---- layout
  const W = g.w * u;
  const H = g.h * u;
  const labelH = g.label * u * 1.3;
  const blockH = labelH + g.labelGap * u + H;
  const left = (width - W) / 2;
  const top = (height - blockH) / 2;
  const fieldTop = top + labelH + g.labelGap * u;
  const btn = g.btn * u;
  const btnInset = (H - btn) / 2;
  const btnLeft = left + W - btnInset - btn;

  // ---- state
  const valueO = frame < T.valueIn[0] ? 1 - seg(T.valueOut, "exit") : seg(T.valueIn, p.ease);
  const valueDir = frame < T.valueIn[0] ? -1 : 1; // leaves upward, returns from below
  const copiedO = frame < T.copiedOut[0] ? seg(T.copiedIn, p.ease) : 1 - seg(T.copiedOut, "exit");
  const copiedDir = frame < T.copiedOut[0] ? 1 : -1;
  const copyO = frame < T.copyIconIn[0] ? 1 - seg(T.copyIconOut, "exit") : seg(T.copyIconIn, p.ease);
  const checkDraw = seg(T.checkIn, p.ease);
  const checkO = frame < T.checkOut[0] ? Math.min(1, checkDraw * 3) : 1 - seg(T.checkOut, "exit");
  const hover = clamp01(seg(T.hoverIn, "enter") - seg(T.hoverOut, "exit"));
  const press = interpolate(frame, [T.click - 3, T.click, T.click + 6], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // ---- cursor
  const rest: Pt = [left + W * 0.78, fieldTop + H + 120 * u];
  const onBtn: Pt = [btnLeft + btn * 0.55, fieldTop + btnInset + btn * 0.6];
  let cur: Pt = rest;
  if (frame >= T.toBtn[0]) cur = glide(rest, onBtn, progress(frame, T.toBtn[0], T.toBtn[1], "travel"));
  if (frame >= T.toRest[0]) cur = glide(onBtn, rest, progress(frame, T.toRest[0], T.toRest[1], "travel"));

  const hair = Math.max(1, u);
  const iconPx = g.icon * u;
  const sw = (STROKE.ring * u * 24) / iconPx;
  const shift = g.font * u * 0.5;
  const textStyle = (o: number, dir: number): React.CSSProperties => ({
    position: "absolute",
    left: g.pad * u,
    top: 0,
    height: H,
    display: "flex",
    alignItems: "center",
    whiteSpace: "nowrap",
    opacity: o,
    transform: `translateY(${(1 - o) * shift * dir}px)`,
    filter: o < 0.99 ? `blur(${(1 - o) * 8 * u}px)` : undefined,
  });

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS }}>
      {/* label row */}
      <div style={{ position: "absolute", left, top, height: labelH, display: "flex", alignItems: "center", gap: 12 * u, fontSize: g.label * u, fontWeight: 500, color: p.ink2, whiteSpace: "nowrap" }}>
        <svg width={g.label * u} height={g.label * u} viewBox="0 0 24 24" fill="none" stroke={p.accent} strokeWidth={(STROKE.ring * u * 24) / (g.label * u)} strokeLinecap="round">
          <path d="M9.5 4 7.5 20M16.5 4l-2 16M4.5 9h16M3.5 15h16" />
        </svg>
        <span>{p.label}</span>
      </div>

      {/* field: never changes size */}
      <div style={{ position: "absolute", left, top: fieldTop, width: W, height: H, borderRadius: RADIUS.button * u, background: p.fill, boxShadow: `inset 0 0 0 ${hair}px ${p.line}`, overflow: "hidden" }}>
        {valueO > 0.001 ? (
          <div style={{ ...textStyle(valueO, valueDir), fontSize: g.font * u, fontWeight: 400, letterSpacing: "-0.02em", color: p.ink }}>{shownValue(p.value)}</div>
        ) : null}
        {copiedO > 0.001 ? (
          <div style={{ ...textStyle(copiedO, copiedDir), fontSize: g.font * u, fontWeight: 500, letterSpacing: "-0.02em", color: p.ink }}>{p.copied}</div>
        ) : null}

        {/* copy button */}
        <div
          style={{
            position: "absolute",
            left: W - btnInset - btn,
            top: btnInset,
            width: btn,
            height: btn,
            borderRadius: RADIUS.button * u,
            background: interpolateColors(0.07, [0, 1], [p.fill, p.ink]),
            opacity: hover,
            transform: `scale(${1 - 0.08 * press})`,
          }}
        />
        <svg
          width={iconPx}
          height={iconPx}
          viewBox="0 0 24 24"
          fill="none"
          stroke={p.ink2}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ position: "absolute", left: W - btnInset - btn / 2 - iconPx / 2, top: H / 2 - iconPx / 2, opacity: copyO, transform: `scale(${0.6 + 0.4 * copyO - 0.08 * press})` }}
        >
          <rect x={9} y={9} width={11} height={11} rx={2} />
          <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" />
        </svg>
        <svg
          width={iconPx}
          height={iconPx}
          viewBox="0 0 24 24"
          fill="none"
          stroke={p.success}
          strokeWidth={sw * 1.1}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ position: "absolute", left: W - btnInset - btn / 2 - iconPx / 2, top: H / 2 - iconPx / 2, opacity: checkO }}
        >
          <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - checkDraw} />
        </svg>
      </div>

      {/* cursor */}
      <svg
        width={30 * u}
        height={41 * u}
        viewBox="0 0 16 22"
        style={{ position: "absolute", left: cur[0], top: cur[1], overflow: "visible", transformOrigin: "0 0", transform: `scale(${1 - 0.12 * press})` }}
      >
        <path d="M1 1V17.4L5.1 13.6 7.9 20.2 10.7 19 7.9 12.5H13.6Z" fill={p.ink} stroke={p.background} strokeWidth={1.3} strokeLinejoin="round" />
      </svg>
    </AbsoluteFill>
  );
};
