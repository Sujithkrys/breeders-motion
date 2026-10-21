import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STROKE, progress, useLayout } from "../../kit";
import type { Ratio } from "../../types";

export type DetachableAccordionProps = {
  background: string;
  card: string;
  fill: string;
  line: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  onAccent: string;
  title1: string;
  title2: string;
  title3: string;
  title4: string;
  title5: string;
  body: string;
  gap: number; // px at 1080 between the detached card and the list
};

// ---------- geometry (design px; k = scale × u) ----------
export const SCALE: Record<Ratio, number> = { "16:9": 1.9, "1:1": 1.6, "9:16": 1.7 };
export const CW = 520;
export const ROW_H = 60;
export const PAD_X = 26;
export const BODY_H = 70;
export const POP = 10; // design px the detached card widens on each side
export const OPEN = 1; // the row that detaches (row 2)

// ---------- timeline (180-frame loop) ----------
export const T = {
  mv1A: 8, mv1B: 26, click1: 29,
  detA: 30, detB: 54, expA: 38, expB: 62, textA: 48, textB: 66,
  home1A: 38, home1B: 60,
  mv2A: 98, mv2B: 118, click2: 121,
  textOutA: 122, textOutB: 134, colA: 126, colB: 148, attA: 136, attB: 160,
  home2A: 130, home2B: 154,
} as const;

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

export const DetachableAccordion: React.FC<DetachableAccordionProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, u, ratio } = useLayout();
  const k = SCALE[ratio] * u;
  const dark = isDark(p.background);
  const hair = Math.max(1, u);
  const titles = [p.title1, p.title2, p.title3, p.title4, p.title5];

  // ---- state
  const s = clamp01(progress(frame, T.detA, T.detB, "spring") - progress(frame, T.attA, T.attB, "spring")); // detached
  const e = clamp01(progress(frame, T.expA, T.expB, "spring") - progress(frame, T.colA, T.colB, "spring")); // expanded
  const text = frame < T.textOutA ? progress(frame, T.textA, T.textB, "enter") : 1 - progress(frame, T.textOutA, T.textOutB, "exit");
  const bump = (at: number) => interpolate(frame, [at - 3, at, at + 5], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const press = Math.max(bump(T.click1), bump(T.click2));

  // ---- layout (frame px): three segments, the middle one is the detaching row
  const W = CW * k;
  const rowH = ROW_H * k;
  const G = Math.min(64, Math.max(12, Number(p.gap) || 32)) * u * s;
  const overlap = hair * (1 - s); // shared hairline while attached
  const hA = rowH * OPEN;
  const hD = rowH + BODY_H * k * e;
  const hB = rowH * (titles.length - OPEN - 1);
  const total = hA + hD + hB + 2 * G - 2 * overlap;
  const x0 = (width - W) / 2;
  const yA = (height - total) / 2;
  const yD = yA + hA + G - overlap;
  const yB = yD + hD + G - overlap;
  const pop = POP * k * s;

  const r = RADIUS.card * u;
  const rIn = r * clamp01(s * 1.6);
  const segs = [
    { key: "a", x: x0, y: yA, w: W, h: hA, radius: `${r}px ${r}px ${rIn}px ${rIn}px`, rows: [0] },
    { key: "d", x: x0 - pop, y: yD, w: W + 2 * pop, h: hD, radius: `${rIn}px`, rows: [OPEN] },
    { key: "b", x: x0, y: yB, w: W, h: hB, radius: `${rIn}px ${rIn}px ${r}px ${r}px`, rows: [2, 3, 4] },
  ];
  const baseShadow = `0 ${u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)`;
  const liftShadow = `0 ${u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${(8 + 10 * s) * u}px ${(24 + 16 * s) * u}px rgba(0,0,0,${0.06 + 0.04 * s})`;

  // ---- the open row's round button (frame px), the cursor's target
  const btn = 32 * k;
  const btnAt = (): Pt => [x0 + W + pop - PAD_X * k - btn / 2 + 4 * u, yD + rowH / 2 + 6 * u];
  // rest point clear of the fully expanded stack: to the right on 16:9, below elsewhere
  const openH = rowH * titles.length + BODY_H * k + 2 * Math.min(64, Math.max(12, Number(p.gap) || 32)) * u;
  const Rfix: Pt = ratio === "16:9" ? [x0 + W + 90 * u, height / 2 + 70 * u] : [width / 2 + W * 0.22, height / 2 + openH / 2 + 40 * u];
  let cur: Pt = Rfix;
  if (frame >= T.home2A) cur = glide(btnAt(), Rfix, progress(frame, T.home2A, T.home2B, "travel"));
  else if (frame >= T.mv2A) cur = glide(Rfix, btnAt(), progress(frame, T.mv2A, T.mv2B, "travel"));
  else if (frame >= T.home1A) cur = glide(btnAt(), Rfix, progress(frame, T.home1A, T.home1B, "travel"));
  else if (frame >= T.mv1A) cur = glide(Rfix, btnAt(), progress(frame, T.mv1A, T.mv1B, "travel"));

  const rowContent = (i: number, open: number) => {
    const sw = (STROKE.ring * u * 24) / (14 * k);
    return (
      <div key={`r${i}`} style={{ position: "relative", height: rowH, display: "flex", alignItems: "center", paddingLeft: PAD_X * k, paddingRight: PAD_X * k, boxSizing: "border-box" }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 11 * k, letterSpacing: "0.1em", color: p.ink3, width: 36 * k, flexShrink: 0 }}>{`0${i + 1}`}</span>
        <span style={{ flex: 1, fontSize: 19 * k, fontWeight: 500, letterSpacing: "-0.02em", color: p.ink, whiteSpace: "nowrap", overflow: "hidden" }}>{titles[i]}</span>
        <div
          style={{
            width: btn,
            height: btn,
            borderRadius: 999,
            flexShrink: 0,
            background: interpolateColors(open, [0, 1], [p.fill, p.accent]),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `rotate(${180 * open}deg) scale(${i === OPEN ? 1 - 0.08 * press : 1})`,
          }}
        >
          <svg width={14 * k} height={14 * k} viewBox="0 0 24 24" fill="none">
            <path d="M6 9.5l6 6 6-6" stroke={interpolateColors(open, [0, 1], [p.ink2, p.onAccent])} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS }}>
      {/* shadows first, so a later segment never shades the seam of an earlier one */}
      {!dark
        ? segs.map((g) => (
            <div key={`s${g.key}`} style={{ position: "absolute", left: g.x, top: g.y, width: g.w, height: g.h, borderRadius: g.radius, background: p.card, boxShadow: g.key === "d" ? liftShadow : baseShadow }} />
          ))
        : null}

      {segs.map((g) => (
        <div
          key={g.key}
          style={{
            position: "absolute",
            left: g.x,
            top: g.y,
            width: g.w,
            height: g.h,
            borderRadius: g.radius,
            background: p.card,
            border: `${hair}px solid ${p.line}`,
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          {g.rows.map((i, j) => (
            <React.Fragment key={i}>
              {j > 0 ? <div style={{ height: hair, marginTop: -hair, background: p.line, position: "relative" }} /> : null}
              {rowContent(i, g.key === "d" ? e : 0)}
            </React.Fragment>
          ))}
          {g.key === "d" ? (
            <div
              style={{
                position: "absolute",
                left: (PAD_X + 36) * k,
                right: (PAD_X + 44) * k,
                top: rowH - 6 * k,
                height: 45 * k, // exactly two lines
                overflow: "hidden",
                fontSize: 15 * k,
                lineHeight: 1.5,
                color: p.ink2,
                opacity: text,
                transform: `translateY(${(1 - text) * 8 * k}px)`,
                filter: text < 0.99 ? `blur(${(1 - text) * 4 * k}px)` : undefined,
              }}
            >
              {p.body}
            </div>
          ) : null}
        </div>
      ))}

      {/* cursor */}
      <svg
        width={30 * u * 1.2}
        height={41 * u * 1.2}
        viewBox="0 0 16 22"
        style={{ position: "absolute", left: cur[0], top: cur[1], overflow: "visible", transformOrigin: "0 0", transform: `scale(${1 - 0.12 * press})` }}
      >
        <path d="M1 1V17.4L5.1 13.6 7.9 20.2 10.7 19 7.9 12.5H13.6Z" fill={p.ink} stroke={p.background} strokeWidth={1.3} strokeLinejoin="round" />
      </svg>
    </AbsoluteFill>
  );
};
