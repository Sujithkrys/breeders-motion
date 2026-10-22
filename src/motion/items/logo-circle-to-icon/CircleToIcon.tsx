import React from "react";
import { AbsoluteFill, Img, interpolateColors, spring, useCurrentFrame } from "remotion";
import { sampleLogoFor } from "../../film";
import { FONT_SANS, SPRING_CONFIG, mix, progress, useLayout } from "../../kit";

export type CircleToIconProps = {
  background: string;
  tile: string; // the finished app-icon tile
  accent: string; // the dot and the circle
  ink: string; // wordmark
  ink2: string; // tagline
  logo: string;
  brand: string;
  tagline: string;
  corner: number; // final superellipse exponent: 2 is a circle, higher is squarer
};

// Frames, shared with the prompt so it quotes the real timing. [start, end] for curves, [start, length] for springs.
export const T = {
  dot: [2, 12] as const, // the 12px dot fades in and scales 0.5 → 1 (enter)
  grow: [14, 26] as const, // spring: dot → circle
  morph: [36, 62] as const, // travel: circle → squircle, accent → tile
  logo: [54, 74] as const, // enter: the mark fades in and scales 0.8 → 1
  slide: [62, 32] as const, // spring: the tile moves aside, the wordmark slides out from behind it
  tag: [68, 30] as const, // spring: the tagline follows
  total: 120,
} as const;
export const LANDED = Math.max(T.slide[0] + T.slide[1], T.tag[0] + T.tag[1], T.morph[1], T.logo[1]);

export const DOT = 12; // px diameter
export const CIRCLE = 1.2; // the circle's diameter as a multiple of the tile
export const LOGO_BOX = 0.64; // the logo's square box as a fraction of the tile
export const TAG_GAP = 0.14; // tagline gap as a fraction of the wordmark size
export const TRACKING = -0.03;

const BASE = {
  wide: { tile: 240, font: 150, tag: 30, gap: 64, span: 0.5 },
  square: { tile: 200, font: 120, tag: 26, gap: 52, span: 0.82 },
  tall: { tile: 280, font: 150, tag: 34, gap: 72, span: 0.84 },
} as const;

// Inter 500 at -0.03em averages ≈ 0.56em per character; Inter 400 ≈ 0.5em.
export const sizesFor = (brand: string, tagline: string, width: number, height: number, u: number) => {
  const kind = width === height ? "square" : width > height ? "wide" : "tall";
  const b = BASE[kind];
  const tile = b.tile * u;
  const gap = b.gap * u;
  const avail = kind === "tall" ? width * b.span : width * b.span - tile - gap;
  const font = Math.min(b.font * u, avail / (Math.max(brand.length, 3) * 0.56));
  const tag = tagline ? Math.min(b.tag * u, avail / (Math.max(tagline.length, 8) * 0.5)) : 0;
  const blockW = Math.max(brand.length * 0.56 * font, tagline.length * 0.5 * tag);
  const brandH = font * 1.1;
  const tagGap = TAG_GAP * font;
  const blockH = brandH + (tagline ? tagGap + tag * 1.3 : 0);
  return { kind, tile, gap, font, tag, blockW, brandH, tagGap, blockH };
};
type Sizes = ReturnType<typeof sizesFor>;

// Where the tile starts (frame centre) and lands, and where the text block lands.
export const geometry = (S: Sizes, width: number, height: number, vertical: boolean) => {
  const from = { x: width / 2, y: height / 2 };
  if (!vertical) {
    const x0 = (width - (S.tile + S.gap + S.blockW)) / 2;
    return { from, to: { x: x0 + S.tile / 2, y: height / 2 }, text: { x: x0 + S.tile + S.gap, y: height / 2 - S.blockH / 2 } };
  }
  const y0 = (height - (S.tile + S.gap + S.blockH)) / 2;
  return { from, to: { x: width / 2, y: y0 + S.tile / 2 }, text: { x: 0, y: y0 + S.tile + S.gap } };
};

// Superellipse |x/a|^n + |y/a|^n = 1 as a closed SVG path. n = 2 is a circle; n ≈ 5 is an app-icon squircle.
export const SAMPLES = 128;
const superellipse = (cx: number, cy: number, a: number, n: number) => {
  const e = 2 / n;
  let d = "";
  for (let i = 0; i < SAMPLES; i++) {
    const t = (i / SAMPLES) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const x = cx + a * Math.sign(c) * Math.pow(Math.abs(c), e);
    const y = cy + a * Math.sign(s) * Math.pow(Math.abs(s), e);
    d += `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return `${d}Z`;
};

const sp = (frame: number, fps: number, [start, length]: readonly [number, number]) =>
  Math.min(1, spring({ frame: Math.max(0, frame - start), fps, config: SPRING_CONFIG, durationInFrames: length }));

export const CircleToIcon: React.FC<CircleToIconProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, width, height, fps, isVertical } = useLayout();
  const S = sizesFor(p.brand, p.tagline, width, height, u);
  const G = geometry(S, width, height, isVertical);

  const dot = progress(frame, T.dot[0], T.dot[1], "enter");
  const grow = sp(frame, fps, T.grow);
  const morph = progress(frame, T.morph[0], T.morph[1], "travel");
  const logoK = progress(frame, T.logo[0], T.logo[1], "enter");
  const slide = sp(frame, fps, T.slide);
  const tagK = sp(frame, fps, T.tag);

  // Half-size of the shape: 6px dot → circle (1.2 × tile) → the tile itself, while n tightens 2 → corner.
  const half = mix(mix((DOT / 2) * u, (CIRCLE * S.tile) / 2, grow), S.tile / 2, morph) * mix(0.5, 1, dot);
  const n = mix(2, p.corner, morph);
  const fill = morph <= 0 ? p.accent : morph >= 1 ? p.tile : interpolateColors(morph, [0, 1], [p.accent, p.tile]);
  const cx = mix(G.from.x, G.to.x, slide);
  const cy = mix(G.from.y, G.to.y, slide);
  const box = LOGO_BOX * S.tile;

  // The wordmark is clipped at the tile's trailing edge (right on 16:9 and 1:1, bottom on 9:16), so it slides out
  // from behind the tile. Each line starts fully on the hidden side of that edge.
  const clip0 = isVertical ? G.from.y + S.tile / 2 : G.from.x + S.tile / 2;
  const clip = isVertical ? cy + S.tile / 2 : cx + S.tile / 2;
  const margin = 24 * u;
  const lines = [
    { key: "brand", k: slide, dy: 0 },
    { key: "tag", k: tagK, dy: S.brandH + S.tagGap },
  ];
  const along = (k: number, dy: number) =>
    isVertical
      ? { x: 0, y: mix(clip0 - S.blockH - margin + dy, G.text.y + dy, k) }
      : { x: mix(clip0 - S.blockW * 1.15 - margin, G.text.x, k), y: G.text.y + dy };

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS }}>
      <div
        style={{
          position: "absolute",
          overflow: "hidden",
          left: isVertical ? 0 : clip,
          top: isVertical ? clip : 0,
          width: isVertical ? width : Math.max(0, width - clip),
          height: isVertical ? Math.max(0, height - clip) : height,
        }}
      >
        {lines.map(({ key, k, dy }) => {
          if (key === "tag" && !p.tagline) return null;
          const pos = along(k, dy);
          const isBrand = key === "brand";
          return (
            <div
              key={key}
              style={{
                position: "absolute",
                left: isVertical ? 0 : pos.x - clip,
                top: isVertical ? pos.y - clip : pos.y,
                width: isVertical ? width : undefined,
                textAlign: isVertical ? "center" : "left",
                whiteSpace: "nowrap",
                fontSize: isBrand ? S.font : S.tag,
                fontWeight: isBrand ? 500 : 400,
                letterSpacing: isBrand ? `${TRACKING}em` : "-0.01em",
                lineHeight: isBrand ? 1.1 : 1.3,
                color: isBrand ? p.ink : p.ink2,
              }}
            >
              {isBrand ? p.brand : p.tagline}
            </div>
          );
        })}
      </div>

      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", inset: 0, opacity: dot }}>
        <path d={superellipse(cx, cy, half, n)} fill={fill} />
      </svg>

      <div
        style={{
          position: "absolute",
          left: cx - box / 2,
          top: cy - box / 2,
          width: box,
          height: box,
          opacity: logoK,
          transform: `scale(${mix(0.8, 1, logoK).toFixed(4)})`,
        }}
      >
        {/* The sample mark is itself a tile; matching it to the tile colour leaves only its glyph visible. */}
        <Img src={sampleLogoFor(p.logo, p.tile)} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
      </div>
    </AbsoluteFill>
  );
};
