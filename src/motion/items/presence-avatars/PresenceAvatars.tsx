import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STROKE, mix, progress, useLayout } from "../../kit";
import type { Ratio } from "../../types";

export type PresenceAvatarsProps = {
  background: string;
  card: string; // avatar base and toast surface
  line: string;
  ink: string;
  ink2: string;
  ink3: string; // offline
  accent: string; // away
  success: string; // online
  name1: string;
  name2: string;
  name3: string;
  ease: string;
};

// ---------- avatars drawn in code: initials on soft grey tones ----------
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
export const isDark = (hex: string) => {
  const [r, g, b] = rgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.4;
};
// ink mixed into the card: avatar fill, initials
export const TONES = [
  { bg: 0.1, fg: 0.8 },
  { bg: 0.2, fg: 1 },
  { bg: 0.06, fg: 0.6 },
];
const words = (name: string) => name.trim().split(/\s+/).filter(Boolean);
export const initials = (name: string) => {
  const w = words(name);
  if (!w.length) return "?";
  if (w.length === 1) return [...w[0]][0].toUpperCase();
  return ([...w[0]][0] + [...w[w.length - 1]][0]).toUpperCase();
};
export const firstName = (name: string) => words(name)[0] ?? "";

// ---------- geometry (px at 1080 on the short side) ----------
// Row on 16:9 and 1:1; a list (avatar left, text right) on 9:16.
export const GEO: Record<Ratio, { d: number; step: number; name: number; status: number; head: number; toastTop: number }> = {
  "16:9": { d: 280, step: 440, name: 40, status: 28, head: 22, toastTop: 72 },
  "1:1": { d: 220, step: 330, name: 32, status: 24, head: 20, toastTop: 64 },
  "9:16": { d: 220, step: 300, name: 46, status: 32, head: 24, toastTop: 220 },
};
export const DOT = 0.22; // status dot, fraction of the avatar diameter
export const TOAST_H = 2 * RADIUS.hero; // a true pill

// ---------- states and timeline (180-frame loop) ----------
export type Status = "online" | "away" | "offline";
export const LABEL: Record<Status, string> = { online: "Online", away: "Away", offline: "Offline" };
export const START: Status[] = ["online", "away", "offline"];
// Every avatar ends where it started, so the loop is seamless.
export const EVENTS: { f: number; i: number; to: Status }[] = [
  { f: 18, i: 2, to: "online" },
  { f: 60, i: 0, to: "away" },
  { f: 96, i: 1, to: "offline" },
  { f: 118, i: 2, to: "offline" },
  { f: 138, i: 0, to: "online" },
  { f: 146, i: 1, to: "away" },
];
export const TOAST = { inA: 22, inB: 42, outA: 76, outB: 90 } as const;
export const POP = [0, 5, 11, 16] as const; // dot scale keys after an event: 1 → 0.55 → 1.15 → 1
export const RIPPLE = [6, 20] as const;

export const PresenceAvatars: React.FC<PresenceAvatarsProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, u, ratio, isVertical } = useLayout();
  const g = GEO[ratio];
  const names = [p.name1, p.name2, p.name3];
  const hair = Math.max(1, u);
  const colorOf = (s: Status) => (s === "online" ? p.success : s === "away" ? p.accent : p.ink3);

  const d = g.d * u;
  const dot = d * DOT;

  // ---- per-avatar state at this frame
  const track = names.map((_, i) => {
    let state = START[i];
    let col = colorOf(state);
    let scale = 1;
    let ripple = 0;
    let rippleCol = col;
    let label = { from: state, to: state, t: 1 };
    let off = state === "offline" ? 1 : 0;
    for (const e of EVENTS) {
      if (e.i !== i || frame < e.f) continue;
      const from = state;
      state = e.to;
      col = interpolateColors(progress(frame, e.f + 3, e.f + 9, "travel"), [0, 1], [colorOf(from), colorOf(e.to)]);
      scale = interpolate(frame, POP.map((k) => e.f + k), [1, 0.55, 1.15, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      ripple = progress(frame, e.f + RIPPLE[0], e.f + RIPPLE[1], "enter");
      rippleCol = colorOf(e.to);
      label = { from, to: e.to, t: progress(frame, e.f + 2, e.f + 14, p.ease) };
      off = mix(from === "offline" ? 1 : 0, e.to === "offline" ? 1 : 0, progress(frame, e.f + 2, e.f + 14, "travel"));
    }
    return { col, scale, ripple, rippleCol, label, off };
  });
  const online = names.filter((_, i) => {
    let s = START[i];
    for (const e of EVENTS) if (e.i === i && frame >= e.f + 6) s = e.to;
    return s === "online";
  }).length;

  // ---- layout
  const cyMid = height / 2 + (isVertical ? 40 : 10) * u;
  const listLeft = (width - (d + 56 * u + 400 * u)) / 2;
  const pos = (i: number): [number, number] =>
    isVertical ? [listLeft + d / 2, cyMid + (i - 1) * g.step * u] : [width / 2 + (i - 1) * g.step * u, cyMid - 50 * u];
  const headTop = isVertical ? pos(0)[1] - d / 2 - 110 * u : pos(0)[1] - d / 2 - 120 * u;

  // ---- toast
  const tin = progress(frame, TOAST.inA, TOAST.inB, p.ease);
  const tout = progress(frame, TOAST.outA, TOAST.outB, "exit");
  const toastO = tin * (1 - tout);
  const mini = 56 * u;
  const toastTone = TONES[2 % TONES.length];

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS }}>
      {/* header label */}
      <div
        style={{
          position: "absolute",
          left: isVertical ? listLeft : 0,
          right: isVertical ? undefined : 0,
          top: headTop,
          display: "flex",
          justifyContent: isVertical ? "flex-start" : "center",
          alignItems: "center",
          gap: 18 * u,
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ fontFamily: FONT_MONO, fontSize: g.head * u, letterSpacing: "0.12em", color: p.ink3 }}>DESIGN TEAM</div>
        <div style={{ width: 6 * u, height: 6 * u, borderRadius: 999, background: p.ink3 }} />
        <div style={{ fontFamily: FONT_MONO, fontSize: g.head * u, letterSpacing: "0.12em", color: p.ink2 }}>{`${online} ONLINE`}</div>
      </div>

      {names.map((nm, i) => {
        const [x, y] = pos(i);
        const s = track[i];
        const tone = TONES[i % TONES.length];
        const dx = x + d * 0.354;
        const dy = y + d * 0.354;
        const textLeft = isVertical ? x + d / 2 + 56 * u : x - (g.step * u) / 2;
        const textW = isVertical ? 400 * u : g.step * u;
        const nameTop = isVertical ? y - (g.name + g.status * 1.5) * u * 0.62 : y + d / 2 + 48 * u;
        const statusTop = nameTop + g.name * 1.35 * u;
        const sh = g.status * 1.3 * u;
        const lt = s.label.t;
        const lineStyle: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: textW, height: sh, lineHeight: `${sh}px`, textAlign: isVertical ? "left" : "center" };
        return (
          <React.Fragment key={`p${i}`}>
            <div
              style={{
                position: "absolute",
                left: x - d / 2,
                top: y - d / 2,
                width: d,
                height: d,
                borderRadius: 999,
                background: blend(p.card, p.ink, tone.bg),
                boxShadow: `inset 0 0 0 ${hair}px ${p.line}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: d * 0.32,
                fontWeight: 500,
                letterSpacing: "-0.02em",
                color: blend(p.card, p.ink, tone.fg),
                opacity: 1 - 0.5 * s.off,
              }}
            >
              {initials(nm)}
            </div>
            {s.ripple > 0 && s.ripple < 1 && (
              <div
                style={{
                  position: "absolute",
                  left: dx - dot / 2,
                  top: dy - dot / 2,
                  width: dot,
                  height: dot,
                  boxSizing: "border-box",
                  borderRadius: 999,
                  border: `${STROKE.ring * u}px solid ${s.rippleCol}`,
                  opacity: 0.6 * (1 - s.ripple),
                  transform: `scale(${1 + 1.3 * s.ripple})`,
                }}
              />
            )}
            <div
              style={{
                position: "absolute",
                left: dx - dot / 2,
                top: dy - dot / 2,
                width: dot,
                height: dot,
                borderRadius: 999,
                background: s.col,
                boxShadow: `0 0 0 ${STROKE.bar * u}px ${p.background}`,
                transform: `scale(${s.scale})`,
              }}
            />
            <div style={{ position: "absolute", left: textLeft, top: nameTop, width: textW, textAlign: isVertical ? "left" : "center", fontSize: g.name * u, fontWeight: 500, letterSpacing: "-0.02em", color: p.ink, whiteSpace: "nowrap", opacity: 1 - 0.35 * s.off }}>
              {nm}
            </div>
            <div style={{ position: "absolute", left: textLeft, top: statusTop, width: textW, height: sh, overflow: "hidden", fontSize: g.status * u, color: p.ink2, whiteSpace: "nowrap" }}>
              {lt < 1 && <div style={{ ...lineStyle, opacity: 1 - lt, transform: `translateY(${-lt * sh * 0.6}px)` }}>{LABEL[s.label.from]}</div>}
              <div style={{ ...lineStyle, opacity: lt, transform: `translateY(${(1 - lt) * sh * 0.6}px)` }}>{LABEL[s.label.to]}</div>
            </div>
          </React.Fragment>
        );
      })}

      {/* toast */}
      {toastO > 0.001 && (
        <div
          style={{
            position: "absolute",
            left: width / 2,
            top: g.toastTop * u,
            height: TOAST_H * u,
            boxSizing: "border-box",
            padding: `0 ${36 * u}px 0 ${20 * u}px`,
            borderRadius: RADIUS.hero * u,
            background: p.card,
            boxShadow: isDark(p.background)
              ? `inset 0 0 0 ${hair}px ${p.line}`
              : `inset 0 0 0 ${hair}px ${p.line}, 0 ${u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)`,
            display: "flex",
            alignItems: "center",
            gap: 20 * u,
            whiteSpace: "nowrap",
            opacity: toastO,
            transform: `translateX(-50%) translateY(${-(1 - tin) * 40 * u - tout * 24 * u}px)`,
          }}
        >
          <div
            style={{
              position: "relative",
              width: mini,
              height: mini,
              borderRadius: 999,
              background: blend(p.card, p.ink, toastTone.bg),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: mini * 0.34,
              fontWeight: 500,
              color: blend(p.card, p.ink, toastTone.fg),
            }}
          >
            {initials(names[2])}
            <div style={{ position: "absolute", right: -2 * u, bottom: -2 * u, width: 18 * u, height: 18 * u, borderRadius: 999, background: p.success, boxShadow: `0 0 0 ${STROKE.ring * u}px ${p.card}` }} />
          </div>
          <div style={{ fontSize: 30 * u, fontWeight: 500, letterSpacing: "-0.01em", color: p.ink }}>{firstName(names[2])}</div>
          <div style={{ fontSize: 30 * u, letterSpacing: "-0.01em", color: p.ink2, marginLeft: -12 * u }}>is online</div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 18 * u, letterSpacing: "0.12em", color: p.ink3, marginLeft: 12 * u }}>NOW</div>
        </div>
      )}
    </AbsoluteFill>
  );
};
