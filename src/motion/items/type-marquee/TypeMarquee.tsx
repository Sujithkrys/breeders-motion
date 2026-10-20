import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FONT_SANS, easing, useLayout } from "../../kit";

export type TypeMarqueeProps = {
  background: string;
  ink: string;
  quiet: string;
  accent: string;
  words: string; // comma-separated
  laps: number; // how many word-sets each row travels per loop
  tilt: number; // degrees
  motion: string; // "linear" or an EASES name, applied per lap
};

export const MARQUEE = { size: 220, sizeVertical: 190, rowGap: 0.06 } as const;

export const parseWords = (s: string) =>
  s
    .split(",")
    .map((w) => w.trim())
    .filter(Boolean)
    .slice(0, 6);

const Star: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0 }}>
    <path d="M12 0c.8 6.6 4.4 10.4 12 12-7.6 1.6-11.2 5.4-12 12-.8-6.6-4.4-10.4-12-12C7.6 10.4 11.2 6.6 12 0Z" fill={color} />
  </svg>
);

// A row holds `copies` identical word-sets and travels exactly one set per lap, so the seam never shows.
const Row: React.FC<{ words: string[]; copies: number; shift: number; reverse: boolean; color: string; accent: string; fs: number; weight: number }> = ({
  words,
  copies,
  shift,
  reverse,
  color,
  accent,
  fs,
  weight,
}) => {
  const pct = (100 / copies) * (reverse ? 1 - shift : shift);
  return (
    <div style={{ display: "flex", width: "max-content", transform: `translateX(${-pct}%)`, alignSelf: "flex-start" }}>
      {Array.from({ length: copies }, (_, c) =>
        words.map((w, i) => (
          <div key={`${c}-${i}`} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <span style={{ fontSize: fs, fontWeight: weight, letterSpacing: "-0.045em", lineHeight: 1, color, whiteSpace: "nowrap", padding: `0 ${fs * 0.2}px` }}>{w}</span>
            <Star size={fs * 0.34} color={accent} />
          </div>
        )),
      )}
    </div>
  );
};

export const TypeMarquee: React.FC<TypeMarqueeProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, width, durationInFrames, isVertical } = useLayout();
  const parsed = parseWords(p.words);
  const words = parsed.length > 0 ? parsed : ["Motion"];
  const fs = (isVertical ? MARQUEE.sizeVertical : MARQUEE.size) * u;
  const laps = Math.max(1, Math.round(p.laps));
  const t = (frame / durationInFrames) * laps;
  const lap = Math.floor(t);
  const ease = p.motion === "linear" ? (x: number) => x : easing(p.motion);
  // Fractional position inside the current lap; whole laps land on an identical copy, so the loop is seamless.
  const shift = (((lap + ease(t - lap)) % 1) + 1) % 1;
  const rows = isVertical ? 3 : 2;
  // Deliberately under-estimates a set's width (0.5em per character) so short word lists still get enough copies
  // to cover the 150%-wide band plus one set of travel.
  const setWidth = words.reduce((sum, w) => sum + w.length * 0.5 * fs + 0.4 * fs + 0.34 * fs, 0);
  const copies = Math.min(10, Math.max(3, Math.ceil((width * 1.5) / setWidth) + 1));

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          maskImage: "linear-gradient(90deg, transparent 0%, black 14%, black 86%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 14%, black 86%, transparent 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "-25%",
            width: "150%",
            top: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: fs * MARQUEE.rowGap,
            transform: `rotate(${p.tilt}deg)`,
          }}
        >
          {Array.from({ length: rows }, (_, r) => {
            // Rotate the word order per row so the same word never stacks above itself.
            const order = words.map((_, i) => words[(i + r * 2) % words.length]);
            const odd = r % 2 === 1;
            return <Row key={r} words={order} copies={copies} shift={shift} reverse={odd} color={odd ? p.quiet : p.ink} accent={p.accent} fs={fs} weight={odd ? 600 : 700} />;
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
