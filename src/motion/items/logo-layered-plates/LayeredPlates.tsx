import React from "react";
import { AbsoluteFill, Img, spring, useCurrentFrame } from "remotion";
import { sampleLogoFor } from "../../film";
import { FONT_SANS, RADIUS, SPRING_CONFIG, STROKE, alpha, mix, progress, useLayout } from "../../kit";

export type LayeredPlatesProps = {
  background: string;
  card: string; // the top plate, which holds the logo
  line: string; // its hairline border
  ink: string; // wordmark; the middle plate is this at 12%
  ink2: string; // tagline
  accent: string; // the bottom plate
  logo: string;
  brand: string;
  tagline: string;
  offset: number; // px each lower plate sits down-right of the one above in the final lockup
  spread: number; // px the plates are misregistered by when they land
};

// Frames, shared with the prompt. Springs are [start, length].
export const T = {
  enter: 30, // each plate's slide-in spring
  stagger: 4, // between plates (bottom first)
  fadeIn: 10, // each plate fades in over its first frames
  travel: 220, // px each plate travels in along its diagonal
  register: [40, 26] as const, // spring: misregistered → perfectly aligned
  slide: [64, 30] as const, // spring: the plate stack moves aside for the wordmark
  step: [70, 24] as const, // spring: the lower plates step out into the shadow stack
  letters: 74, // first letter
  letterDur: 18, // each letter's rise (enter)
  letterStagger: 2,
  rise: 28, // px each letter rises
  tagDelay: 6, // tagline starts this long after the last letter starts
  total: 150,
} as const;
export const MIDDLE_ALPHA = 0.12;
export const LOGO_BOX = 0.56; // the logo's square box as a fraction of the plate
export const TAG_GAP = 0.14;
export const TRACKING = -0.03;

// Bottom to top. `dir` is the diagonal each plate slides in along; `stack` is its final down-right step count.
const D = Math.SQRT1_2;
export const PLATES = [
  { name: "accent", dir: [-D, D] as const, from: "bottom-left", stack: 2 },
  { name: "ink 12%", dir: [D, -D] as const, from: "top-right", stack: 1 },
  { name: "card", dir: [-D, -D] as const, from: "top-left", stack: 0 },
] as const;
// The misregistered landing spot sits `spread × MISREG` along each plate's diagonal (≈ spread apart pairwise).
export const MISREG = 0.7;

export const letterStart = (i: number) => T.letters + i * T.letterStagger;
export const tagStart = (brand: string) => letterStart(Math.max(0, Array.from(brand).length - 1)) + T.tagDelay;
export const landedAt = (brand: string, tagline: string) =>
  Math.max(T.slide[0] + T.slide[1], T.step[0] + T.step[1], letterStart(Math.max(0, Array.from(brand).length - 1)) + T.letterDur, tagline ? tagStart(brand) + T.letterDur : 0);

const BASE = {
  wide: { plate: 240, font: 150, tag: 30, gap: 72, span: 0.5 },
  square: { plate: 200, font: 120, tag: 26, gap: 60, span: 0.82 },
  tall: { plate: 280, font: 150, tag: 34, gap: 84, span: 0.84 },
} as const;

// Inter 500 at -0.03em averages ≈ 0.56em per character; Inter 400 ≈ 0.5em.
export const sizesFor = (brand: string, tagline: string, width: number, height: number, u: number) => {
  const kind = width === height ? "square" : width > height ? "wide" : "tall";
  const b = BASE[kind];
  const plate = b.plate * u;
  const gap = b.gap * u;
  const avail = kind === "tall" ? width * b.span : width * b.span - plate - gap;
  const font = Math.min(b.font * u, avail / (Math.max(brand.length, 3) * 0.56));
  const tag = tagline ? Math.min(b.tag * u, avail / (Math.max(tagline.length, 8) * 0.5)) : 0;
  const blockW = Math.max(brand.length * 0.56 * font, tagline.length * 0.5 * tag);
  const brandH = font * 1.1;
  const tagGap = TAG_GAP * font;
  const blockH = brandH + (tagline ? tagGap + tag * 1.3 : 0);
  return { kind, plate, gap, font, tag, blockW, brandH, tagGap, blockH };
};
type Sizes = ReturnType<typeof sizesFor>;

// Where the stack starts (frame centre) and lands, and where the text block sits.
export const geometry = (S: Sizes, width: number, height: number, vertical: boolean) => {
  const from = { x: width / 2, y: height / 2 };
  if (!vertical) {
    const x0 = (width - (S.plate + S.gap + S.blockW)) / 2;
    return { from, to: { x: x0 + S.plate / 2, y: height / 2 }, text: { x: x0 + S.plate + S.gap, y: height / 2 - S.blockH / 2 } };
  }
  const y0 = (height - (S.plate + S.gap + S.blockH)) / 2;
  return { from, to: { x: width / 2, y: y0 + S.plate / 2 }, text: { x: 0, y: y0 + S.plate + S.gap } };
};

const sp = (frame: number, fps: number, start: number, length: number) =>
  Math.min(1, spring({ frame: Math.max(0, frame - start), fps, config: SPRING_CONFIG, durationInFrames: length }));

export const LayeredPlates: React.FC<LayeredPlatesProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, width, height, fps, isVertical } = useLayout();
  const S = sizesFor(p.brand, p.tagline, width, height, u);
  const G = geometry(S, width, height, isVertical);

  const reg = sp(frame, fps, T.register[0], T.register[1]);
  const slide = sp(frame, fps, T.slide[0], T.slide[1]);
  const step = sp(frame, fps, T.step[0], T.step[1]);
  const cx = mix(G.from.x, G.to.x, slide);
  const cy = mix(G.from.y, G.to.y, slide);
  const fills = [p.accent, alpha(p.ink, MIDDLE_ALPHA), p.card];
  const box = LOGO_BOX * S.plate;
  const letters = Array.from(p.brand);
  const tagK = progress(frame, tagStart(p.brand), tagStart(p.brand) + T.letterDur, "enter");

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT_SANS }}>
      {PLATES.map((plate, i) => {
        const start = i * T.stagger;
        const e = sp(frame, fps, start, T.enter);
        // Along the diagonal: from far out, to the misregistered spot, then into register; then the stack step.
        const along = (p.spread * MISREG + T.travel * (1 - e)) * u * (1 - reg);
        const stackStep = plate.stack * p.offset * u * step;
        const x = cx - S.plate / 2 + plate.dir[0] * along + stackStep;
        const y = cy - S.plate / 2 + plate.dir[1] * along + stackStep;
        const isTop = plate.stack === 0;
        return (
          <div
            key={plate.name}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: S.plate,
              height: S.plate,
              borderRadius: RADIUS.hero * u,
              background: fills[i],
              boxShadow: isTop ? `inset 0 0 0 ${STROKE.hair * u}px ${p.line}` : undefined,
              opacity: progress(frame, start, start + T.fadeIn, "enter"),
              transform: `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isTop ? (
              <Img src={sampleLogoFor(p.logo, p.ink)} style={{ width: box, height: box, objectFit: "contain", display: "block" }} />
            ) : null}
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          left: isVertical ? 0 : G.text.x,
          top: G.text.y,
          width: isVertical ? width : undefined,
          textAlign: isVertical ? "center" : "left",
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ fontSize: S.font, fontWeight: 500, letterSpacing: `${TRACKING}em`, lineHeight: 1.1, color: p.ink }}>
          {letters.map((ch, i) => {
            const k = progress(frame, letterStart(i), letterStart(i) + T.letterDur, "enter");
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  opacity: k,
                  transform: `translateY(${((1 - k) * T.rise * u).toFixed(2)}px)`,
                }}
              >
                {ch === " " ? " " : ch}
              </span>
            );
          })}
        </div>
        {p.tagline ? (
          <div
            style={{
              marginTop: S.tagGap,
              fontSize: S.tag,
              fontWeight: 400,
              letterSpacing: "-0.01em",
              lineHeight: 1.3,
              color: p.ink2,
              opacity: tagK,
              transform: `translateY(${((1 - tagK) * (T.rise / 2) * u).toFixed(2)}px)`,
            }}
          >
            {p.tagline}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
