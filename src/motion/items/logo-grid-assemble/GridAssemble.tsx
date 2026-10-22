import React from "react";
import { AbsoluteFill, Img, random, useCurrentFrame } from "remotion";
import { CANVAS, FONT_SANS, STAGGER, mix, progress, useLayout } from "../../kit";
import { SAMPLE, sampleLogoFor } from "../../film";

export type GridAssembleProps = {
  background: string;
  accent: string; // the small square before the tagline
  logo: string;
  brand: string;
  tagline: string;
  tiles: number; // tiles per side, 4–8
  scatter: number; // multiplies the 200–500px scatter distance
};

// Ink follows the background, so a custom canvas colour still gets readable type and the right sample logo.
const luminance = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  if (Number.isNaN(n)) return 1;
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
};
export const inkFor = (bg: string) => (luminance(bg) > 0.5 ? CANVAS.paper : CANVAS.ink);

// Timeline in frames (30fps, 150 total). Shared with the prompt so it quotes the real numbers.
export const T = {
  fly: 4, // first (centre) ring leaves
  rings: 8, // distance groups, STAGGER frames apart
  flight: 32, // each tile's spring flight
  gap: [44, 66] as const, // gaps 6px → 0 (travel)
  gapFrom: 6,
  fuse: [64, 70] as const, // one full copy of the logo fades over the tiles
  slide: [56, 82] as const, // mark travels from frame centre to its lockup spot
  word: [72, 94] as const, // wordmark rises out of its mask
  square: [82, 100] as const, // accent square pops (spring)
  tag: [84, 104] as const, // tagline fades and rises
  tagRise: 12,
  scatter: [200, 500] as const,
  rotate: 25,
  scaleFrom: 0.6,
  square_px: 12,
} as const;
export const lastLanding = () => T.fly + (T.rings - 1) * STAGGER + T.flight;

const BASE = {
  wide: { mark: 240, gap: 56, word: 128, tag: 30, tagGap: 18 },
  square: { mark: 200, gap: 44, word: 104, tag: 28, tagGap: 16 },
  vertical: { mark: 300, gap: 64, word: 132, tag: 34, tagGap: 20 },
} as const;

// Inter 600 at -0.03em averages ~0.6em per character; Inter 400 ~0.5em.
export const sizesFor = (brand: string, tagline: string, width: number, height: number, u: number) => {
  const vertical = height > width;
  const b = vertical ? BASE.vertical : width === height ? BASE.square : BASE.wide;
  const mark = b.mark * u;
  const gap = b.gap * u;
  const maxText = vertical ? width * 0.84 : (width === height ? width * 0.74 : width * 0.46) - mark - gap;
  const word = Math.min(b.word * u, maxText / (Math.max(brand.length, 3) * 0.6));
  const sq = T.square_px * u;
  const tag = Math.min(b.tag * u, (maxText - sq * 2) / (Math.max(tagline.length, 8) * 0.52));
  const tagGap = b.tagGap * u;
  const wordW = Math.max(brand.length, 1) * 0.6 * word;
  const tagW = tagline ? tagline.length * 0.5 * tag + sq * 2 : 0;
  const textW = Math.max(wordW, tagW);
  const textH = word * 1.25 + (tagline ? tagGap + tag * 1.3 : 0);
  // Where the mark starts: centred in frame, i.e. offset from its final lockup spot by half the text block.
  const startShift = vertical ? (gap + textH) / 2 : (gap + textW) / 2;
  return { vertical, mark, gap, word, tag, tagGap, sq, startShift };
};

const clampTiles = (n: number) => Math.max(4, Math.min(8, Math.round(n)));
export const tilesOf = (p: Pick<GridAssembleProps, "tiles">) => clampTiles(p.tiles);

const imgStyle = (M: number, left: number, top: number): React.CSSProperties => ({
  position: "absolute",
  left,
  top,
  width: M,
  height: M,
  maxWidth: "none",
  objectFit: "contain",
  display: "block",
});

export const GridAssemble: React.FC<GridAssembleProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, width, height } = useLayout();
  const S = sizesFor(p.brand, p.tagline, width, height, u);
  const tok = inkFor(p.background);
  const src = sampleLogoFor(p.logo || SAMPLE.logo, tok.ink);

  const N = tilesOf(p);
  const M = S.mark;
  const ts = M / N;
  const gap = mix(T.gapFrom * u, 0, progress(frame, T.gap[0], T.gap[1], "travel"));
  const fuse = progress(frame, T.fuse[0], T.fuse[1], "linear");
  const shift = (1 - progress(frame, T.slide[0], T.slide[1], "travel")) * S.startShift;
  const kw = progress(frame, T.word[0], T.word[1], "enter");
  const ks = progress(frame, T.square[0], T.square[1], "spring");
  const kt = progress(frame, T.tag[0], T.tag[1], "enter");

  const half = (N - 1) / 2;
  const maxD = Math.hypot(half, half);
  const tiles =
    fuse < 1
      ? Array.from({ length: N * N }, (_, i) => {
          const c = i % N;
          const r = Math.floor(i / N);
          const cx = c - half;
          const cy = r - half;
          const d = Math.hypot(cx, cy) / maxD;
          const start = T.fly + Math.round(d * (T.rings - 1)) * STAGGER;
          const s = progress(frame, start, start + T.flight, "spring");
          if (s <= 0) return null;
          const seed = `logo-grid-assemble-${N}-${i}`;
          // Scatter roughly outward from home, so every tile visibly flies back toward the centre.
          const angle = d < 0.05 ? random(`${seed}-a`) * Math.PI * 2 : Math.atan2(cy, cx) + (random(`${seed}-a`) - 0.5) * 1.6;
          const dist = mix(T.scatter[0], T.scatter[1], random(`${seed}-d`)) * p.scatter * u * (1 - s);
          const rot = (random(`${seed}-r`) * 2 - 1) * T.rotate * (1 - s);
          const scale = mix(T.scaleFrom, 1, s);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: c * ts + cx * gap,
                top: r * ts + cy * gap,
                width: ts,
                height: ts,
                overflow: "hidden",
                opacity: Math.min(1, s / 0.35),
                transform: `translate(${(Math.cos(angle) * dist).toFixed(2)}px, ${(Math.sin(angle) * dist).toFixed(2)}px) rotate(${rot.toFixed(3)}deg) scale(${scale.toFixed(4)})`,
              }}
            >
              <Img src={src} style={imgStyle(M, -c * ts, -r * ts)} />
            </div>
          );
        })
      : null;

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div style={{ display: "flex", flexDirection: S.vertical ? "column" : "row", alignItems: "center", gap: S.gap }}>
        {/* the mark: N×N slices that fly home, then one full copy fades over them so the seams vanish */}
        <div
          style={{
            position: "relative",
            width: M,
            height: M,
            flexShrink: 0,
            transform: S.vertical ? `translateY(${shift.toFixed(2)}px)` : `translateX(${shift.toFixed(2)}px)`,
          }}
        >
          {tiles}
          {fuse > 0 ? <Img src={src} style={{ ...imgStyle(M, 0, 0), opacity: fuse }} /> : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: S.vertical ? "center" : "flex-start" }}>
          {/* wordmark rises out of an overflow-hidden line (no CSS masks) */}
          <div style={{ overflow: "hidden", lineHeight: 1.25 }}>
            <div
              style={{
                fontSize: S.word,
                fontWeight: 600,
                letterSpacing: "-0.03em",
                lineHeight: 1.25,
                whiteSpace: "nowrap",
                color: tok.ink,
                transform: `translateY(${((1 - kw) * 105).toFixed(2)}%)`,
              }}
            >
              {p.brand}
            </div>
          </div>
          {p.tagline ? (
            <div style={{ display: "flex", alignItems: "center", gap: S.sq, marginTop: S.tagGap }}>
              <div style={{ width: S.sq, height: S.sq, background: p.accent, flexShrink: 0, transform: `scale(${ks.toFixed(4)})` }} />
              <div
                style={{
                  fontSize: S.tag,
                  fontWeight: 400,
                  letterSpacing: "-0.01em",
                  lineHeight: 1.3,
                  whiteSpace: "nowrap",
                  color: tok.ink,
                  opacity: 0.6 * kt,
                  transform: `translateY(${((1 - kt) * T.tagRise * u).toFixed(2)}px)`,
                }}
              >
                {p.tagline}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};
