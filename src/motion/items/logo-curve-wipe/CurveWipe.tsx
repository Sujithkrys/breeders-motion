import React from "react";
import { AbsoluteFill, Img, useCurrentFrame } from "remotion";
import { sampleLogoFor } from "../../film";
import { FONT_SANS, mix, progress, useLayout } from "../../kit";

export type CurveWipeProps = {
  background: string;
  ink: string; // wordmark and tagline
  accent: string; // the first field
  logo: string;
  brand: string;
  tagline: string;
  direction: string; // "left" (sweeps left → right) or "up" (sweeps bottom → top)
};

// Shared with the prompt so it quotes the real frames and sizes.
export const WIPE = {
  accent: [4, 34] as const, // the accent field's leading edge crosses the frame
  field: [22, 56] as const, // the background field's leading edge follows, uncovering the lockup
  push: [24, 68] as const, // the lockup's parallax push while it is uncovered
  tagline: [60, 80] as const, // tagline fades in after the wipe
  pushPx: 12,
  rise: 12, // tagline rise
  bow: 0.13, // apex depth of the curved edge, as a fraction of the edge's length
  bowRest: 0.45, // the bow is shallower at rest and deepest mid-sweep (it bends with speed)
  mark: { wide: 152, square: 116, vertical: 208 },
  word: { wide: 156, square: 118, vertical: 150 },
  tag: { wide: 34, square: 30, vertical: 40 },
  gap: { wide: 46, square: 36, vertical: 56 }, // mark → wordmark
  tagGap: { wide: 44, square: 36, vertical: 44 },
  weight: 600,
  tracking: -0.03,
} as const;

type Regime = "wide" | "square" | "vertical";

// Inter 600 at -0.03em ≈ 0.6em per character. The wordmark shrinks for long names so the lockup stays in frame.
export const sizesFor = (p: Pick<CurveWipeProps, "brand" | "tagline">, width: number, height: number, u: number) => {
  const r: Regime = height > width ? "vertical" : width === height ? "square" : "wide";
  const maxWord = r === "vertical" ? width * 0.82 : r === "square" ? width * 0.5 : width * 0.34;
  const maxTag = width * (r === "vertical" ? 0.84 : 0.6);
  return {
    regime: r,
    mark: WIPE.mark[r] * u,
    word: Math.min(WIPE.word[r] * u, maxWord / (Math.max(p.brand.length, 3) * 0.6)),
    tag: Math.min(WIPE.tag[r] * u, maxTag / (Math.max(p.tagline.length, 8) * 0.5)),
    gap: WIPE.gap[r] * u,
    tagGap: WIPE.tagGap[r] * u,
  };
};

// One curved edge: `s` is its position along the sweep axis, `b` the depth of its forward bow.
const edgeAt = (t: number, length: number, bow: number) => ({
  s: mix(-bow, length, t),
  b: bow * (WIPE.bowRest + (1 - WIPE.bowRest) * Math.sin(Math.PI * t)),
});

export const CurveWipe: React.FC<CurveWipeProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, width, height } = useLayout();
  const Z = sizesFor(p, width, height, u);
  const up = p.direction === "up";
  const vertical = Z.regime === "vertical";

  // Sweep axis: x for "left", bottom → top for "up". M is the length of the edge itself.
  const L = up ? height : width;
  const M = up ? width : height;
  const bow = WIPE.bow * M;
  const P = (s: number, m: number) => (up ? `${m.toFixed(2)} ${(height - s).toFixed(2)}` : `${s.toFixed(2)} ${m.toFixed(2)}`);
  // The region from a curved edge to beyond the far side of the frame (a quadratic bow, apex at the edge's middle).
  const far = L + 2 * bow;
  const region = ({ s, b }: { s: number; b: number }) =>
    `M ${P(s, 0)} Q ${P(s + 2 * b, M / 2)} ${P(s, M)} L ${P(far, M)} L ${P(far, 0)} Z`;

  const lead = edgeAt(progress(frame, WIPE.accent[0], WIPE.accent[1], "travel"), L, bow);
  const trail = edgeAt(progress(frame, WIPE.field[0], WIPE.field[1], "travel"), L, bow);

  const push = (1 - progress(frame, WIPE.push[0], WIPE.push[1], "enter")) * WIPE.pushPx * u;
  const shift = up ? `translateY(${push.toFixed(2)}px)` : `translateX(${(-push).toFixed(2)}px)`;
  const kTag = progress(frame, WIPE.tagline[0], WIPE.tagline[1], "enter");

  return (
    <AbsoluteFill style={{ background: p.background, alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      {/* The lockup sits in place on the background from frame 0; the wipe fields cover it until the second edge passes. */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: shift }}>
        <div style={{ display: "flex", flexDirection: vertical ? "column" : "row", alignItems: "center", gap: Z.gap }}>
          <Img
            src={sampleLogoFor(p.logo, p.ink)}
            style={{ width: Z.mark, height: Z.mark, objectFit: "contain", display: "block", flexShrink: 0 }}
          />
          <div
            style={{
              fontSize: Z.word,
              fontWeight: WIPE.weight,
              letterSpacing: `${WIPE.tracking}em`,
              lineHeight: 1.1,
              whiteSpace: "nowrap",
              color: p.ink,
            }}
          >
            {p.brand}
          </div>
        </div>
        {p.tagline ? (
          <div
            style={{
              marginTop: Z.tagGap,
              fontSize: Z.tag,
              fontWeight: 400,
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              color: p.ink,
              opacity: 0.6 * kTag,
              transform: `translateY(${((1 - kTag) * WIPE.rise * u).toFixed(2)}px)`,
            }}
          >
            {p.tagline}
          </div>
        ) : null}
      </div>

      {/* The two fields in one SVG: the accent runs from the trailing edge onwards, and a background-coloured cover
          runs from the accent's leading edge onwards, on top. Behind the trailing edge nothing is drawn, so the
          lockup shows through exactly along the curve. */}
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        <path d={region(trail)} fill={p.accent} />
        <path d={region(lead)} fill={p.background} />
      </svg>
    </AbsoluteFill>
  );
};
