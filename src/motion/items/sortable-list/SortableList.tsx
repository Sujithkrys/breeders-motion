import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STROKE, alpha, mix, progress, useLayout } from "../../kit";
import type { Ratio } from "../../types";

export type SortableListProps = {
  background: string;
  card: string;
  fill: string;
  line: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  title: string;
  name1: string;
  name2: string;
  name3: string;
  name4: string;
  name5: string;
  ease: string;
};

// ---------- geometry (design px; k = scale × u) ----------
export const SCALE: Record<Ratio, number> = { "16:9": 2.05, "1:1": 1.7, "9:16": 1.8 };
export const CW = 500;
export const PAD = 24;
export const HEAD_H = 76;
export const ROW_H = 60;
export const CH = HEAD_H + ROW_H * 5 + 14;
export const ROLES = ["Design lead", "Platform engineer", "Product manager", "Site reliability", "Data engineer"];
export const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];
export const GRABBED = 3; // row 4 is dragged to the top

// ---------- timeline (150-frame loop) ----------
export const T = {
  mv1A: 8, mv1B: 26, grab: 29,
  liftA: 29, liftB: 41,
  dragA: 36, dragB: 76,
  drop: 78, dropA: 78, dropB: 94,
  mv2A: 86, mv2B: 104,
  backA: 112, backB: 136,
  shift: 16, // frames each displaced row's spring runs
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
export const initials = (name: string) =>
  String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?";

// Where the dragged row sits, in slots (3 → 0).
const dragSlot = (frame: number, ease: string) => GRABBED - GRABBED * progress(frame, T.dragA, T.dragB, ease);
// The frame the dragged row's centre passes the middle of slot j, so the rows give way one by one.
export const crossFrame = (j: number, ease: string) => {
  for (let f = T.dragA; f <= T.dragB; f++) if (dragSlot(f, ease) <= j + 0.5) return f;
  return T.dragB;
};

export const SortableList: React.FC<SortableListProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, ratio } = useLayout();
  const k = SCALE[ratio] * u;
  const dark = isDark(p.background);
  const hair = Math.max(1, u);
  const names = [p.name1, p.name2, p.name3, p.name4, p.name5];

  // ---- slots (0 = top). Rows above the grabbed one slide down one slot as it passes, then all sort back.
  const back = (i: number) => progress(frame, T.backA + (i === GRABBED ? 0 : 3 * i), T.backA + (i === GRABBED ? 24 : 3 * i + 22), "travel");
  const slotOf = (i: number) => {
    if (i === GRABBED) return mix(dragSlot(frame, p.ease), GRABBED, back(i));
    if (i > GRABBED) return i;
    const c = crossFrame(i, p.ease);
    return i + progress(frame, c, c + T.shift, "spring") - back(i);
  };

  // ---- lift: grab → drop on the spring, plus a softer lift while it sorts back past the others
  const held = clamp01(progress(frame, T.liftA, T.liftB, "spring") - progress(frame, T.dropA, T.dropB, "spring"));
  const passing = Math.sin(Math.PI * back(GRABBED)) * 0.6;
  const lift = Math.max(held, passing);
  const accentLine = clamp01(held * 1.2);

  // ---- cursor (card coords)
  const rowTop = (s: number) => HEAD_H + s * ROW_H;
  const handle = (s: number): Pt => [27, rowTop(s) + ROW_H / 2 + 1]; // the grip's centre
  const P0: Pt = [CW * 0.74, CH + 30];
  let cur: Pt = P0;
  if (frame >= T.mv2A) cur = glide(handle(0), P0, progress(frame, T.mv2A, T.mv2B, "travel"));
  else if (frame >= T.grab) cur = handle(slotOf(GRABBED));
  else if (frame >= T.mv1A) cur = glide(P0, handle(GRABBED), progress(frame, T.mv1A, T.mv1B, "travel"));
  const press = clamp01(
    interpolate(frame, [T.grab - 3, T.grab], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) -
      interpolate(frame, [T.drop, T.drop + 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  );

  const abs = (left: number, top: number, width: number, height: number): React.CSSProperties => ({ position: "absolute", left: left * k, top: top * k, width: width * k, height: height * k });
  const shadow = dark ? "none" : `0 ${u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)`;
  const liftBg = dark ? p.fill : p.card;

  const row = (i: number) => {
    const s = slotOf(i);
    const l = i === GRABBED ? lift : 0;
    const surface = clamp01(l * 3);
    const outer = dark || l <= 0 ? "" : `, 0 ${12 * l * u}px ${32 * u}px rgba(0,0,0,${(0.12 * l).toFixed(3)}), 0 ${2 * l * u}px ${6 * u}px rgba(0,0,0,${(0.05 * l).toFixed(3)})`;
    const ring = i === GRABBED && accentLine > 0 ? `inset 0 0 0 ${STROKE.hair * u}px ${alpha(p.accent, accentLine)}` : `inset 0 0 0 0 transparent`;
    return (
      <div
        key={i}
        style={{
          ...abs(10, rowTop(s), CW - 20, ROW_H),
          borderRadius: RADIUS.button * u,
          background: surface > 0 ? alpha(liftBg, surface) : "transparent",
          boxShadow: `${ring}${outer}`,
          transform: `scale(${1 + 0.02 * l})`,
          zIndex: i === GRABBED ? 5 : 1,
        }}
      >
        <svg width={10 * k} height={16 * k} viewBox="0 0 10 16" style={{ position: "absolute", left: 12 * k, top: (ROW_H / 2 - 8) * k }}>
          {[0, 1, 2].map((r) => [0, 1].map((c) => <circle key={`${r}${c}`} cx={2 + c * 6} cy={2 + r * 6} r={1.5} fill={i === GRABBED && l > 0.05 ? p.ink2 : p.ink3} />))}
        </svg>
        <div
          style={{
            ...abs(PAD + 8, (ROW_H - 38) / 2, 38, 38),
            borderRadius: 999,
            background: p.fill,
            boxShadow: dark ? `inset 0 0 0 ${hair}px ${p.line}` : undefined,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13 * k,
            fontWeight: 500,
            color: p.ink2,
            letterSpacing: "0.01em",
          }}
        >
          {initials(names[i])}
        </div>
        <div style={{ position: "absolute", left: (PAD + 60) * k, top: 0, height: ROW_H * k, display: "flex", flexDirection: "column", justifyContent: "center", gap: 3 * k, whiteSpace: "nowrap" }}>
          <span style={{ fontSize: 16 * k, fontWeight: 500, letterSpacing: "-0.01em", color: p.ink, lineHeight: 1.15 }}>{names[i]}</span>
          <span style={{ fontSize: 13 * k, color: p.ink2, lineHeight: 1.15 }}>{ROLES[i]}</span>
        </div>
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
          boxShadow: shadow,
        }}
      >
        {/* header */}
        <div style={{ ...abs(PAD, 0, CW - 2 * PAD, HEAD_H), display: "flex", alignItems: "center", justifyContent: "space-between", whiteSpace: "nowrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 * k }}>
            <span style={{ fontSize: 20 * k, fontWeight: 500, letterSpacing: "-0.025em", color: p.ink, lineHeight: 1.1 }}>{p.title}</span>
            <span style={{ fontSize: 13 * k, color: p.ink3, lineHeight: 1.1 }}>Drag to set the order</span>
          </div>
          <span style={{ fontFamily: FONT_MONO, fontSize: 11 * k, letterSpacing: "0.12em", color: p.ink3 }}>WEEK 43</span>
        </div>
        <div style={{ ...abs(PAD, HEAD_H, CW - 2 * PAD, 0), height: hair, background: p.line }} />

        {/* slot dividers and day labels stay put while people move */}
        {[1, 2, 3, 4].map((s) => (
          <div key={`d${s}`} style={{ ...abs(PAD, rowTop(s), CW - 2 * PAD, 0), height: hair, background: p.line }} />
        ))}
        {DAYS.map((d, s) => (
          <div key={d} style={{ ...abs(CW - PAD - 80, rowTop(s), 80, ROW_H), display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 * k }}>
            {s === 0 ? <span style={{ width: 6 * k, height: 6 * k, borderRadius: 999, background: p.accent }} /> : null}
            <span style={{ fontFamily: FONT_MONO, fontSize: 11 * k, letterSpacing: "0.12em", color: p.ink3 }}>{d}</span>
          </div>
        ))}

        {[0, 1, 2, 4, 3].map(row)}

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
