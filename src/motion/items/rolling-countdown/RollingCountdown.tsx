import React from "react";
import { AbsoluteFill, spring, useCurrentFrame } from "remotion";
import { FONT_SANS, RADIUS, STROKE, mix, progress, useLayout } from "../../kit";
import type { Ratio } from "../../types";

export type RollingCountdownProps = {
  background: string;
  card: string;
  line: string;
  fill: string; // the active preset chip
  ink: string;
  ink2: string;
  accent: string; // the progress bar
  preset1: string;
  preset2: string;
  preset3: string;
  start: number; // seconds on the clock when the loop starts
  bounce: number; // spring overshoot of each digit, 0–3
};

// Timing in frames on the 180-frame loop. Five ticks (start → start − 5), a short rest, then the clock rolls back.
export const CLOCK = {
  ticks: [26, 52, 78, 104, 130], // the clock drops one second at each
  reset: 148, // digits roll back up, right column first
  resetStagger: 2,
  refill: [148, 166] as const, // the bar refills on travel
  roll: 14, // one digit's snap, on a spring
  colW: 0.62, // em; every digit sits in a fixed column, like tabular figures
  colonW: 0.3,
  lineH: 1.12, // em, the column's mask height
  tracking: -0.02,
} as const;

// Layout per ratio, px at 1080 on the short side.
export const GEO: Record<Ratio, { cardW: number; cardH: number; digits: number; bar: number; chip: number; gap: number }> = {
  "16:9": { cardW: 1080, cardH: 640, digits: 200, bar: 760, chip: 28, gap: 64 },
  "1:1": { cardW: 900, cardH: 640, digits: 190, bar: 660, chip: 26, gap: 60 },
  "9:16": { cardW: 920, cardH: 860, digits: 220, bar: 700, chip: 28, gap: 80 },
};

export const isDark = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.4;
};

export const startOf = (start: number) => Math.max(10, Math.min(5940, Math.round(Number(start) || 30)));
export const springFor = (bounce: number) => ({ damping: mix(19, 8.5, Math.max(0, Math.min(3, Number(bounce) || 0)) / 3), mass: 0.5, stiffness: 180 });

// "0:30", "5:00", "25:00": minutes padded to the width of the starting minutes, so the columns never change.
export const clockText = (secs: number, start: number) => {
  const mDigits = Math.max(1, String(Math.floor(start / 60)).length);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(mDigits, "0")}:${String(s).padStart(2, "0")}`;
};

type Change = { at: number; from: string; to: string; up: boolean };

// The clock's events: each tick counts down, the reset counts back up.
const events = (start: number): Change[] => {
  const list: Change[] = CLOCK.ticks.map((at, i) => ({ at, from: clockText(start - i, start), to: clockText(start - i - 1, start), up: false }));
  list.push({ at: CLOCK.reset, from: clockText(start - CLOCK.ticks.length, start), to: clockText(start, start), up: true });
  return list;
};

const DigitColumn: React.FC<{ index: number; cols: number; frame: number; fps: number; start: number; bounce: number; color: string }> = ({
  index,
  cols,
  frame,
  fps,
  start,
  bounce,
  color,
}) => {
  const fromRight = cols - 1 - index;
  let shown = clockText(start, start)[index];
  let moving: { from: string; to: string; s: number; up: boolean } | null = null;
  for (const e of events(start)) {
    const at = e.at + (e.up ? fromRight * CLOCK.resetStagger : 0);
    if (frame < at || e.from[index] === e.to[index]) continue;
    shown = e.to[index];
    const f = frame - at;
    moving = f < CLOCK.roll ? { from: e.from[index], to: e.to[index], s: spring({ frame: f, fps, config: springFor(bounce), durationInFrames: CLOCK.roll }), up: e.up } : null;
  }
  const cell = (key: string, ch: string, y: number) => (
    <span
      key={key}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        textAlign: "center",
        lineHeight: `${CLOCK.lineH}em`,
        transform: `translateY(${(y * 100).toFixed(3)}%)`,
        opacity: Math.max(0, 1 - Math.abs(y) * 1.4),
      }}
    >
      {ch}
    </span>
  );
  return (
    <span style={{ position: "relative", display: "inline-block", width: `${CLOCK.colW}em`, height: `${CLOCK.lineH}em`, overflow: "hidden", color }}>
      {moving
        ? // Counting down, the new digit drops in from above; rolling back, it rises from below.
          [cell("old", moving.from, (moving.up ? -1 : 1) * moving.s), cell("new", moving.to, (moving.up ? 1 : -1) * (1 - moving.s))]
        : cell("new", shown, 0)}
    </span>
  );
};

// Seconds left, continuous, for the bar.
export const remaining = (frame: number, start: number) => {
  const last = CLOCK.ticks[CLOCK.ticks.length - 1];
  const used = CLOCK.ticks.length * Math.min(1, frame / last);
  return start - used + CLOCK.ticks.length * progress(frame, CLOCK.refill[0], CLOCK.refill[1], "travel");
};

export const RollingCountdown: React.FC<RollingCountdownProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, width, fps, ratio } = useLayout();
  const g = GEO[ratio];
  const start = startOf(p.start);
  const text = clockText(start, start);
  const cols = text.length;
  const digitCols = text.replace(":", "").length;
  const cardW = Math.min(g.cardW * u, width * 0.9);
  const size = Math.min(g.digits * u, (cardW * 0.8) / (digitCols * CLOCK.colW + CLOCK.colonW));
  const left = remaining(frame, start) / start;
  const dark = isDark(p.background);
  const presets = [p.preset1, p.preset2, p.preset3];
  const barW = Math.min(g.bar * u, cardW - 160 * u);
  const barH = STROKE.bar * u;

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div
        style={{
          width: cardW,
          height: g.cardH * u,
          borderRadius: RADIUS.hero * u,
          background: p.card,
          border: `${u}px solid ${p.line}`,
          boxSizing: "border-box",
          boxShadow: dark ? "none" : `0 ${u}px ${2 * u}px rgba(0,0,0,0.04), 0 ${8 * u}px ${24 * u}px rgba(0,0,0,0.06)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: g.gap * u,
        }}
      >
        {/* presets: a segmented control, the first one active */}
        <div style={{ display: "flex", gap: 4 * u, padding: 6 * u, borderRadius: RADIUS.button * u, border: `${u}px solid ${p.line}`, background: p.card }}>
          {presets.map((label, i) => (
            <div
              key={i}
              style={{
                padding: `${12 * u}px ${22 * u}px`,
                borderRadius: RADIUS.chip * u,
                background: i === 0 ? p.fill : "transparent",
                color: i === 0 ? p.ink : p.ink2,
                fontSize: g.chip * u,
                fontWeight: 500,
                letterSpacing: "-0.01em",
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* the clock: one masked column per digit */}
        <div style={{ display: "flex", alignItems: "center", fontSize: size, fontWeight: 400, letterSpacing: `${CLOCK.tracking}em`, color: p.ink, lineHeight: 1 }}>
          {text.split("").map((ch, i) =>
            ch === ":" ? (
              <span key={i} style={{ display: "inline-block", width: `${CLOCK.colonW}em`, textAlign: "center", lineHeight: `${CLOCK.lineH}em`, transform: "translateY(-0.06em)" }}>
                :
              </span>
            ) : (
              <DigitColumn key={i} index={i} cols={cols} frame={frame} fps={fps} start={start} bounce={p.bounce} color={p.ink} />
            ),
          )}
        </div>

        {/* progress: a bar that depletes in the accent */}
        <svg width={barW} height={barH} viewBox={`0 0 ${barW} ${barH}`} style={{ display: "block" }}>
          <line x1={barH / 2} y1={barH / 2} x2={barW - barH / 2} y2={barH / 2} stroke={p.line} strokeWidth={barH} strokeLinecap="round" />
          <line x1={barH / 2} y1={barH / 2} x2={barH / 2 + (barW - barH) * Math.max(0, Math.min(1, left))} y2={barH / 2} stroke={p.accent} strokeWidth={barH} strokeLinecap="round" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
