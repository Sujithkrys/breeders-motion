import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FINAL_HOLD, FONT_SANS, progress, useLayout } from "../../kit";

export type WordSwapProps = {
  background: string;
  ink: string; // the lead, and the word on a neutral pill
  fill: string; // the neutral pill
  accent: string; // the accent pill
  onAccent: string; // the word on the accent pill
  accentPill: boolean; // accent pill (on) or neutral fill pill (off)
  lead: string;
  words: string; // comma-separated, up to 5
  swap: number; // frames each swap takes
  ease: string;
};

export const SWAP = {
  base: { wide: 132, square: 112, vertical: 124 },
  tracking: -0.04, // em
  leadWeight: 400,
  wordWeight: 500,
  height: 1.24, // pill height, em
  padX: 0.38, // pill side padding, em
  blur: 3, // px at 1080, peak motion blur mid-swap
} as const;

export const parseSwapWords = (s: string) =>
  s
    .split(",")
    .map((w) => w.trim())
    .filter(Boolean)
    .slice(0, 5);

// The swaps run inside the active window; the final FINAL_HOLD frames hold word 1, which is also frame 0.
export const slotsFor = (total: number, n: number) => (total - FINAL_HOLD) / Math.max(n, 1);

// Inter 400–500 at -0.04em averages ~0.52em per character.
const EM_PER_CHAR = 0.54;
export const swapSize = (lead: string, words: string[], width: number, height: number, u: number) => {
  const wide = width > height;
  const vertical = height > width;
  const safeX = wide ? 96 * u : width * 0.08;
  const longest = Math.max(1, ...words.map((w) => w.length));
  // the pill adds 2 × 0.38em of padding ≈ 1.5 characters; on 16:9 the lead and the pill share one row, on 1:1 and
  // 9:16 the pill sits under the lead
  const chars = wide ? lead.length + longest + 1.5 + 0.5 : Math.max(lead.length, longest + 1.5);
  const base = (wide ? SWAP.base.wide : vertical ? SWAP.base.vertical : SWAP.base.square) * u;
  return Math.min(base, (width - 2 * safeX) / (Math.max(chars, 1) * EM_PER_CHAR));
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const WordSwap: React.FC<WordSwapProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, width, height, durationInFrames } = useLayout();
  const stacked = width <= height;
  const parsed = parseSwapWords(p.words);
  const words = parsed.length > 0 ? parsed : ["fast"];
  const n = words.length;
  const slot = slotsFor(durationInFrames, n);
  const active = durationInFrames - FINAL_HOLD;
  // Each word holds, then swaps in the last `swap` frames of its slot; the last slot swaps back to word 1 and that
  // state holds through the final frames, so the loop ends exactly where it starts.
  const inHold = frame >= active;
  const k = inHold ? 0 : Math.min(n - 1, Math.floor(frame / slot));
  const local = frame - k * slot;
  const t = n > 1 && !inHold ? progress(local, slot - p.swap, slot, p.ease) : 0;
  const tc = Math.min(1, Math.max(0, t));
  const from = words[k];
  const to = words[(k + 1) % n];

  const fs = swapSize(p.lead, words, width, height, u);
  // light motion blur, peaking at the centre of the move
  const blur = Math.sin(Math.PI * tc) * SWAP.blur * u;
  const pillBg = p.accentPill ? p.accent : p.fill;
  const pillInk = p.accentPill ? p.onAccent : p.ink;

  const wordBox: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    whiteSpace: "nowrap",
    color: pillInk,
    letterSpacing: `${SWAP.tracking}em`,
  };

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div
        style={{
          display: "flex",
          flexDirection: stacked ? "column" : "row",
          alignItems: "center",
          gap: stacked ? "0.2em" : "0.26em",
          fontSize: fs,
          lineHeight: 1,
        }}
      >
        <span style={{ color: p.ink, fontWeight: SWAP.leadWeight, letterSpacing: `${SWAP.tracking}em`, whiteSpace: "nowrap" }}>{p.lead}</span>
        <span
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            height: `${SWAP.height}em`,
            padding: `0 ${SWAP.padX}em`,
            borderRadius: 999,
            background: pillBg,
            fontWeight: SWAP.wordWeight,
            overflow: "hidden",
          }}
        >
          {/* Invisible sizer: text width scales linearly with font size, so two copies at (1 - t) and t of the
              size sum to an exact interpolation between the two words' widths, with no DOM measuring. */}
          <span style={{ display: "inline-flex", height: 0, overflow: "hidden", visibility: "hidden", whiteSpace: "nowrap" }}>
            <span style={{ fontSize: fs * (1 - tc), letterSpacing: `${SWAP.tracking}em` }}>{from}</span>
            <span style={{ fontSize: fs * tc, letterSpacing: `${SWAP.tracking}em` }}>{to}</span>
          </span>
          <span
            style={{
              ...wordBox,
              transform: `translateY(${(-t * 105).toFixed(3)}%)`,
              opacity: interpolate(tc, [0.1, 0.6], [1, 0], clamp),
              filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
            }}
          >
            {from}
          </span>
          {n > 1 && tc > 0 && (
            <span
              style={{
                ...wordBox,
                transform: `translateY(${((1 - t) * 105).toFixed(3)}%)`,
                opacity: interpolate(tc, [0.3, 0.85], [0, 1], clamp),
                filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
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
