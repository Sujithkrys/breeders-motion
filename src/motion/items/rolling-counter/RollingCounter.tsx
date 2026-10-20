import React, { useId } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONT_SANS, alpha, progress, useLayout } from "../../kit";

export type RollingCounterProps = {
  background: string;
  ink: string;
  quiet: string;
  accent: string;
  value: string; // e.g. "$2.4M": leading and trailing non-digits become prefix and suffix
  caption: string;
  badge: string;
  stagger: number; // frames between digit columns
  spins: number; // extra full turns before landing
  ease: string;
};

export const COUNTER = { start: 6, roll: 46, base: 300, baseVertical: 250, digitWidth: 0.6 } as const;

export const parseValue = (s: string) => {
  const first = s.search(/\d/);
  if (first < 0) return { prefix: s, body: "", suffix: "" };
  let last = s.length - 1;
  while (last > first && !/\d/.test(s[last])) last--;
  return { prefix: s.slice(0, first), body: s.slice(first, last + 1), suffix: s.slice(last + 1) };
};

const clamp01 = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const DigitColumn: React.FC<{ target: number; start: number; frame: number; spins: number; ease: string; u: number; color: string }> = ({
  target,
  start,
  frame,
  spins,
  ease,
  u,
  color,
}) => {
  const total = target + 10 * spins;
  const at = (f: number) => progress(f, start, start + COUNTER.roll, ease) * total;
  const pos = at(frame);
  // Speed in digits per frame drives a little motion blur, so fast spins read as motion, not flicker.
  const speed = Math.abs(at(frame + 1) - at(frame - 1)) / 2;
  const base = Math.floor(pos);
  const frac = pos - base;
  const cur = ((base % 10) + 10) % 10;
  const next = (cur + 1) % 10;
  const cell: React.CSSProperties = { position: "absolute", left: 0, right: 0, top: 0, textAlign: "center" };
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        width: `${COUNTER.digitWidth}em`,
        height: "1.1em",
        overflow: "hidden",
        color,
        filter: `blur(${Math.min(speed * 5, 7) * u}px)`,
        maskImage: "linear-gradient(180deg, transparent 0%, black 14%, black 86%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(180deg, transparent 0%, black 14%, black 86%, transparent 100%)",
      }}
    >
      <span style={{ ...cell, transform: `translateY(${-frac * 100}%)` }}>{cur}</span>
      <span style={{ ...cell, transform: `translateY(${(1 - frac) * 100}%)` }}>{next}</span>
    </span>
  );
};

export const RollingCounter: React.FC<RollingCounterProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, width, isVertical } = useLayout();
  const { prefix, body, suffix } = parseValue(p.value);
  const chars = Math.max(p.value.length, 1);
  const fs = Math.min((isVertical ? COUNTER.baseVertical : COUNTER.base) * u, (width * 0.84) / (chars * 0.62));
  const stagger = Math.max(0, p.stagger);
  const spins = Math.max(0, Math.round(p.spins));
  const digitCount = (body.match(/\d/g) ?? []).length;
  const rollEnd = COUNTER.start + Math.max(digitCount - 1, 0) * stagger + COUNTER.roll;

  const fadeUp = (from: number, dur: number, dist: number): React.CSSProperties => {
    const t = progress(frame, from, from + dur, p.ease);
    return { opacity: interpolate(t, [0, 0.6], [0, 1], clamp01), transform: `translateY(${(1 - t) * dist * u}px)` };
  };
  const badgeIn = progress(frame, rollEnd - 8, rollEnd + 10, p.ease);
  const glowId = `rc${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  let di = 0;
  const bodyNodes = body.split("").map((ch, i) => {
    if (/\d/.test(ch)) {
      const col = di++;
      return <DigitColumn key={i} target={Number(ch)} start={COUNTER.start + col * stagger} frame={frame} spins={spins} ease={p.ease} u={u} color={p.ink} />;
    }
    return (
      <span key={i} style={{ display: "inline-block", lineHeight: "1.1em", height: "1.1em", color: p.ink, ...fadeUp(COUNTER.start, 18, 0) }}>
        {ch}
      </span>
    );
  });

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={p.accent} stopOpacity={0.2} />
            <stop offset="100%" stopColor={p.accent} stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx="50" cy="50" rx="38" ry="34" fill={`url(#${glowId})`} />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {p.badge.trim() !== "" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10 * u,
              marginBottom: 26 * u,
              padding: `${10 * u}px ${20 * u}px`,
              borderRadius: 999,
              background: alpha(p.accent, 0.14),
              border: `${1.5 * u}px solid ${alpha(p.accent, 0.38)}`,
              color: p.accent,
              fontSize: 30 * u,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              opacity: badgeIn,
              transform: `translateY(${(1 - badgeIn) * 14 * u}px) scale(${0.92 + 0.08 * badgeIn})`,
            }}
          >
            <svg width={18 * u} height={18 * u} viewBox="0 0 12 12">
              <path d="M6 1.5 11 10H1Z" fill={p.accent} />
            </svg>
            {p.badge}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "flex-start", fontSize: fs, fontWeight: 650, letterSpacing: "-0.04em", lineHeight: "1.1em" }}>
          {prefix !== "" && <span style={{ color: p.accent, height: "1.1em", whiteSpace: "pre", ...fadeUp(COUNTER.start, 20, 40) }}>{prefix}</span>}
          {bodyNodes}
          {suffix !== "" && <span style={{ color: p.accent, height: "1.1em", whiteSpace: "pre", ...fadeUp(rollEnd - 14, 20, 40) }}>{suffix}</span>}
        </div>
        {p.caption.trim() !== "" && (
          <div style={{ marginTop: 18 * u, fontSize: 44 * u, fontWeight: 400, letterSpacing: "-0.015em", color: p.quiet, ...fadeUp(COUNTER.start + 14, 26, 24) }}>
            {p.caption}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
