import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STROKE, mix, progress, useLayout } from "../../kit";
import type { Ratio } from "../../types";

export type AvatarStackFanProps = {
  background: string;
  card: string; // avatar base surface
  fill: string; // "+N" chip
  line: string;
  ink: string;
  ink2: string;
  ink3: string;
  button: string; // tooltip surface
  onButton: string;
  accent: string;
  name1: string;
  name2: string;
  name3: string;
  name4: string;
  name5: string;
  extra: number; // the "+N" count
  ease: string;
};

// ---------- avatars drawn in code: initials on a soft tone (greys plus the accent at low strength) ----------
const rgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const n = parseInt(f, 16);
  if (Number.isNaN(n)) return [128, 128, 128];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const blend = (a: string, b: string, t: number) => {
  const x = rgb(a);
  const y = rgb(b);
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(", ")})`;
};
export const avatarTone = (i: number, base: string, ink: string, accent: string) => {
  switch (i % 5) {
    case 0:
      return { bg: blend(base, ink, 0.08), fg: blend(base, ink, 0.72) };
    case 1:
      return { bg: blend(base, accent, 0.16), fg: accent };
    case 2:
      return { bg: blend(base, ink, 0.16), fg: ink };
    case 3:
      return { bg: blend(base, ink, 0.05), fg: blend(base, ink, 0.55) };
    default:
      return { bg: blend(base, ink, 0.24), fg: ink };
  }
};
const words = (name: string) => name.trim().split(/\s+/).filter(Boolean);
export const initials = (name: string) => {
  const w = words(name);
  if (!w.length) return "?";
  if (w.length === 1) return [...w[0]][0].toUpperCase();
  return ([...w[0]][0] + [...w[w.length - 1]][0]).toUpperCase();
};
export const firstName = (name: string) => words(name)[0] ?? "";

// ---------- geometry (px at 1080 on the short side) ----------
// d: avatar diameter · gap: space between fanned avatars · tip: tooltip text size · cap: caption size.
export const GEO: Record<Ratio, { d: number; gap: number; tip: number; cap: number }> = {
  "16:9": { d: 200, gap: 36, tip: 30, cap: 30 },
  "1:1": { d: 128, gap: 20, tip: 26, cap: 26 },
  "9:16": { d: 132, gap: 18, tip: 28, cap: 30 },
};
export const OVERLAP = 0.64; // collapsed step as a fraction of the diameter
export const CHAR_W = 0.56;

// ---------- timeline (180-frame loop) ----------
export const T = {
  inA: 8, inB: 30, // cursor glides onto the stack
  open: 24, openLen: 24, // fan opens, staggered 3f per avatar
  slot0: 42, slot: 18, // one name tooltip per slot
  outA: 130, outB: 152, // cursor leaves
  closeA: 134, closeB: 156, // stack collapses
} as const;

type Pt = [number, number];
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const glide = (a: Pt, b: Pt, t: number): Pt => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const bow = Math.sin(Math.PI * clamp01(t)) * 0.08;
  return [a[0] + dx * t - dy * bow, a[1] + dy * t + dx * bow];
};

export const AvatarStackFan: React.FC<AvatarStackFanProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, u, ratio } = useLayout();
  const g = GEO[ratio];
  const names = [p.name1, p.name2, p.name3, p.name4, p.name5];
  const extra = Math.max(1, Math.min(99, Math.round(Number(p.extra) || 12)));

  const d = g.d * u;
  const cx = width / 2;
  const cy = height / 2 - 24 * u;
  const stepC = d * OVERLAP;
  const stepF = d + g.gap * u;
  const hair = Math.max(1, u);

  // fan: each of the 6 items (5 avatars + chip) opens on its own staggered spring, all collapse together
  const close = progress(frame, T.closeA, T.closeB, "travel");
  const fanOf = (i: number) => progress(frame, T.open + 3 * i, T.open + 3 * i + T.openLen, p.ease) * (1 - close);
  const xOf = (i: number) => cx + (i - 2.5) * mix(stepC, stepF, fanOf(i));

  // hover slots: tooltip in, then out as the cursor moves on
  const slotStart = (i: number) => T.slot0 + T.slot * i;
  const hoverOf = (i: number) => {
    const s = slotStart(i);
    return progress(frame, s, s + 8, "enter") * (1 - progress(frame, s + T.slot - 6, s + T.slot + 2, "exit"));
  };

  // cursor
  const at = (i: number): Pt => [xOf(i) + d * 0.08, cy + d * 0.14];
  const rest: Pt = [cx + (5 * stepC + d) / 2 + 60 * u, cy + d * 0.95];
  let cur: Pt = glide(rest, at(0), progress(frame, T.inA, T.inB, "travel"));
  for (let i = 1; i < 5; i++) {
    const s = slotStart(i);
    if (frame >= s - 6) cur = glide(at(i - 1), at(i), progress(frame, s - 6, s + 2, "travel"));
  }
  if (frame >= T.outA) cur = glide(at(4), rest, progress(frame, T.outA, T.outB, "travel"));

  const items = [...names.map((n, i) => ({ kind: "avatar" as const, name: n, i })), { kind: "chip" as const, name: "", i: 5 }];
  const tipPad = g.tip * 0.8 * u;
  const tipH = g.tip * 2 * u;

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS }}>
      {items.map((it) => {
        const h = it.kind === "avatar" ? hoverOf(it.i) : 0;
        const lift = 10 * u * h;
        const tone = it.kind === "avatar" ? avatarTone(it.i, p.card, p.ink, p.accent) : { bg: p.fill, fg: p.ink2 };
        return (
          <div
            key={`a${it.i}`}
            style={{
              position: "absolute",
              left: xOf(it.i) - d / 2,
              top: cy - d / 2 - lift,
              width: d,
              height: d,
              borderRadius: 999,
              background: tone.bg,
              boxShadow: `0 0 0 ${STROKE.bar * u}px ${p.background}, inset 0 0 0 ${hair}px ${p.line}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: d * (it.kind === "avatar" ? 0.34 : 0.3),
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: tone.fg,
              zIndex: 10 - it.i + (h > 0 ? 20 : 0),
              transform: `scale(${1 + 0.05 * h})`,
            }}
          >
            {it.kind === "avatar" ? initials(it.name) : `+${extra}`}
          </div>
        );
      })}

      {/* name tooltips, one per hover slot */}
      {names.map((n, i) => {
        const h = hoverOf(i);
        if (h <= 0.001) return null;
        const x = xOf(i);
        const est = n.length * CHAR_W * g.tip * u + 2 * tipPad;
        const tx = Math.min(width - est / 2 - 24 * u, Math.max(est / 2 + 24 * u, x));
        const bottom = cy - d / 2 - 10 * u * h - 22 * u;
        const rise = (1 - h) * 10 * u;
        return (
          <React.Fragment key={`t${i}`}>
            <div
              style={{
                position: "absolute",
                left: tx,
                top: bottom - tipH + rise,
                height: tipH,
                padding: `0 ${tipPad}px`,
                display: "flex",
                alignItems: "center",
                borderRadius: RADIUS.button * u,
                background: p.button,
                color: p.onButton,
                fontSize: g.tip * u,
                fontWeight: 500,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                opacity: h,
                transformOrigin: "50% 100%",
                transform: `translateX(-50%) scale(${0.92 + 0.08 * h})`,
                zIndex: 40,
              }}
            >
              {n}
            </div>
            <svg width={20 * u} height={10 * u} viewBox="0 0 20 10" style={{ position: "absolute", left: x - 10 * u, top: bottom - u + rise, opacity: h, zIndex: 40 }}>
              <path d="M0 0H20L12 8.5Q10 10.5 8 8.5Z" fill={p.button} />
            </svg>
          </React.Fragment>
        );
      })}

      {/* caption */}
      <div style={{ position: "absolute", left: 0, right: 0, top: cy + d / 2 + 64 * u, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 * u }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: g.cap * 0.62 * u, letterSpacing: "0.12em", color: p.ink3 }}>SHARED WITH</div>
        <div style={{ fontSize: g.cap * u, letterSpacing: "-0.01em", color: p.ink2, whiteSpace: "nowrap" }}>
          {`${firstName(names[0])}, ${firstName(names[1])} and ${3 + extra} others`}
        </div>
      </div>

      {/* cursor */}
      <svg width={30 * u} height={41 * u} viewBox="0 0 16 22" style={{ position: "absolute", left: cur[0], top: cur[1], overflow: "visible", zIndex: 50 }}>
        <path d="M1 1V17.4L5.1 13.6 7.9 20.2 10.7 19 7.9 12.5H13.6Z" fill={p.ink} stroke={p.background} strokeWidth={STROKE.hair} strokeLinejoin="round" />
      </svg>
    </AbsoluteFill>
  );
};

