import React from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";
import { FONT_SANS, STAGGER, STROKE, progress, useLayout } from "../../kit";
import { sampleLogoFor } from "../../film";

export type ShutterSlicesProps = {
  background: string;
  ink: string; // wordmark, tagline (at 60%)
  accent: string; // the hairline rule under the wordmark
  logo: string;
  brand: string;
  tagline: string;
  slices: number; // 5–12 horizontal bands
};

// Shared with the prompt so it quotes the real frames and sizes.
export const SHUTTER = {
  start: 8, // first slice starts
  slide: 28, // each slice's travel
  fade: 8, // each slice fades in over its first frames, so nothing sits half-off-screen before it moves
  travel: 0.6, // start offset, as a share of the frame width
  skew: 2, // degrees, settling to 0
  rule: [3, 21] as const, // after lock: the accent rule draws
  tag: [8, 28] as const, // after lock: the tagline rises in
  tagRise: 16,
  ruleY: 1.16, // rule top, in em of the wordmark from the top of its line box
  pad: 0.18, // the sliced band covers the lockup plus this much of the wordmark size above and below (descenders)
} as const;

// Lockup geometry per ratio, px at 1080 on the short side. `share` caps the lockup's width as a share of the frame.
export const LOCKUP = {
  wide: { mark: 168, font: 150, gap: 44, share: 0.46 },
  square: { mark: 140, font: 124, gap: 36, share: 0.74 },
  tall: { mark: 208, font: 148, gap: 52, share: 0.8 },
  weight: 500,
  tracking: -0.035,
  tag: { wide: 34, tall: 38, gap: 40 },
} as const;

export const sliceCount = (n: number) => Math.round(Math.min(12, Math.max(5, n || 8)));
export const sliceStart = (i: number) => SHUTTER.start + i * STAGGER;
export const lockFrame = (n: number) => sliceStart(sliceCount(n) - 1) + SHUTTER.slide;

// Inter 500 at -0.035em ≈ 0.58em per character.
export const lockupLayout = (brand: string, hasTag: boolean, width: number, height: number, u: number) => {
  const vertical = height > width;
  const L = vertical ? LOCKUP.tall : width === height ? LOCKUP.square : LOCKUP.wide;
  const mark = L.mark * u;
  const gap = L.gap * u;
  const room = width * L.share - (vertical ? 0 : mark + gap);
  const font = Math.min(L.font * u, room / (Math.max(brand.length, 3) * 0.58));
  const rowH = vertical ? mark + gap + font : Math.max(mark, font);
  const tagSize = (vertical ? LOCKUP.tag.tall : LOCKUP.tag.wide) * u;
  const tagGap = 0.2 * font + LOCKUP.tag.gap * u; // clears the rule under the wordmark
  const tagH = tagSize * 1.3;
  const groupH = rowH + (hasTag ? tagGap + tagH : 0);
  const rowTop = (height - groupH) / 2;
  return { vertical, mark, gap, font, rowH, rowTop, tagSize, tagTop: rowTop + rowH + tagGap, tagH };
};
type Layout = ReturnType<typeof lockupLayout>;

// The lockup row, laid out on the full frame so every slice copy lines up exactly with the others.
// Copies are cheap: one Img and one text node. `children` go inside the wordmark box (the rule).
const LockupRow: React.FC<{ L: Layout; src: string; brand: string; ink: string; width: number; children?: React.ReactNode }> = ({
  L,
  src,
  brand,
  ink,
  width,
  children,
}) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: L.rowTop,
      width,
      height: L.rowH,
      display: "flex",
      flexDirection: L.vertical ? "column" : "row",
      alignItems: "center",
      justifyContent: "center",
      gap: L.gap,
    }}
  >
    <Img src={src} style={{ width: L.mark, height: L.mark, objectFit: "contain", display: "block", flexShrink: 0 }} />
    <div
      style={{
        position: "relative",
        fontSize: L.font,
        fontWeight: LOCKUP.weight,
        letterSpacing: `${LOCKUP.tracking}em`,
        lineHeight: 1,
        whiteSpace: "nowrap",
        color: ink,
      }}
    >
      {brand}
      {children}
    </div>
  </div>
);

export const ShutterSlices: React.FC<ShutterSlicesProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, width, height } = useLayout();
  const n = sliceCount(p.slices);
  const lock = lockFrame(n);
  const hasTag = p.tagline.trim().length > 0;
  const L = lockupLayout(p.brand, hasTag, width, height, u);
  const src = sampleLogoFor(p.logo, p.ink);

  // The sliced band spans the lockup plus a little room for descenders.
  const pad = SHUTTER.pad * L.font;
  const regionTop = L.rowTop - pad;
  const bh = (L.rowH + 2 * pad) / n;

  const kRule = progress(frame, lock + SHUTTER.rule[0], lock + SHUTTER.rule[1], "enter");
  const kTag = progress(frame, lock + SHUTTER.tag[0], lock + SHUTTER.tag[1], "enter");

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS, overflow: "hidden" }}>
      {frame < lock
        ? Array.from({ length: n }, (_, i) => {
            const s = sliceStart(i);
            if (frame < s) return null;
            const k = progress(frame, s, s + SHUTTER.slide, "travel");
            const o = interpolate(frame, [s, s + SHUTTER.fade], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const dir = i % 2 === 0 ? -1 : 1; // even slices from the left, odd from the right
            const top = regionTop + i * bh;
            // lean into the direction of travel: top edge ahead
            const dx = dir * (1 - k) * SHUTTER.travel * width;
            const skew = dir * (1 - k) * SHUTTER.skew;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 0,
                  top,
                  width,
                  height: bh,
                  overflow: "hidden",
                  opacity: o,
                  transform: `translateX(${dx.toFixed(2)}px) skewX(${skew.toFixed(3)}deg)`,
                }}
              >
                <div style={{ position: "absolute", left: 0, top: -top, width, height }}>
                  <LockupRow L={L} src={src} brand={p.brand} ink={p.ink} width={width} />
                </div>
              </div>
            );
          })
        : (
          // Locked: one clean, unsliced lockup (identical position), so no hairline seams remain between bands.
          <LockupRow L={L} src={src} brand={p.brand} ink={p.ink} width={width}>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: SHUTTER.ruleY * L.font,
                width: "100%",
                height: STROKE.hair * u,
                background: p.accent,
                transformOrigin: "0 50%",
                transform: `scaleX(${kRule.toFixed(4)})`,
              }}
            />
          </LockupRow>
        )}

      {hasTag ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: L.tagTop,
            width,
            textAlign: "center",
            fontSize: L.tagSize,
            fontWeight: 400,
            letterSpacing: "-0.01em",
            lineHeight: 1.3,
            whiteSpace: "nowrap",
            color: p.ink,
            opacity: 0.6 * kTag,
            transform: `translateY(${((1 - kTag) * SHUTTER.tagRise * u).toFixed(2)}px)`,
          }}
        >
          {p.tagline}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
