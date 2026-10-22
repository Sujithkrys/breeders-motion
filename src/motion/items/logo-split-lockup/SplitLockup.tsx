import React from "react";
import { AbsoluteFill, Img, useCurrentFrame } from "remotion";
import { sampleLogoFor } from "../../film";
import { FONT_SANS, STROKE, mix, progress, useLayout } from "../../kit";

export type SplitLockupProps = {
  background: string;
  ink: string; // wordmark and tagline
  accent: string; // the cut line
  logo: string;
  brand: string;
  tagline: string;
  gap: number; // px between each open half and the wordmark
};

// Shared with the prompt so it quotes the real frames and sizes.
export const SPLIT = {
  intro: [0, 22] as const, // the mark springs in alone, centred and large
  fade: 12,
  cutIn: [20, 32] as const, // an accent cut line draws through the mark's centre
  cutOut: [32, 44] as const, // ...and retracts out of the far end as the halves part
  open: [32, 60] as const, // halves part like doors and shrink to lockup size
  word: [42, 64] as const, // the wordmark rises from its mask between them
  close: [68, 96] as const, // the far half slides through the wordmark and rejoins; the lockup recentres
  tagline: [92, 112] as const,
  hero: 320,
  heroFrom: 0.9,
  overhang: 28, // the cut line runs this far past the mark on both sides
  rise: 12, // tagline rise
  mark: { wide: 168, square: 124, vertical: 220 },
  wordSize: { wide: 168, square: 124, vertical: 150 },
  tag: { wide: 34, square: 30, vertical: 40 },
  join: { wide: 48, square: 36, vertical: 64 }, // mark → wordmark in the final lockup
  tagGap: { wide: 44, square: 36, vertical: 48 },
  weight: 600,
  tracking: -0.03,
  pad: 0.06, // wordmark mask padding, em (keeps tight tracking from clipping the last glyph)
} as const;

type Regime = "wide" | "square" | "vertical";

// Inter 600 at -0.03em ≈ 0.6em per character. The wordmark shrinks for long names so the lockup stays in frame.
export const sizesFor = (p: Pick<SplitLockupProps, "brand" | "tagline">, width: number, height: number, u: number) => {
  const r: Regime = height > width ? "vertical" : width === height ? "square" : "wide";
  const maxWord = r === "vertical" ? width * 0.8 : r === "square" ? width * 0.42 : width * 0.34;
  const maxTag = width * (r === "vertical" ? 0.84 : 0.6);
  const mark = SPLIT.mark[r] * u;
  const word = Math.min(SPLIT.wordSize[r] * u, maxWord / (Math.max(p.brand.length, 3) * 0.6));
  return {
    regime: r,
    mark,
    word,
    tag: Math.min(SPLIT.tag[r] * u, maxTag / (Math.max(p.tagline.length, 8) * 0.5)),
    join: SPLIT.join[r] * u,
    tagGap: SPLIT.tagGap[r] * u,
    // The wordmark's mask is at least as deep as the mark, so the far half is fully hidden while it passes behind.
    slot: r === "vertical" ? word * 1.25 : Math.max(word * 1.25, mark + 8 * u),
    slotMin: r === "vertical" ? mark + 8 * u : 0,
  };
};

const at = (pct: number, px: number) => `calc(${pct.toFixed(4)}% + ${px.toFixed(2)}px)`;

export const SplitLockup: React.FC<SplitLockupProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, width, height } = useLayout();
  const Z = sizesFor(p, width, height, u);
  const V = Z.regime === "vertical"; // split top / bottom, wordmark below
  const Mf = Z.mark;
  const g = Z.join;
  const gap = p.gap * u;

  const kIn = progress(frame, SPLIT.intro[0], SPLIT.intro[1], "spring");
  const kFade = progress(frame, 0, SPLIT.fade, "enter");
  const tOpen = progress(frame, SPLIT.open[0], SPLIT.open[1], "travel");
  const tClose = progress(frame, SPLIT.close[0], SPLIT.close[1], "travel");
  const kWord = progress(frame, SPLIT.word[0], SPLIT.word[1], "enter");
  const kTag = progress(frame, SPLIT.tagline[0], SPLIT.tagline[1], "enter");
  const cutIn = progress(frame, SPLIT.cutIn[0], SPLIT.cutIn[1], "enter");
  const cutOut = progress(frame, SPLIT.cutOut[0], SPLIT.cutOut[1], "exit");

  // Mark size: the hero springs 0.9 → 1, then shrinks to lockup size while the halves part.
  const S = mix(SPLIT.hero * u * mix(SPLIT.heroFrom, 1, kIn), Mf, tOpen);

  // The row is [mark slot][join][wordmark][trailing spacer], centred by flex. While open, a negative lead margin and
  // a trailing spacer make it symmetric about the wordmark (half · gap · word · gap · half), so the wordmark is
  // centred in frame; as the doors close both collapse to 0 and the row recentres on the final lockup.
  // Halves are placed in % of the row, so their positions are exact whatever the wordmark's real width.
  const open = 1 - tClose;
  const lead = (gap - Mf / 2 - g) * open;
  const trail = (gap + Mf / 2) * open;

  // Main-axis positions (left in a row, top in a column), in % of the row plus px.
  // First half: centre of the row → row start (and stays there). Second half: centre → just past the wordmark
  // (100% − Mf/2) → beside the first half (Mf/2), travelling behind the wordmark's mask on the way back.
  const first = { pct: (1 - tOpen) * 50, px: -(1 - tOpen) * (S / 2) };
  const second = {
    pct: mix(mix(50, 100, tOpen), 0, tClose),
    px: mix(mix(0, -Mf / 2, tOpen), Mf / 2, tClose),
  };
  const ov = 0.75; // the halves overlap by a hair so the closed mark shows no seam
  const behind = frame >= SPLIT.close[0]; // the second half passes behind the wordmark's mask only while closing

  // Box helpers for the two axes (main = along the split's travel; cross = along the seam).
  const box = (main: string | number, cross: string | number, mainLen: number, crossLen: number): React.CSSProperties =>
    V ? { top: main, left: cross, height: mainLen, width: crossLen } : { left: main, top: cross, width: mainLen, height: crossLen };
  const along = (len: number): React.CSSProperties => (V ? { height: len } : { width: len });
  const src = sampleLogoFor(p.logo, p.ink);

  const half = (which: 0 | 1) => {
    const pos = which === 0 ? first : second;
    return (
      <div
        style={{
          position: "absolute",
          ...box(at(pos.pct, pos.px - (which === 1 ? ov : 0)), at(50, -S / 2), S / 2 + ov, S),
          overflow: "hidden",
          opacity: kFade,
          zIndex: which === 1 && behind ? 1 : 3,
        }}
      >
        <Img
          src={src}
          style={{
            position: "absolute",
            ...box(which === 0 ? 0 : -(S / 2 - ov), 0, S, S),
            maxWidth: "none",
            objectFit: "contain",
            display: "block",
          }}
        />
      </div>
    );
  };

  // The accent cut: draws through the mark along the seam, then retracts out of the far end as the halves part.
  const cutLen = S + 2 * SPLIT.overhang * u;
  const cutScale = frame < SPLIT.cutOut[0] ? cutIn : 1 - cutOut;
  const cutOrigin = frame < SPLIT.cutOut[0] ? (V ? "left center" : "center top") : V ? "right center" : "center bottom";
  const cutW = STROKE.ring * u;

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div style={{ position: "relative", display: "flex", flexDirection: V ? "column" : "row", alignItems: "center" }}>
        {/* the final mark's slot (the halves are drawn absolutely, above) */}
        <div style={{ flexShrink: 0, width: Mf, height: Mf, ...(V ? { marginTop: lead } : { marginLeft: lead }) }} />
        <div style={{ flexShrink: 0, ...along(g) }} />
        {/* the wordmark rises inside its own mask; the mask is filled with the background so the returning half can
            pass behind it */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            flexShrink: 0,
            overflow: "hidden",
            background: p.background,
            height: Z.slot,
            minWidth: Z.slotMin,
            padding: `0 ${(SPLIT.pad * Z.word).toFixed(2)}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: Z.word,
              fontWeight: SPLIT.weight,
              letterSpacing: `${SPLIT.tracking}em`,
              lineHeight: 1,
              whiteSpace: "nowrap",
              color: p.ink,
              transform: `translateY(${((1 - kWord) * Z.slot).toFixed(2)}px)`,
            }}
          >
            {p.brand}
          </div>
        </div>
        <div style={{ flexShrink: 0, ...along(trail) }} />

        {half(0)}
        {half(1)}

        {cutScale > 0 ? (
          <div
            style={{
              position: "absolute",
              zIndex: 4,
              ...box(at(50, -cutW / 2), at(50, -cutLen / 2), cutW, cutLen),
              borderRadius: cutW,
              background: p.accent,
              transformOrigin: cutOrigin,
              transform: V ? `scaleX(${cutScale.toFixed(4)})` : `scaleY(${cutScale.toFixed(4)})`,
            }}
          />
        ) : null}

        {p.tagline ? (
          <div
            style={{
              position: "absolute",
              top: `calc(100% + ${Z.tagGap.toFixed(2)}px)`,
              left: "50%",
              fontSize: Z.tag,
              fontWeight: 400,
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              color: p.ink,
              opacity: 0.6 * kTag,
              transform: `translate(-50%, ${((1 - kTag) * SPLIT.rise * u).toFixed(2)}px)`,
            }}
          >
            {p.tagline}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
