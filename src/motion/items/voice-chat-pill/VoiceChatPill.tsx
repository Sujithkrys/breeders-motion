import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STROKE, mix, progress, useLayout } from "../../kit";
import type { Ratio } from "../../types";

export type VoiceChatPillProps = {
  background: string;
  button: string; // pill and panel surface
  onButton: string; // primary text on it
  sub: string; // secondary text on it
  faint: string; // tertiary text on it
  cardLine: string; // hairlines and small buttons on it
  ink: string; // cursor
  accent: string;
  title: string;
  name1: string;
  name2: string;
  name3: string;
  name4: string;
  ease: string;
};

// ---------- avatars drawn in code: initials on soft tones of the surface (greys plus the accent at low strength) ----------
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
const words = (name: string) => name.trim().split(/\s+/).filter(Boolean);
export const initials = (name: string) => {
  const w = words(name);
  if (!w.length) return "?";
  if (w.length === 1) return [...w[0]][0].toUpperCase();
  return ([...w[0]][0] + [...w[w.length - 1]][0]).toUpperCase();
};

// ---------- geometry ----------
// Panel in design px (k = SCALE × u). The pill is drawn in u and is exactly 2 × RADIUS.hero tall, so it is a true pill.
export const SCALE: Record<Ratio, number> = { "16:9": 2.5, "1:1": 2.4, "9:16": 2.7 };
export const PANEL_W = 360;
export const PANEL_H = 352;
export const PILL = { h: 2 * RADIUS.hero, padL: 30, wave: 40, gapA: 20, d: 60, step: 40, gapB: 16, more: 44, padR: 34 } as const;
export const pillWidth = () => PILL.padL + PILL.wave + PILL.gapA + PILL.d + 3 * PILL.step + PILL.gapB + PILL.more + PILL.padR;
export const ROW = { y0: 78, h: 54, d: 36, x: 24 } as const;
export const EXTRA = 3;
export const SPEAKER = 1;
export const SUBS = ["Host", "Speaking", "Muted", "Listening"];
const ICON = { mic: 0, eq: 1, off: 2 } as const;
const INDICATOR = [ICON.mic, ICON.eq, ICON.off, ICON.mic];
// Continuous motion: periods divide the 180-frame loop, so it is seamless.
export const PULSE = 30;
const WAVE_P = [30, 36, 20, 36, 30];
const EQ_P = [20, 30, 36];

// ---------- timeline (180-frame loop) ----------
export const T = {
  mv1A: 10, mv1B: 28, click1: 30,
  openA: 31, openB: 57,
  pillOutA: 31, pillOutB: 41,
  avA: 33, avLen: 22,
  contentA: 44, contentLen: 18,
  mv2A: 102, mv2B: 122, click2: 124,
  outA: 125, outB: 137,
  closeA: 128, closeB: 154,
  pillInA: 146, pillInB: 162,
  mv3A: 128, mv3B: 152,
} as const;

type Pt = [number, number];
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const glide = (a: Pt, b: Pt, t: number): Pt => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const bow = Math.sin(Math.PI * clamp01(t)) * 0.06;
  return [a[0] + dx * t - dy * bow, a[1] + dy * t + dx * bow];
};
const wobble = (frame: number, period: number, phase: number) => Math.abs(Math.sin((2 * Math.PI * frame) / period + phase));

const Wave: React.FC<{ size: number; color: string; frame: number }> = ({ size, color, frame }) => {
  const base = [0.35, 0.7, 1, 0.6, 0.3];
  return (
    <svg width={size} height={size} viewBox="0 0 20 20">
      {base.map((b, j) => {
        const h = Math.max(2.4, 16 * b * (0.55 + 0.45 * wobble(frame, WAVE_P[j], j * 0.9)));
        return <rect key={j} x={1.8 + j * 3.6} y={10 - h / 2} width={2.4} height={h} rx={1.2} fill={color} />;
      })}
    </svg>
  );
};

export const VoiceChatPill: React.FC<VoiceChatPillProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, ratio } = useLayout();
  const k = SCALE[ratio] * u;
  const names = [p.name1, p.name2, p.name3, p.name4];
  const hair = Math.max(1, u);
  const dark = isDark(p.background);

  const sw = PANEL_W * k;
  const sh = PANEL_H * k;
  const pw = pillWidth() * u;
  const ph = PILL.h * u;
  const pl = (sw - pw) / 2;
  const pt = (sh - ph) / 2;

  // ---- morph
  const bump = (at: number) => interpolate(frame, [at - 3, at, at + 4], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const press1 = bump(T.click1);
  const press2 = bump(T.click2);
  const m = clamp01(progress(frame, T.openA, T.openB, p.ease) - progress(frame, T.closeA, T.closeB, "travel"));
  const bx = mix(pl, 0, m);
  const by = mix(pt, 0, m);
  const bw = mix(pw, sw, m);
  const bh = mix(ph, sh, m);
  const pillContent = frame < T.closeA ? 1 - progress(frame, T.pillOutA, T.pillOutB, "exit") : progress(frame, T.pillInA, T.pillInB, "enter");
  const out = progress(frame, T.outA, T.outB, "exit");
  const groupIn = (j: number) => (frame < T.outA ? progress(frame, T.contentA + 3 * j, T.contentA + 3 * j + T.contentLen, "enter") : 1 - out);

  // ---- avatars travel from the pill stack to the list rows
  const avT = (i: number) => clamp01(progress(frame, T.avA + 3 * i, T.avA + 3 * i + T.avLen, p.ease) - progress(frame, T.closeA, T.closeB - 2, "travel"));
  const pillAv = (i: number): Pt => [pl + (PILL.padL + PILL.wave + PILL.gapA + PILL.d / 2 + PILL.step * i) * u, sh / 2];
  const rowY = (i: number) => ROW.y0 + ROW.h / 2 + ROW.h * i;
  const rowAv = (i: number): Pt => [(ROW.x + ROW.d / 2) * k, rowY(i) * k];

  // ---- cursor (stage coords)
  const P0: Pt = [sw / 2 + pw / 2 + 50 * u, sh / 2 + 96 * u];
  const Ppill: Pt = [pl + pw * 0.62, sh / 2 + 8 * u];
  const Pclose: Pt = [(PANEL_W - 24 - 15) * k + 3 * u, 34 * k + 4 * u];
  let cur: Pt = P0;
  if (frame >= T.mv3A) cur = glide(Pclose, P0, progress(frame, T.mv3A, T.mv3B, "travel"));
  else if (frame >= T.mv2A) cur = glide(Ppill, Pclose, progress(frame, T.mv2A, T.mv2B, "travel"));
  else if (frame >= T.mv1A) cur = glide(P0, Ppill, progress(frame, T.mv1A, T.mv1B, "travel"));

  const tone = (i: number) => {
    const t = [
      { bg: blend(p.button, p.onButton, 0.16), fg: p.onButton },
      { bg: blend(p.button, p.accent, 0.3), fg: p.onButton },
      { bg: blend(p.button, p.onButton, 0.28), fg: p.onButton },
      { bg: blend(p.button, p.onButton, 0.1), fg: blend(p.button, p.onButton, 0.75) },
    ];
    return t[i % t.length];
  };
  const ph30 = (frame % PULSE) / PULSE;
  const abs = (l: number, t: number): React.CSSProperties => ({ position: "absolute", left: l * k, top: t * k });
  const fade = (j: number): React.CSSProperties => {
    const o = groupIn(j);
    return { opacity: o, transform: `translateY(${(1 - o) * 8 * u}px)` };
  };
  const iconStroke = (size: number) => (STROKE.ring * u * 24) / size;
  const isz = 22 * k;

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div style={{ position: "relative", width: sw, height: sh }}>
        {/* the morphing surface */}
        <div
          style={{
            position: "absolute",
            left: bx,
            top: by,
            width: bw,
            height: bh,
            borderRadius: mix(RADIUS.hero, RADIUS.card, m) * u,
            background: p.button,
            overflow: "hidden",
            transform: `scale(${1 - 0.03 * press1})`,
            boxShadow: dark ? "none" : `0 ${u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)`,
          }}
        >
          {/* panel content, fixed in stage coordinates */}
          <div style={{ position: "absolute", left: -bx, top: -by, width: sw, height: sh, color: p.onButton }}>
            {/* header */}
            <div style={{ ...abs(ROW.x, 0), height: 68 * k, display: "flex", alignItems: "center", gap: 10 * k, ...fade(0) }}>
              <Wave size={22 * k} color={p.accent} frame={frame} />
              <div style={{ fontSize: 16 * k, fontWeight: 500, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>{p.title}</div>
            </div>
            <div style={{ position: "absolute", right: (24 + 30 + 12) * k, top: 0, height: 68 * k, display: "flex", alignItems: "center", fontFamily: FONT_MONO, fontSize: 10 * k, letterSpacing: "0.1em", color: p.faint, ...fade(0) }}>
              {`${names.length + EXTRA} IN ROOM`}
            </div>
            <div style={{ ...abs(PANEL_W - 24 - 30, 19), width: 30 * k, height: 30 * k, borderRadius: 999, background: p.cardLine, display: "flex", alignItems: "center", justifyContent: "center", ...fade(0), transform: `scale(${1 - 0.1 * press2})` }}>
              <svg width={14 * k} height={14 * k} viewBox="0 0 24 24" fill="none" stroke={p.sub} strokeWidth={iconStroke(14 * k)} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
              </svg>
            </div>
            <div style={{ ...abs(ROW.x, 67), width: (PANEL_W - 2 * ROW.x) * k, height: hair, background: p.cardLine, ...fade(0) }} />

            {/* rows: name, state, indicator (avatars are drawn above, they travel in from the pill) */}
            {names.map((nm, i) => {
              const cy = rowY(i);
              const speaking = i === SPEAKER;
              const kind = INDICATOR[i];
              return (
                <div key={`r${i}`} style={{ position: "absolute", left: 0, top: 0, width: sw, height: sh, ...fade(i + 1) }}>
                  <div style={{ ...abs(ROW.x + ROW.d + 14, cy - 19), fontSize: 15 * k, fontWeight: 500, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>{nm}</div>
                  <div style={{ ...abs(ROW.x + ROW.d + 14, cy + 2), fontSize: 12 * k, color: speaking ? p.accent : p.faint, whiteSpace: "nowrap" }}>{SUBS[i]}</div>
                  {kind === ICON.eq ? (
                    <svg width={isz} height={isz} viewBox="0 0 24 24" style={{ ...abs(PANEL_W - ROW.x - 22, cy - 11) }}>
                      {EQ_P.map((per, j) => {
                        const h = 5 + 13 * wobble(frame, per, j * 1.3);
                        return <rect key={j} x={5 + j * 5.5} y={12 - h / 2} width={3.4} height={h} rx={1.7} fill={p.accent} />;
                      })}
                    </svg>
                  ) : (
                    <svg width={isz} height={isz} viewBox="0 0 24 24" fill="none" stroke={p.faint} strokeWidth={iconStroke(isz)} strokeLinecap="round" strokeLinejoin="round" style={{ ...abs(PANEL_W - ROW.x - 22, cy - 11) }}>
                      <path d="M12 4a2.5 2.5 0 0 1 2.5 2.5V11a2.5 2.5 0 0 1-5 0V6.5A2.5 2.5 0 0 1 12 4zM6.5 11a5.5 5.5 0 0 0 11 0M12 16.5V20" />
                      {kind === ICON.off && <path d="M5 5l14 14" />}
                    </svg>
                  )}
                </div>
              );
            })}

            {/* footer */}
            <div style={{ ...abs(ROW.x, 301), width: (PANEL_W - 2 * ROW.x) * k, height: hair, background: p.cardLine, ...fade(5) }} />
            <div style={{ ...abs(ROW.x, 313), height: 26 * k, display: "flex", alignItems: "center", fontSize: 12 * k, color: p.faint, whiteSpace: "nowrap", ...fade(5) }}>{`${EXTRA} others listening`}</div>
            <div
              style={{
                ...abs(PANEL_W - ROW.x - 72, 312),
                width: 72 * k,
                height: 28 * k,
                borderRadius: RADIUS.button * u,
                background: p.cardLine,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13 * k,
                fontWeight: 500,
                color: p.onButton,
                ...fade(5),
              }}
            >
              Leave
            </div>
          </div>
        </div>

        {/* pill content: live waveform and the "+3" count */}
        {pillContent > 0.001 && (
          <>
            <div style={{ position: "absolute", left: pl + PILL.padL * u, top: sh / 2 - (PILL.wave * u) / 2, opacity: pillContent }}>
              <Wave size={PILL.wave * u} color={p.accent} frame={frame} />
            </div>
            <div
              style={{
                position: "absolute",
                left: pl + (pillWidth() - PILL.padR - PILL.more) * u,
                top: sh / 2 - 20 * u,
                height: 40 * u,
                display: "flex",
                alignItems: "center",
                fontSize: 30 * u,
                fontWeight: 500,
                letterSpacing: "-0.01em",
                color: p.sub,
                opacity: pillContent,
              }}
            >
              {`+${EXTRA}`}
            </div>
          </>
        )}

        {/* avatars: a stack in the pill, a column in the panel */}
        {names.map((nm, i) => {
          const t = avT(i);
          const a = pillAv(i);
          const b = rowAv(i);
          const x = mix(a[0], b[0], t);
          const y = mix(a[1], b[1], t);
          const d = mix(PILL.d * u, ROW.d * k, t);
          const tn = tone(i);
          const z = i === SPEAKER ? 20 : 10 - i;
          const gap = 4 * u;
          const ringD = d + 2 * (gap + STROKE.ring * u);
          return (
            <React.Fragment key={`a${i}`}>
              {i === SPEAKER && (
                <>
                  <div style={{ position: "absolute", left: x - ringD / 2, top: y - ringD / 2, width: ringD, height: ringD, boxSizing: "border-box", borderRadius: 999, border: `${STROKE.ring * u}px solid ${p.accent}`, zIndex: z }} />
                  <div
                    style={{
                      position: "absolute",
                      left: x - ringD / 2,
                      top: y - ringD / 2,
                      width: ringD,
                      height: ringD,
                      boxSizing: "border-box",
                      borderRadius: 999,
                      border: `${STROKE.ring * u}px solid ${p.accent}`,
                      opacity: 0.7 * (1 - ph30),
                      transform: `scale(${1 + 0.32 * ph30})`,
                      zIndex: z,
                    }}
                  />
                </>
              )}
              <div
                style={{
                  position: "absolute",
                  left: x - d / 2,
                  top: y - d / 2,
                  width: d,
                  height: d,
                  borderRadius: 999,
                  background: tn.bg,
                  boxShadow: i === SPEAKER ? undefined : `0 0 0 ${STROKE.bar * u * (1 - t)}px ${p.button}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: d * 0.36,
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  color: tn.fg,
                  zIndex: z,
                }}
              >
                {initials(nm)}
              </div>
            </React.Fragment>
          );
        })}

        {/* cursor */}
        <svg
          width={30 * u}
          height={41 * u}
          viewBox="0 0 16 22"
          style={{ position: "absolute", left: cur[0], top: cur[1], overflow: "visible", transformOrigin: "0 0", transform: `scale(${1 - 0.12 * Math.max(press1, press2)})`, zIndex: 30 }}
        >
          <path d="M1 1V17.4L5.1 13.6 7.9 20.2 10.7 19 7.9 12.5H13.6Z" fill={p.ink} stroke={p.background} strokeWidth={STROKE.hair} strokeLinejoin="round" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
