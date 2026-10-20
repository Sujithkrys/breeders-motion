import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FINAL_HOLD, FONT_SANS, progress, useLayout } from "../../kit";

export type RollingCounterProps = {
  background: string;
  fill: string;
  ink: string;
  ink2: string;
  accent: string;
  value: string; // e.g. "$2.4M": leading and trailing non-digits become prefix and suffix
  caption: string;
  badge: string;
  stagger: number; // frames between digit columns
  spins: number; // extra full turns before landing
  ease: string;
};

// Timing in frames and type sizes in px at 1080 on the short side.
export const COUNTER = { start: 6, roll: 46, base: 400, baseVertical: 300, digitWidth: 0.6, settle: 10, prefixIn: 20, sepIn: 18, suffixIn: 20, captionAt: 20, captionIn: 22, badgeIn: 18 } as const;

export const parseValue = (s: string) => {
  const first = s.search(/\d/);
  if (first < 0) return { prefix: s, body: "", suffix: "" };
  let last = s.length - 1;
  while (last > first && !/\d/.test(s[last])) last--;
  return { prefix: s.slice(0, first), body: s.slice(first, last + 1), suffix: s.slice(last + 1) };
};

// The digit stagger, tightened for long numbers so the badge lands before the final hold.
export const counterTiming = (value: string, stagger: number, durationInFrames: number) => {
  const digits = (parseValue(value).body.match(/\d/g) ?? []).length;
  const room = durationInFrames - FINAL_HOLD - COUNTER.settle - COUNTER.start - COUNTER.roll;
  const st = Math.max(0, digits > 1 ? Math.min(stagger, room / (digits - 1)) : stagger);
  const rollEnd = COUNTER.start + Math.max(digits - 1, 0) * st + COUNTER.roll;
  return { digits, st, rollEnd };
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
  const blur = Math.min(speed * 5, 7) * u;
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        width: `${COUNTER.digitWidth}em`,
        height: "1.1em",
        overflow: "hidden",
        color,
        filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
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
  const { u, width, isVertical, durationInFrames } = useLayout();
  const { prefix, body, suffix } = parseValue(p.value);
  const chars = Math.max(p.value.length, 1);
  const fs = Math.min((isVertical ? COUNTER.baseVertical : COUNTER.base) * u, (width * 0.84) / (chars * 0.62));
  const spins = Math.max(0, Math.round(p.spins));
  const { st, rollEnd } = counterTiming(p.value, p.stagger, durationInFrames);

  const fadeUp = (from: number, dur: number, dist: number): React.CSSProperties => {
    const t = progress(frame, from, from + dur, p.ease);
    return { opacity: interpolate(t, [0, 0.6], [0, 1], clamp01), transform: `translateY(${(1 - t) * dist * u}px)` };
  };
  const badgeIn = progress(frame, rollEnd - 8, rollEnd - 8 + COUNTER.badgeIn, p.ease);

  let di = 0;
  const bodyNodes = body.split("").map((ch, i) => {
    if (/\d/.test(ch)) {
      const col = di++;
      return <DigitColumn key={i} target={Number(ch)} start={COUNTER.start + col * st} frame={frame} spins={spins} ease={p.ease} u={u} color={p.ink} />;
    }
    return (
      <span key={i} style={{ display: "inline-block", lineHeight: "1.1em", height: "1.1em", color: p.ink, ...fadeUp(COUNTER.start, COUNTER.sepIn, 0) }}>
        {ch}
      </span>
    );
  });

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {p.badge.trim() !== "" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10 * u,
              marginBottom: 28 * u,
              padding: `${10 * u}px ${20 * u}px`,
              borderRadius: 999,
              background: p.fill,
              color: p.ink2,
              fontSize: 26 * u,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
              opacity: badgeIn,
              transform: `translateY(${(1 - badgeIn) * 14 * u}px) scale(${0.92 + 0.08 * badgeIn})`,
            }}
          >
            <svg width={14 * u} height={14 * u} viewBox="0 0 12 12">
              <path d="M6 1.5 11 10H1Z" fill={p.accent} />
            </svg>
            {p.badge}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "flex-start", fontSize: fs, fontWeight: 600, letterSpacing: "-0.045em", lineHeight: "1.1em", fontVariantNumeric: "tabular-nums" }}>
          {prefix !== "" && <span style={{ color: p.ink2, height: "1.1em", whiteSpace: "pre", ...fadeUp(COUNTER.start, COUNTER.prefixIn, 40) }}>{prefix}</span>}
          {bodyNodes}
          {suffix !== "" && <span style={{ color: p.ink2, height: "1.1em", whiteSpace: "pre", ...fadeUp(rollEnd - 14, COUNTER.suffixIn, 40) }}>{suffix}</span>}
        </div>
        {p.caption.trim() !== "" && (
          <div style={{ marginTop: 18 * u, fontSize: 36 * u, fontWeight: 400, letterSpacing: "-0.015em", color: p.ink2, ...fadeUp(COUNTER.captionAt, COUNTER.captionIn, 24) }}>
            {p.caption}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
