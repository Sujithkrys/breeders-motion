import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { FONT_SANS, alpha, progress, useLayout } from "../../kit";

export type WordSwapProps = {
  background: string;
  ink: string;
  pillInk: string;
  pill1: string;
  pill2: string;
  pill3: string;
  lead: string;
  words: string; // comma-separated, up to 5
  swap: number; // frames each swap takes
  ease: string;
};

export const SWAP = { base: 128, baseVertical: 124, tracking: "-0.04em" } as const;

export const parseSwapWords = (s: string) =>
  s
    .split(",")
    .map((w) => w.trim())
    .filter(Boolean)
    .slice(0, 5);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const WordSwap: React.FC<WordSwapProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, width, durationInFrames, isVertical } = useLayout();
  const parsed = parseSwapWords(p.words);
  const words = parsed.length > 0 ? parsed : ["fast"];
  const n = words.length;
  const seg = durationInFrames / n;
  const k = Math.min(n - 1, Math.floor(frame / seg));
  const local = frame - k * seg;
  // Each word holds, then swaps in the last `swap` frames of its slot; the last slot swaps back to word 1, so it loops.
  const t = n > 1 ? progress(local, seg - p.swap, seg, p.ease) : 0;
  const tc = Math.min(1, Math.max(0, t));
  const from = words[k];
  const to = words[(k + 1) % n];
  const colors = [p.pill1, p.pill2, p.pill3];
  const cFrom = colors[k % 3];
  const cTo = colors[((k + 1) % n) % 3];
  const pillBg = interpolateColors(tc, [0, 1], [cFrom, cTo]);
  const pillGlow = interpolateColors(tc, [0, 1], [alpha(cFrom, 0.35), alpha(cTo, 0.35)]);

  const longestWord = Math.max(1, ...words.map((w) => w.length));
  const chars = isVertical ? Math.max(p.lead.length, longestWord + 1) : p.lead.length + longestWord + 2;
  const fs = Math.min((isVertical ? SWAP.baseVertical : SWAP.base) * u, (width * 0.86) / (Math.max(chars, 1) * 0.56));
  // Mid-swap motion blur peaks at the centre of the move.
  const blur = Math.sin(Math.PI * tc) * 5 * u;

  const wordBox: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    whiteSpace: "nowrap",
    letterSpacing: SWAP.tracking,
  };

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div
        style={{
          display: "flex",
          flexDirection: isVertical ? "column" : "row",
          alignItems: "center",
          gap: isVertical ? "0.22em" : "0.3em",
          fontSize: fs,
          fontWeight: 600,
          lineHeight: 1,
        }}
      >
        <span style={{ color: p.ink, letterSpacing: SWAP.tracking, whiteSpace: "nowrap" }}>{p.lead}</span>
        <span
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            height: "1.24em",
            padding: "0 0.38em",
            borderRadius: 999,
            background: pillBg,
            boxShadow: `0 ${24 * u}px ${60 * u}px ${pillGlow}, inset 0 ${2 * u}px 0 rgba(255,255,255,0.22)`,
            overflow: "hidden",
          }}
        >
          {/* Invisible sizer: text width scales linearly with font size, so two copies at (1 - t) and t of the
              size sum to an exact interpolation between the two words' widths, with no DOM measuring. */}
          <span style={{ display: "inline-flex", height: 0, overflow: "hidden", visibility: "hidden", whiteSpace: "nowrap" }}>
            <span style={{ fontSize: fs * (1 - tc), letterSpacing: SWAP.tracking }}>{from}</span>
            <span style={{ fontSize: fs * tc, letterSpacing: SWAP.tracking }}>{to}</span>
          </span>
          <span
            style={{
              ...wordBox,
              color: p.pillInk,
              transform: `translateY(${-t * 105}%)`,
              opacity: interpolate(tc, [0.15, 0.75], [1, 0], clamp),
              filter: `blur(${blur.toFixed(2)}px)`,
            }}
          >
            {from}
          </span>
          {n > 1 && (
            <span
              style={{
                ...wordBox,
                color: p.pillInk,
                transform: `translateY(${(1 - t) * 105}%)`,
                opacity: interpolate(tc, [0.25, 0.85], [0, 1], clamp),
                filter: `blur(${blur.toFixed(2)}px)`,
              }}
            >
              {to}
            </span>
          )}
        </span>
      </div>
    </AbsoluteFill>
  );
};
