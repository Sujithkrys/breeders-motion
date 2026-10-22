import React from "react";
import { AbsoluteFill, Img, random, useCurrentFrame } from "remotion";
import { CANVAS, FONT_MONO, FONT_SANS, STROKE, mix, progress, useLayout } from "../../kit";
import { SAMPLE, sampleLogoFor } from "../../film";

export type PixelDissolveProps = {
  background: string;
  accent: string; // cell flashes, scanline, caret
  logo: string;
  brand: string;
  tagline: string;
  cells: number; // cells per side, 8–12
  speed: number; // plays the whole timeline faster or slower
};

// Ink follows the background, so a custom canvas colour still gets readable type and the right sample logo.
const luminance = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  if (Number.isNaN(n)) return 1;
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
};
export const inkFor = (bg: string) => (luminance(bg) > 0.5 ? CANVAS.paper : CANVAS.ink);

// Timeline in frames at speed 1 (30fps, 150 total). Shared with the prompt so it quotes the real numbers.
export const T = {
  cellsFrom: 4, // first cells pop
  window: 40, // all cells start within this many frames
  beat: 2, // cells start on a 2-frame grid: the "digital" rhythm
  steps: [0.34, 0.67, 1] as const, // scale steps, one frame each, filled with the accent
  flashHold: 1, // one more accent frame at full size, then the slice shows
  scan: [32, 46] as const, // scanline sweeps top → bottom (linear) as the last cells land
  scanFade: 3,
  slide: [40, 62] as const, // mark travels from frame centre to its lockup spot
  caret: 58, // caret appears at the start of the wordmark
  type: 62, // first letter
  typeWindow: 21, // all letters typed within this many frames
  typeMax: 3, // at most 3 frames per letter
  blinkHold: 4, // caret stays solid after the last letter
  blink: 5, // each off / on phase of the two blinks
  tagDelay: 3, // tagline starts this many frames after typing ends
  tagLen: 20,
  tagRise: 12,
} as const;

export const cellFrames = () => T.steps.length + T.flashHold; // frames from pop to slice
export const typeInterval = (brand: string) => Math.min(T.typeMax, T.typeWindow / Math.max(1, Array.from(brand).length));
export const typeEnd = (brand: string) => T.type + Array.from(brand).length * typeInterval(brand);
export const caretGone = (brand: string) => typeEnd(brand) + T.blinkHold + T.blink * 4;
export const settled = (brand: string) => Math.max(caretGone(brand), typeEnd(brand) + T.tagDelay + T.tagLen);

const BASE = {
  wide: { mark: 240, gap: 56, word: 128, tag: 22, tagGap: 22 },
  square: { mark: 200, gap: 44, word: 104, tag: 20, tagGap: 18 },
  vertical: { mark: 300, gap: 64, word: 132, tag: 26, tagGap: 24 },
} as const;

// Inter 500 at -0.03em averages ~0.6em per character; Geist Mono caps at +0.1em ~0.7em.
export const sizesFor = (brand: string, tagline: string, width: number, height: number, u: number) => {
  const vertical = height > width;
  const b = vertical ? BASE.vertical : width === height ? BASE.square : BASE.wide;
  const mark = b.mark * u;
  const gap = b.gap * u;
  const maxText = vertical ? width * 0.84 : (width === height ? width * 0.74 : width * 0.46) - mark - gap;
  const word = Math.min(b.word * u, maxText / (Math.max(brand.length, 3) * 0.6));
  const tag = Math.min(b.tag * u, maxText / (Math.max(tagline.length, 8) * 0.7));
  const tagGap = b.tagGap * u;
  const textW = Math.max(Math.max(brand.length, 1) * 0.6 * word, tagline ? tagline.length * 0.7 * tag : 0);
  const textH = word * 1.25 + (tagline ? tagGap + tag * 1.3 : 0);
  const startShift = vertical ? (gap + textH) / 2 : (gap + textW) / 2;
  return { vertical, mark, gap, word, tag, tagGap, startShift };
};

export const cellsOf = (p: Pick<PixelDissolveProps, "cells">) => Math.max(8, Math.min(12, Math.round(p.cells)));

// Seeded noise order: each cell gets a random key; its rank in that order sets its start, quantised to the beat.
const useStarts = (N: number) =>
  React.useMemo(() => {
    const keys = Array.from({ length: N * N }, (_, i) => ({ i, k: random(`logo-pixel-dissolve-${N}-${i}`) }));
    keys.sort((a, b) => a.k - b.k);
    const starts = new Array<number>(N * N);
    keys.forEach(({ i }, rank) => {
      starts[i] = T.cellsFrom + Math.floor(((rank / (N * N)) * T.window) / T.beat) * T.beat;
    });
    return starts;
  }, [N]);

export const PixelDissolve: React.FC<PixelDissolveProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, width, height } = useLayout();
  const S = sizesFor(p.brand, p.tagline, width, height, u);
  const tok = inkFor(p.background);
  const src = sampleLogoFor(p.logo || SAMPLE.logo, tok.ink);
  const speed = Math.max(0.5, p.speed);
  const t = frame * speed; // continuous timeline (slide, scanline, tagline)
  const tf = Math.floor(t); // stepped timeline (cells, typing, caret)

  const N = cellsOf(p);
  const M = S.mark;
  const cs = M / N;
  const starts = useStarts(N);
  const e = Math.max(1, u); // covers overlap by this much so no seam of the logo shows through

  // Each cell is ONE div over a single full copy of the logo: a border in the background colour covers the cell,
  // and its hole (the content box) grows from the centre in steps, filled with the accent, then turns clear so the
  // logo's slice shows. Landed cells are removed, so the DOM shrinks as the mark resolves.
  const covers = Array.from({ length: N * N }, (_, i) => {
    const local = tf - starts[i];
    if (local >= cellFrames()) return null;
    const s = local < 0 ? 0 : T.steps[Math.min(local, T.steps.length - 1)];
    const c = i % N;
    const r = Math.floor(i / N);
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: c * cs - e,
          top: r * cs - e,
          width: cs + 2 * e,
          height: cs + 2 * e,
          boxSizing: "border-box",
          border: `${(e + ((1 - s) * cs) / 2).toFixed(3)}px solid ${p.background}`,
          background: local >= 0 ? p.accent : "transparent",
        }}
      />
    );
  });

  const scanK = progress(t, T.scan[0], T.scan[1], "linear");
  const scanOn = t >= T.scan[0] && t < T.scan[1] + T.scanFade;
  const scanOpacity = 1 - progress(t, T.scan[1], T.scan[1] + T.scanFade, "linear");
  const shift = (1 - progress(t, T.slide[0], T.slide[1], "travel")) * S.startShift;

  // Typing: letters keep their space while hidden, so the lockup never shifts.
  const letters = Array.from(p.brand);
  const iv = typeInterval(p.brand);
  const typed = tf < T.type ? 0 : Math.min(letters.length, Math.floor((tf - T.type) / iv) + 1);
  const end = typeEnd(p.brand);
  const after = tf - end - T.blinkHold;
  const caretOn = tf >= T.caret && tf < caretGone(p.brand) && (after < 0 || Math.floor(after / T.blink) % 2 === 1);
  const caretW = 0.42;
  const caretGap = 0.06;

  const tagStart = end + T.tagDelay;
  const kt = progress(t, tagStart, tagStart + T.tagLen, "enter");

  const caret = (
    <span
      style={{
        display: "inline-block",
        width: `${caretW}em`,
        height: "0.74em",
        marginLeft: `${caretGap}em`,
        marginRight: `${-(caretW + caretGap)}em`,
        verticalAlign: "baseline",
        background: p.accent,
        opacity: caretOn ? 1 : 0,
      }}
    />
  );

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div style={{ display: "flex", flexDirection: S.vertical ? "column" : "row", alignItems: "center", gap: S.gap }}>
        <div
          style={{
            position: "relative",
            width: M,
            height: M,
            flexShrink: 0,
            transform: S.vertical ? `translateY(${shift.toFixed(2)}px)` : `translateX(${shift.toFixed(2)}px)`,
          }}
        >
          <Img src={src} style={{ position: "absolute", left: 0, top: 0, width: M, height: M, maxWidth: "none", objectFit: "contain", display: "block" }} />
          {covers}
          {scanOn ? (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: mix(0, M, scanK) - (STROKE.ring * u) / 2,
                width: M,
                height: STROKE.ring * u,
                background: p.accent,
                opacity: scanOpacity,
              }}
            />
          ) : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: S.vertical ? "center" : "flex-start" }}>
          <div
            style={{
              fontSize: S.word,
              fontWeight: 500,
              letterSpacing: "-0.03em",
              lineHeight: 1.25,
              whiteSpace: "nowrap",
              color: tok.ink,
            }}
          >
            {typed === 0 ? caret : null}
            {letters.map((ch, i) => (
              <React.Fragment key={i}>
                <span style={{ opacity: i < typed ? 1 : 0 }}>{ch === " " ? " " : ch}</span>
                {typed === i + 1 ? caret : null}
              </React.Fragment>
            ))}
          </div>
          {p.tagline ? (
            <div
              style={{
                marginTop: S.tagGap,
                fontFamily: FONT_MONO,
                fontSize: S.tag,
                fontWeight: 400,
                letterSpacing: "0.1em",
                lineHeight: 1.3,
                whiteSpace: "nowrap",
                color: tok.ink,
                opacity: 0.6 * kt,
                transform: `translateY(${((1 - kt) * T.tagRise * u).toFixed(2)}px)`,
              }}
            >
              {p.tagline.toUpperCase()}
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};
