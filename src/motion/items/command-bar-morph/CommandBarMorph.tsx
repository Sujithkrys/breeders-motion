import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { FONT_MONO, FONT_SANS, RADIUS, STROKE, mix, progress, useLayout } from "../../kit";
import type { Ratio } from "../../types";

export type CommandBarMorphProps = {
  background: string;
  button: string; // bar and panel surface
  onButton: string; // primary text on it
  sub: string; // secondary text on it
  faint: string; // tertiary text on it
  chip: string; // key caps and the highlighted row
  ink: string; // cursor
  accent: string;
  label: string;
  query: string;
  item1: string;
  item2: string;
  item3: string;
  ease: string;
};

// ---------- geometry (px at 1080 on the short side; multiply by u) ----------
// The bar is 96 tall with the hero radius, so it is a true pill at every width.
export const GEO = {
  "16:9": { h: 96, barW: 1120, font: 34, keyW: 72, keyH: 48, icon: 38, rowH: 88, rowFont: 30, mono: 20, headH: 56, gap: 16 },
  "1:1": { h: 96, barW: 900, font: 32, keyW: 70, keyH: 46, icon: 36, rowH: 86, rowFont: 29, mono: 19, headH: 54, gap: 16 },
  "9:16": { h: 96, barW: 920, font: 32, keyW: 70, keyH: 46, icon: 36, rowH: 90, rowFont: 30, mono: 20, headH: 56, gap: 18 },
} as const;
export const CHAR_W = 0.56; // average Inter 500 advance, in em
export const PANEL_PAD = 12;
export const PLACEHOLDER = "Type a command or search";
export const SHORTCUTS = ["↵", "⌘2", "⌘3"];
export const pillWidth = (label: string, g: (typeof GEO)[Ratio]) => 2 * 30 + g.keyW + 18 + label.length * CHAR_W * g.font + 6;
export const panelHeight = (g: (typeof GEO)[Ratio]) => 2 * PANEL_PAD + g.headH + 3 * g.rowH;

// ---------- timeline (180-frame loop) ----------
export const T = {
  mvA: 8, mvB: 28, click: 31,
  openA: 32, openB: 56,
  awayA: 38, awayB: 60, // cursor returns to rest and fades
  typeA: 62, typeB: 96,
  liftA: 94, liftB: 116,
  dropA: 98, dropB: 118, rowsA: 104, rowLen: 20,
  hlA: 122, hlB: 134,
  outA: 136, outB: 150,
  clearA: 140, clearB: 150,
  closeA: 146, closeB: 168,
  backA: 150, backB: 164, // cursor fades back in at rest
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

// 24-unit stroke icons for the three suggestion rows and the search glyph.
const ROW_ICONS = [
  "M4 6.5h16v13H4zM4 10.5h16M8.5 4v4M15.5 4v4", // calendar
  "M20.5 12a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0zM12 7.5V12l3 2", // clock
  "M9.5 6.5H20M9.5 12H20M9.5 17.5H20M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01", // list
];
const SEARCH = "M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0zM15.2 15.2 20 20";

export const CommandBarMorph: React.FC<CommandBarMorphProps> = (p) => {
  const frame = useCurrentFrame();
  const { width, height, u, ratio } = useLayout();
  const g = GEO[ratio];
  const dark = isDark(p.background);
  const shadow = dark ? "none" : `0 ${u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)`;
  const items = [p.item1, p.item2, p.item3];
  const query = String(p.query ?? "");

  // ---- morph state
  const m = clamp01(progress(frame, T.openA, T.openB, p.ease) - progress(frame, T.closeA, T.closeB, p.ease));
  const labelOut = clamp01(m * 2.2); // the button label leaves in the first half
  const phIn = clamp01(m * 2 - 1); // the placeholder arrives in the second half
  const bump = (at: number) => interpolate(frame, [at - 3, at, at + 4], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const press = bump(T.click);

  // ---- typing
  const span = T.typeB - T.typeA;
  const typed = frame < T.typeA ? 0 : Math.min(query.length, Math.floor(((frame - T.typeA) / span) * query.length + 1e-6));
  const typedText = frame >= T.typeA && frame < T.closeB ? query.slice(0, typed) : "";
  const typedOpacity = 1 - progress(frame, T.clearA, T.clearB, "exit");
  const phOpacity = frame < T.typeA ? phIn : 0;
  const typing = frame >= T.typeA && frame < T.typeB + 4;
  const caretOn = typing || Math.floor(frame / 9) % 2 === 0;
  const caretOpacity = (caretOn ? 1 : 0) * clamp01(m * 4 - 3) * (frame < T.clearA ? 1 : typedOpacity);

  // ---- panel
  const out = progress(frame, T.outA, T.outB, "exit");
  const drop = progress(frame, T.dropA, T.dropB, "enter") * (1 - out);
  const rowIn = (i: number) => progress(frame, T.rowsA + 3 * i, T.rowsA + 3 * i + T.rowLen, "enter") * (1 - out);
  const hl = progress(frame, T.hlA, T.hlB, "travel") * (1 - out);
  const lift = clamp01(progress(frame, T.liftA, T.liftB, "travel") - progress(frame, T.closeA - 4, T.closeB - 4, "travel"));

  // ---- layout
  const h = g.h * u;
  const pw = pillWidth(p.label, g) * u;
  const barW = Math.min(g.barW * u, width * 0.9);
  const w = mix(pw, barW, m);
  const pH = panelHeight(g) * u;
  const gap = g.gap * u;
  const cx = width / 2;
  const barTop = height / 2 - h / 2 - lift * ((gap + pH) / 2);
  const barLeft = cx - w / 2;
  const panelLeft = cx - barW / 2;
  const panelTop = barTop + h + gap;

  // content slots inside the bar (from the bar's left edge)
  const keyLeft = 30 * u;
  const iconLeft = 34 * u;
  const textX = mix(keyLeft + (g.keyW + 18) * u, iconLeft + (g.icon + 22) * u, m);
  const fs = g.font * u;

  // ---- cursor
  const P0: Pt = [cx + pw / 2 + 70 * u, height / 2 + 150 * u];
  const Pbtn: Pt = [cx + 30 * u, height / 2 + 10 * u];
  let cur: Pt = P0;
  if (frame >= T.awayA && frame < T.backA) cur = glide(Pbtn, P0, progress(frame, T.awayA, T.awayB, "travel"));
  else if (frame >= T.mvA && frame < T.awayA) cur = glide(P0, Pbtn, progress(frame, T.mvA, T.mvB, "travel"));
  const curOpacity = frame < T.backA ? 1 - progress(frame, T.awayA + 8, T.awayB, "exit") : progress(frame, T.backA, T.backB, "enter");

  const iconStroke = STROKE.ring; // ring weight, in the icon's 24-unit grid
  const mono = g.mono * u;

  const keyChip = (text: string, opacity: number, style?: React.CSSProperties) => (
    <div
      style={{
        height: g.keyH * u * 0.84,
        minWidth: g.keyH * u * 0.84,
        padding: `0 ${12 * u}px`,
        boxSizing: "border-box",
        borderRadius: RADIUS.chip * u,
        background: p.chip,
        color: p.sub,
        fontFamily: FONT_MONO,
        fontSize: mono,
        letterSpacing: "0.04em",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        whiteSpace: "nowrap",
        opacity,
        ...style,
      }}
    >
      {text}
    </div>
  );

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS }}>
      {/* results panel, dropping from under the bar */}
      {drop > 0.001 ? (
        <div
          style={{
            position: "absolute",
            left: panelLeft,
            top: panelTop,
            width: barW,
            height: pH,
            borderRadius: RADIUS.card * u,
            background: p.button,
            boxShadow: shadow,
            opacity: drop,
            transformOrigin: "50% 0",
            transform: `translateY(${-(1 - drop) * 28 * u}px) scale(${mix(0.97, 1, drop)})`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 28 * u,
              top: PANEL_PAD * u,
              height: g.headH * u,
              display: "flex",
              alignItems: "center",
              fontFamily: FONT_MONO,
              fontSize: mono * 0.9,
              letterSpacing: "0.12em",
              color: p.faint,
              opacity: rowIn(0),
            }}
          >
            SUGGESTIONS
          </div>
          {items.map((label, i) => {
            const o = rowIn(i);
            const on = i === 0 ? hl : 0;
            const top = (PANEL_PAD + g.headH + i * g.rowH) * u;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: PANEL_PAD * u,
                  right: PANEL_PAD * u,
                  top,
                  height: g.rowH * u,
                  opacity: o,
                  transform: `translateY(${(1 - o) * -14 * u}px)`,
                }}
              >
                <div style={{ position: "absolute", inset: 0, borderRadius: RADIUS.button * u, background: p.chip, opacity: on }} />
                <div style={{ position: "absolute", left: 16 * u, right: 16 * u, top: 0, bottom: 0, display: "flex", alignItems: "center", gap: 22 * u }}>
                  <svg width={g.icon * u} height={g.icon * u} viewBox="0 0 24 24" fill="none" stroke={interpolateColors(on, [0, 1], [p.sub, p.accent])} strokeWidth={iconStroke}strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d={ROW_ICONS[i]} />
                  </svg>
                  <span style={{ flex: 1, fontSize: g.rowFont * u, fontWeight: 400, letterSpacing: "-0.01em", color: interpolateColors(on, [0, 1], [p.sub, p.onButton]), whiteSpace: "nowrap", overflow: "hidden" }}>{label}</span>
                  {keyChip(SHORTCUTS[i], 1, { background: i === 0 ? interpolateColors(on, [0, 1], [p.chip, p.button]) : p.chip })}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* the bar: one element morphing from button to input */}
      <div
        style={{
          position: "absolute",
          left: barLeft,
          top: barTop,
          width: w,
          height: h,
          borderRadius: RADIUS.hero * u,
          background: p.button,
          boxShadow: shadow,
          overflow: "hidden",
          transform: `scale(${1 - 0.04 * press})`,
        }}
      >
        {/* button state: ⌘K key cap + label */}
        <div style={{ position: "absolute", left: keyLeft, top: (h - g.keyH * u) / 2, height: g.keyH * u, display: "flex", alignItems: "center", opacity: 1 - labelOut, transform: `scale(${mix(1, 0.7, labelOut)})`, transformOrigin: "30% 50%" }}>
          {keyChip("⌘K", 1, { height: g.keyH * u, minWidth: g.keyW * u, fontSize: mono * 1.1 })}
        </div>
        <div style={{ position: "absolute", left: textX, top: 0, height: h, display: "flex", alignItems: "center", fontSize: fs, fontWeight: 500, letterSpacing: "-0.015em", color: p.onButton, whiteSpace: "nowrap", opacity: 1 - labelOut }}>
          {p.label}
        </div>

        {/* input state: search glyph, placeholder, typed query, caret, esc */}
        <svg width={g.icon * u} height={g.icon * u} viewBox="0 0 24 24" fill="none" stroke={p.sub} strokeWidth={iconStroke} strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: iconLeft, top: (h - g.icon * u) / 2, opacity: phIn, transform: `scale(${mix(0.6, 1, phIn)})` }}>
          <path d={SEARCH} />
        </svg>
        <div style={{ position: "absolute", left: textX, top: 0, height: h, display: "flex", alignItems: "center", fontSize: fs, fontWeight: 400, letterSpacing: "-0.015em", color: p.faint, whiteSpace: "nowrap", opacity: phOpacity }}>
          {PLACEHOLDER}
        </div>
        <div style={{ position: "absolute", left: textX, top: 0, height: h, display: "flex", alignItems: "center", fontSize: fs, fontWeight: 400, letterSpacing: "-0.015em", color: p.onButton, whiteSpace: "nowrap" }}>
          {typedText ? <span style={{ opacity: typedOpacity, filter: typedOpacity < 0.99 ? `blur(${(1 - typedOpacity) * 6 * u}px)` : undefined }}>{typedText}</span> : null}
          <div style={{ width: 3 * u, height: fs * 1.05, marginLeft: typedText ? 3 * u : -2 * u, borderRadius: 2 * u, background: p.accent, opacity: caretOpacity }} />
        </div>
        <div style={{ position: "absolute", right: 26 * u, top: 0, height: h, display: "flex", alignItems: "center", opacity: phIn }}>
          {keyChip("esc", 1)}
        </div>
      </div>

      {/* cursor */}
      <svg
        width={30 * u}
        height={41 * u}
        viewBox="0 0 16 22"
        style={{ position: "absolute", left: cur[0], top: cur[1], overflow: "visible", opacity: curOpacity, transformOrigin: "0 0", transform: `scale(${1 - 0.12 * press})` }}
      >
        <path d="M1 1V17.4L5.1 13.6 7.9 20.2 10.7 19 7.9 12.5H13.6Z" fill={p.ink} stroke={p.background} strokeWidth={1.3} strokeLinejoin="round" />
      </svg>
    </AbsoluteFill>
  );
};
