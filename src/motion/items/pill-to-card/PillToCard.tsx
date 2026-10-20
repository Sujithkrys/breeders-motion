import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STROKE, mix, progress, useLayout } from "../../kit";
import type { Ratio } from "../../types";

export type PillToCardProps = {
  background: string;
  button: string; // pill and card surface
  onButton: string; // primary text on it
  sub: string; // secondary text on it
  faint: string; // tertiary text on it
  cardLine: string; // hairlines and the close button on it
  ink: string; // cursor
  success: string;
  accent: string;
  label: string;
  from: string;
  to: string;
  eta: string;
  duration: string;
  flown: number; // % of the route flown
  ease: string;
};

// ---------- geometry (design px; k = scale × u) ----------
export const SCALE: Record<Ratio, number> = { "16:9": 3.2, "1:1": 2.45, "9:16": 2.5 };
export const CARD_W = 360;
export const CARD_H = 226;
export const PILL_H = 40;
export const pillWidth = (label: string) => Math.max(110, Math.min(300, label.length * 8.2 + 44));
// route arc (quadratic) in card coordinates
export const ARC = { x0: 112, y0: 110, cx: 180, cy: 70, x1: 248, y1: 110 } as const;

// ---------- timeline (150-frame loop) ----------
export const T = {
  mv1A: 12, mv1B: 30, click1: 33,
  openA: 34, openB: 58,
  contentA: 46, contentLen: 20,
  arcA: 62, arcB: 96,
  mv2A: 94, mv2B: 110, click2: 113,
  outA: 114, outB: 126,
  closeA: 118, closeB: 138,
  mv3A: 120, mv3B: 138,
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
  const bow = Math.sin(Math.PI * clamp01(t)) * 0.06;
  return [a[0] + dx * t - dy * bow, a[1] + dy * t + dx * bow];
};
const quad = (t: number): Pt => {
  const a = 1 - t;
  return [a * a * ARC.x0 + 2 * a * t * ARC.cx + t * t * ARC.x1, a * a * ARC.y0 + 2 * a * t * ARC.cy + t * t * ARC.y1];
};
const quadAngle = (t: number) => {
  const dx = 2 * (1 - t) * (ARC.cx - ARC.x0) + 2 * t * (ARC.x1 - ARC.cx);
  const dy = 2 * (1 - t) * (ARC.cy - ARC.y0) + 2 * t * (ARC.y1 - ARC.cy);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
};
const ARC_LEN = (() => {
  let len = 0;
  let prev = quad(0);
  for (let i = 1; i <= 48; i++) {
    const q = quad(i / 48);
    len += Math.hypot(q[0] - prev[0], q[1] - prev[1]);
    prev = q;
  }
  return len;
})();
const ARC_D = `M${ARC.x0} ${ARC.y0}Q${ARC.cx} ${ARC.cy} ${ARC.x1} ${ARC.y1}`;

export const PillToCard: React.FC<PillToCardProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, ratio } = useLayout();
  const k = SCALE[ratio] * u;
  const canvasDark = isDark(p.background);
  const flown = Math.min(0.85, Math.max(0.2, (Number(p.flown) || 62) / 100));

  const bump = (at: number) => interpolate(frame, [at - 3, at, at + 4], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const press1 = bump(T.click1);
  const press2 = bump(T.click2);
  const m = clamp01(progress(frame, T.openA, T.openB, p.ease) - progress(frame, T.closeA, T.closeB, p.ease));
  const out = progress(frame, T.outA, T.outB, "exit");
  const rowIn = (i: number) => (frame < T.outA ? progress(frame, T.contentA + 3 * i, T.contentA + 3 * i + T.contentLen, "enter") : 1 - out);
  const fly = frame < T.outA ? progress(frame, T.arcA, T.arcB, "enter") * flown : flown;

  const pw = pillWidth(p.label);
  const w = mix(pw, CARD_W, m);
  const h = mix(PILL_H, CARD_H, m);
  const left = (CARD_W - w) / 2;
  const top = (CARD_H - h) / 2;

  // cursor in stage coords (stage = card box, centred)
  const P0: Pt = [CARD_W * 0.5 + 120, CARD_H * 0.5 + 92];
  const Ppill: Pt = [CARD_W * 0.5 + 18, CARD_H * 0.5 + 6];
  const Pclose: Pt = [CARD_W - 31 + 3, 30 + 4];
  let cur: Pt = P0;
  if (frame >= T.mv3A) cur = glide(Pclose, P0, progress(frame, T.mv3A, T.mv3B, "travel"));
  else if (frame >= T.mv2A) cur = glide(Ppill, Pclose, progress(frame, T.mv2A, T.mv2B, "travel"));
  else if (frame >= T.mv1A) cur = glide(P0, Ppill, progress(frame, T.mv1A, T.mv1B, "travel"));

  const row = (i: number): React.CSSProperties => {
    const o = rowIn(i);
    return { opacity: o, filter: o < 0.99 ? `blur(${(1 - o) * 5 * k}px)` : undefined };
  };
  const abs = (l: number, t: number, wd?: number, ht?: number): React.CSSProperties => ({
    position: "absolute",
    left: l * k,
    top: t * k,
    ...(wd !== undefined ? { width: wd * k } : {}),
    ...(ht !== undefined ? { height: ht * k } : {}),
  });
  const hair = Math.max(1, u);
  const plane = quad(fly);
  const planeAngle = quadAngle(Math.max(0.001, fly));
  const vb = (n: number) => (n * u) / k; // a token width in px, expressed in card units

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div style={{ position: "relative", width: CARD_W * k, height: CARD_H * k }}>
        <div
          style={{
            position: "absolute",
            left: left * k,
            top: top * k,
            width: w * k,
            height: h * k,
            borderRadius: RADIUS.hero * u,
            background: p.button,
            overflow: "hidden",
            transform: `scale(${1 - 0.04 * press1})`,
            boxShadow: canvasDark ? "none" : `0 ${u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)`,
          }}
        >
          {/* label: centred in the pill, then rides up to the card header */}
          <div
            style={{
              position: "absolute",
              left: `calc(${(1 - m) * 50}% + ${m * 22 * k}px)`,
              top: mix(PILL_H / 2, 30, m) * k,
              transform: `translate(${-(1 - m) * 50}%, -50%)`,
              fontSize: 15 * k,
              fontWeight: 500,
              color: p.onButton,
              whiteSpace: "nowrap",
              letterSpacing: "-0.01em",
            }}
          >
            {p.label}
          </div>

          {/* card body, laid out at full size from the top-left */}
          <div style={{ position: "absolute", left: 0, top: 0, width: CARD_W * k, height: CARD_H * k, color: p.onButton }}>
            <div style={{ ...abs(CARD_W - 44, 17, 26, 26), borderRadius: 999, background: p.cardLine, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 - 0.1 * press2})`, ...row(0) }}>
              <svg width={10 * k} height={10 * k} viewBox="0 0 10 10">
                <path d="M2 2l6 6M8 2 2 8" stroke={p.sub} strokeWidth={vb(STROKE.ring)} strokeLinecap="round" />
              </svg>
            </div>

            <div style={{ ...abs(22, 52, CARD_W - 44, 14), display: "flex", justifyContent: "space-between", fontFamily: FONT_MONO, fontSize: 10.5 * k, letterSpacing: "0.1em", color: p.faint, ...row(1) }}>
              <span>MI765</span>
              <span style={{ fontFamily: FONT_SANS, letterSpacing: 0, fontSize: 12 * k, color: p.sub }}>Sky Wing</span>
              <span>SKYFLY</span>
            </div>

            <div style={{ ...abs(0, 0, CARD_W, CARD_H), ...row(2) }}>
              <div style={{ ...abs(22, 80), fontSize: 40 * k, lineHeight: 1, fontWeight: 500, letterSpacing: "-0.04em" }}>{p.from}</div>
              <div style={{ ...abs(22, 126), fontSize: 12 * k, color: p.sub }}>3:30 pm</div>
              <div style={{ position: "absolute", right: 22 * k, top: 80 * k, fontSize: 40 * k, lineHeight: 1, fontWeight: 500, letterSpacing: "-0.04em" }}>{p.to}</div>
              <div style={{ position: "absolute", right: 22 * k, top: 126 * k, fontSize: 12 * k, color: p.sub }}>5:00 pm</div>
              <svg width={CARD_W * k} height={CARD_H * k} viewBox={`0 0 ${CARD_W} ${CARD_H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
                <path d={ARC_D} fill="none" stroke={p.faint} strokeWidth={vb(STROKE.hair)} strokeDasharray={`${vb(4)} ${vb(5)}`} strokeLinecap="round" />
                <path d={ARC_D} fill="none" stroke={p.accent} strokeWidth={vb(STROKE.ring)} strokeLinecap="round" strokeDasharray={ARC_LEN} strokeDashoffset={ARC_LEN * (1 - fly)} />
                <circle cx={ARC.x0} cy={ARC.y0} r={3} fill={p.onButton} />
                <circle cx={ARC.x1} cy={ARC.y1} r={3} fill="none" stroke={p.onButton} strokeWidth={vb(STROKE.ring)} />
                <g transform={`translate(${plane[0]} ${plane[1]}) rotate(${planeAngle})`}>
                  <path d="M6 0 1.5-1.2-1.8-5.2H-3.4L-1.2-1.3-4.6-1.1-6-2.8H-7L-6.2 0-7 2.8H-6L-4.6 1.1-1.2 1.3-3.4 5.2H-1.8L1.5 1.2Z" fill={p.onButton} transform="scale(1.25)" />
                </g>
              </svg>
              <div style={{ ...abs(130, 120, 100), textAlign: "center", fontSize: 11 * k, color: p.faint }}>Direct flight</div>
            </div>

            <div style={{ ...abs(22, 152, CARD_W - 44, 0), height: hair, background: p.cardLine, ...row(3) }} />
            <div style={{ ...abs(22, 166, CARD_W - 44, 44), display: "flex", justifyContent: "space-between", alignItems: "flex-end", ...row(3) }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 * k, fontSize: 12 * k, fontWeight: 500, color: p.success }}>
                  <span style={{ width: 6 * k, height: 6 * k, borderRadius: 999, background: p.success }} />
                  On time
                </div>
                <div style={{ marginTop: 6 * k, fontSize: 16 * k, fontWeight: 500, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>{p.eta}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12 * k, color: p.faint }}>Duration</div>
                <div style={{ marginTop: 6 * k, fontSize: 16 * k, fontWeight: 500, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>{p.duration}</div>
              </div>
            </div>
          </div>
        </div>

        {/* cursor */}
        <svg
          width={16 * u * 1.6}
          height={22 * u * 1.6}
          viewBox="0 0 16 22"
          style={{ position: "absolute", left: cur[0] * k - u, top: cur[1] * k - u, overflow: "visible", transformOrigin: "0 0", transform: `scale(${1 - 0.12 * Math.max(press1, press2)})` }}
        >
          <path d="M1 1V17.4L5.1 13.6 7.9 20.2 10.7 19 7.9 12.5H13.6Z" fill={p.ink} stroke={p.background} strokeWidth={STROKE.hair} strokeLinejoin="round" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
