import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STROKE, mix, progress, useLayout } from "../../kit";

export type SearchPillMorphProps = {
  background: string;
  card: string;
  line: string;
  fill: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  query: string;
  placeholder: string;
  ease: string;
};

// ---------- geometry (px at 1080 on the short side; multiply by u) ----------
// The closed button is a circle of diameter h; the open field keeps that height with fully round ends.
export const GEO = {
  "16:9": { h: 140, w: 1100, font: 48, icon: 60, clear: 56, mono: 22, inset: 40 },
  "1:1": { h: 124, w: 880, font: 42, icon: 54, clear: 50, mono: 20, inset: 34 },
  "9:16": { h: 124, w: 900, font: 42, icon: 54, clear: 50, mono: 20, inset: 34 },
} as const;

// ---------- timeline (150-frame loop) ----------
export const T = {
  mv1A: 6, mv1B: 22, click1: 25,
  openA: 26, openB: 50,
  parkA: 30, parkB: 52,
  typeA: 56, typeB: 88,
  xA: 90, xB: 104,
  mv2A: 92, mv2B: 106, click2: 109,
  clearA: 110, clearB: 120,
  phA: 114, phB: 124,
  homeA: 112, homeB: 134,
  closeA: 120, closeB: 138,
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

export const SearchPillMorph: React.FC<SearchPillMorphProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, u, ratio } = useLayout();
  const g = GEO[ratio];
  const dark = isDark(p.background);
  const query = String(p.query ?? "");

  // ---- state
  const m = clamp01(progress(frame, T.openA, T.openB, p.ease) - progress(frame, T.closeA, T.closeB, p.ease));
  const bump = (at: number) => interpolate(frame, [at - 3, at, at + 4], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const press1 = bump(T.click1);
  const press2 = bump(T.click2);
  const focus = clamp01(progress(frame, T.openA + 6, T.openB, "enter") - progress(frame, T.closeA, T.closeA + 12, "exit"));
  const span = T.typeB - T.typeA;
  const typed = frame < T.typeA ? 0 : Math.min(query.length, Math.floor(((frame - T.typeA) / span) * query.length + 1e-6));
  const clearT = progress(frame, T.clearA, T.clearB, "exit");
  const showText = frame >= T.typeA && frame < T.clearB;
  const xIn = clamp01(progress(frame, T.xA, T.xB, "spring") - progress(frame, T.clearA + 2, T.clearB + 2, "exit"));
  const phIn = clamp01(m * 2.5 - 1.5);
  const phOpacity = frame < T.typeA ? phIn : frame >= T.phA ? progress(frame, T.phA, T.phB, "enter") * phIn : 0;
  const hintOpacity = phIn * (frame < T.xA ? 1 : frame < T.phA ? 1 - progress(frame, T.xA, T.xA + 8, "exit") : progress(frame, T.phA, T.phB, "enter"));
  const typing = frame >= T.typeA && frame < T.typeB + 4;
  const caretOpacity = (typing || Math.floor(frame / 9) % 2 === 0 ? 1 : 0) * clamp01(focus * 3 - 2);

  // ---- layout
  const h = g.h * u;
  const W = Math.min(g.w * u, width * 0.9);
  const w = mix(h, W, m);
  const cx = width / 2;
  const cy = height / 2;
  const left = cx - w / 2;
  const top = cy - h / 2;
  const icon = g.icon * u;
  const iconLeft = mix((h - icon) / 2, g.inset * u, m);
  const textX = g.inset * u + icon + 24 * u;
  const clearD = g.clear * u;
  const clearRight = (h - clearD) / 2 + 6 * u;
  const fs = g.font * u;
  const ring = mix(1, STROKE.ring, focus) * u;
  const ringColor = interpolateColors(focus, [0, 1], [p.line, p.accent]);
  const drop = dark ? "" : `, 0 ${u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)`;

  // ---- cursor (frame coords)
  const P0: Pt = [cx + 150 * u, cy + h / 2 + 120 * u];
  const Pbtn: Pt = [cx + 12 * u, cy + 14 * u];
  const Ppark: Pt = [cx + W / 2 - 150 * u, cy + h / 2 + 90 * u];
  const Pclear: Pt = [cx + W / 2 - clearRight - clearD / 2 + 4 * u, cy + 6 * u];
  let cur: Pt = P0;
  if (frame >= T.homeA) cur = glide(Pclear, P0, progress(frame, T.homeA, T.homeB, "travel"));
  else if (frame >= T.mv2A) cur = glide(Ppark, Pclear, progress(frame, T.mv2A, T.mv2B, "travel"));
  else if (frame >= T.parkA) cur = glide(Pbtn, Ppark, progress(frame, T.parkA, T.parkB, "travel"));
  else if (frame >= T.mv1A) cur = glide(P0, Pbtn, progress(frame, T.mv1A, T.mv1B, "travel"));

  const textRow: React.CSSProperties = { position: "absolute", left: textX, top: 0, height: h, display: "flex", alignItems: "center", fontSize: fs, fontWeight: 400, letterSpacing: "-0.025em", whiteSpace: "nowrap" };

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS }}>
      <div
        style={{
          position: "absolute",
          left,
          top,
          width: w,
          height: h,
          borderRadius: 999,
          background: p.card,
          boxShadow: `inset 0 0 0 ${ring}px ${ringColor}${drop}`,
          overflow: "hidden",
          transform: `scale(${1 - 0.06 * press1})`,
        }}
      >
        {/* magnifier: centred in the circle, slides to the field's leading slot */}
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke={interpolateColors(m, [0, 1], [p.ink, p.ink2])}
          strokeWidth={STROKE.ring}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ position: "absolute", left: iconLeft, top: (h - icon) / 2, transform: `rotate(${-14 * Math.sin(Math.PI * m)}deg)` }}
        >
          <path d="M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0zM15.3 15.3 20 20" />
        </svg>

        <div style={{ ...textRow, color: p.ink3, opacity: phOpacity }}>{p.placeholder}</div>
        <div style={{ ...textRow, color: p.ink }}>
          {showText && typed > 0 ? (
            <span style={{ opacity: 1 - clearT, transform: `translateX(${-clearT * 24 * u}px)`, filter: clearT > 0.01 ? `blur(${clearT * 6 * u}px)` : undefined }}>{query.slice(0, typed)}</span>
          ) : null}
          <div style={{ width: 3 * u, height: fs * 1.08, marginLeft: showText && typed > 0 && clearT < 0.5 ? 3 * u : -2 * u, borderRadius: 2 * u, background: p.accent, opacity: caretOpacity }} />
        </div>

        {/* "/" shortcut hint while empty */}
        <div
          style={{
            position: "absolute",
            right: clearRight + (clearD - 44 * u) / 2,
            top: (h - 44 * u) / 2,
            width: 44 * u,
            height: 44 * u,
            borderRadius: RADIUS.chip * u,
            boxShadow: `inset 0 0 0 ${u}px ${p.line}`,
            background: p.fill,
            color: p.ink2,
            fontFamily: FONT_MONO,
            fontSize: g.mono * u,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: hintOpacity,
          }}
        >
          /
        </div>

        {/* clear button */}
        <div
          style={{
            position: "absolute",
            right: clearRight,
            top: (h - clearD) / 2,
            width: clearD,
            height: clearD,
            borderRadius: 999,
            background: p.fill,
            opacity: xIn,
            transform: `scale(${mix(0.5, 1, xIn) * (1 - 0.12 * press2)})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width={clearD * 0.56} height={clearD * 0.56} viewBox="0 0 24 24" fill="none" stroke={p.ink2} strokeWidth={STROKE.ring} strokeLinecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </div>
      </div>

      {/* cursor */}
      <svg
        width={30 * u}
        height={41 * u}
        viewBox="0 0 16 22"
        style={{ position: "absolute", left: cur[0], top: cur[1], overflow: "visible", transformOrigin: "0 0", transform: `scale(${1 - 0.12 * Math.max(press1, press2)})` }}
      >
        <path d="M1 1V17.4L5.1 13.6 7.9 20.2 10.7 19 7.9 12.5H13.6Z" fill={p.ink} stroke={p.background} strokeWidth={1.3} strokeLinejoin="round" />
      </svg>
    </AbsoluteFill>
  );
};
