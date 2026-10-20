import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONT_SANS, RADIUS, STROKE, progress, useLayout } from "../../kit";
import type { Ratio } from "../../types";

export type MoneyStackProps = {
  background: string;
  card: string;
  fill: string;
  line: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  onAccent: string;
  amount1: string;
  from1: string;
  to1: string;
  note1: string;
  tilt: number; // degrees the cards behind are turned
  ease: string;
};

// ---------- geometry (design px; k = scale × u) ----------
export const SCALE: Record<Ratio, number> = { "16:9": 2.65, "1:1": 1.9, "9:16": 1.95 };
export const CW = 440;
export const CH = 180;

// ---------- timeline (180-frame loop) ----------
export const ADVANCE = [10, 52, 94, 136] as const; // the front card leaves at each of these
export const LEAVE = 14; // exit frames
export const MOVE = { delay: 4, len: 22 } as const; // the stack steps forward
export const ROLL = { delay: 4, len: 18, stagger: 3, maxStagger: 9 } as const; // digits roll on the new front card

export type Payment = { amount: string; from: string; to: string; note: string; time: string };
export const OTHERS: Payment[] = [
  { amount: "$84", from: "myles", to: "john", note: "dinner was great", time: "2m" },
  { amount: "$100", from: "alex", to: "benji", note: "world cup bet", time: "24m" },
  { amount: "$4,200", from: "james", to: "jackson", note: "rent", time: "3h" },
];

const lum = (hex: string) => {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const n = parseInt(f, 16);
  if (Number.isNaN(n)) return 1;
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
};
export const isDark = (hex: string) => lum(hex) < 0.4;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const clampI = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// One digit that rolls upward through `spin` digits and settles on its value.
const RollDigit: React.FC<{ d: number; t: number; lh: number; blur: number }> = ({ d, t, lh, blur }) => {
  const pos = d - (1 - t) * 8;
  const base = Math.floor(pos);
  const frac = pos - base;
  const g = (n: number) => ((n % 10) + 10) % 10;
  const moving = t < 0.999;
  return (
    <span style={{ position: "relative", display: "inline-block", height: lh, overflow: "hidden", verticalAlign: "top" }}>
      <span style={{ visibility: "hidden" }}>{d}</span>
      <span style={{ position: "absolute", left: 0, top: -frac * lh, filter: moving ? `blur(${blur * (1 - t)}px)` : undefined }}>{g(base)}</span>
      {frac > 0.001 ? <span style={{ position: "absolute", left: 0, top: (1 - frac) * lh, filter: moving ? `blur(${blur * (1 - t)}px)` : undefined }}>{g(base + 1)}</span> : null}
    </span>
  );
};

const Badge: React.FC<{ size: number; bg: string; fg: string }> = ({ size, bg, fg }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" style={{ flexShrink: 0, margin: `0 ${size * 0.35}px 0 ${size * 0.3}px` }}>
    <circle cx={6} cy={6} r={6} fill={bg} />
    <path d="M3.4 6.2 5.2 8l3.4-3.8" fill="none" stroke={fg} strokeWidth={STROKE.hair} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const initial = (s: string) => (s.charAt(0) || "?").toUpperCase();

export const MoneyStack: React.FC<MoneyStackProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, ratio } = useLayout();
  const k = SCALE[ratio] * u;
  const dark = isDark(p.background);
  const hair = Math.max(1, u);
  const tilt = Math.min(6, Math.max(0, Number(p.tilt) || 0));
  const payments: Payment[] = [{ amount: p.amount1, from: p.from1, to: p.to1, note: p.note1, time: "9h" }, ...OTHERS];

  // c: how many steps the stack has moved forward (eased)
  const c = ADVANCE.reduce((acc, a) => acc + progress(frame, a + MOVE.delay, a + MOVE.delay + MOVE.len, p.ease), 0);
  const shadow = dark ? "none" : `0 ${u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)`;
  const amountSize = 56 * k;

  // slots 0–6: slot s shows payment s % 4; slot s leaves at ADVANCE[s] (s < 4)
  const slots = [0, 1, 2, 3, 4, 5, 6];
  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div style={{ position: "relative", width: CW * k, height: (CH + 30) * k }}>
        {slots.map((s) => {
          const pay = payments[s % 4];
          const leave = s < 4 ? progress(frame, ADVANCE[s], ADVANCE[s] + LEAVE, "exit") : 0;
          if (leave >= 1) return null;
          const depth = Math.max(0, s - c);
          if (depth >= 3) return null;
          let x = interpolate(depth, [0, 1, 2, 3], [0, -10, 12, 0], clampI);
          let y = interpolate(depth, [0, 1, 2, 3], [0, 14, 26, 32], clampI);
          let rot = interpolate(depth, [0, 1, 2, 3], [0, -tilt, tilt * 0.8, 0], clampI);
          let scale = interpolate(depth, [0, 1, 2, 3], [1, 0.965, 0.93, 0.9], clampI);
          let opacity = depth <= 2 ? 1 : 1 - (depth - 2);
          if (leave > 0) {
            x = -leave * 220;
            y = -leave * 12;
            rot = -leave * 9;
            scale = 1 - leave * 0.1;
            opacity = 1 - leave;
          }
          const content = clamp01(1 - depth * 0.55);
          // the roll runs when this slot becomes the front card; slot 0 starts settled
          const rollAt = s >= 1 && s <= 4 ? ADVANCE[s - 1] + ROLL.delay : -999;
          let di = 0;
          const chars = pay.amount.split("").map((ch, i) => {
            if (!/[0-9]/.test(ch)) return <span key={i}>{ch}</span>;
            const st = rollAt + Math.min(di * ROLL.stagger, ROLL.maxStagger);
            const t = progress(frame, st, st + ROLL.len, "enter");
            di += 1;
            return <RollDigit key={i} d={Number(ch)} t={t} lh={amountSize * 1.1} blur={3 * k} />;
          });
          return (
            <div
              key={s}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: CW * k,
                height: CH * k,
                transform: `translate(${x * k}px, ${y * k}px) rotate(${rot}deg) scale(${scale})`,
                transformOrigin: "50% 60%",
                opacity,
                zIndex: leave > 0 ? 200 : 100 - Math.round(depth * 10),
                borderRadius: RADIUS.card * u,
                background: p.card,
                border: `${hair}px solid ${p.line}`,
                boxSizing: "border-box",
                boxShadow: shadow,
                padding: `${22 * k}px ${26 * k}px`,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ opacity: content, display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div style={{ fontSize: amountSize, lineHeight: 1.1, height: amountSize * 1.1, fontWeight: 600, letterSpacing: "-0.04em", color: p.ink, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{chars}</div>
                  <div style={{ display: "flex", marginTop: 6 * k }}>
                    {[pay.from, pay.to].map((n, i) => (
                      <div
                        key={i}
                        style={{
                          width: 38 * k,
                          height: 38 * k,
                          marginLeft: i ? -12 * k : 0,
                          borderRadius: 999,
                          background: p.fill,
                          boxShadow: `0 0 0 ${STROKE.ring * u}px ${p.card}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 15 * k,
                          fontWeight: 500,
                          color: i ? p.ink3 : p.ink2,
                        }}
                      >
                        {initial(n)}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1 }} />
                <div style={{ display: "flex", alignItems: "center", fontSize: 16 * k, whiteSpace: "nowrap" }}>
                  <span style={{ fontWeight: 500, color: p.ink }}>{pay.from}</span>
                  <span style={{ color: p.ink2, margin: `0 ${5 * k}px` }}>paid</span>
                  <span style={{ fontWeight: 500, color: p.ink }}>{pay.to}</span>
                  <Badge size={13 * k} bg={p.accent} fg={p.onAccent} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 8 * k, whiteSpace: "nowrap" }}>
                  <span style={{ fontSize: 15 * k, color: p.ink2 }}>“{pay.note}”</span>
                  <span style={{ fontSize: 13 * k, color: p.ink3 }}>{pay.time}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
